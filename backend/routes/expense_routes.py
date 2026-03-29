from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
import json, os, shutil, uuid
from database import get_db
from auth import get_current_user
from services.approval_engine import build_approval_steps, get_expense_trail
from services.ocr_service import process_receipt
from services.currency_service import convert_currency
from services.email_service import send_approval_notification

router = APIRouter(prefix="/expenses", tags=["expenses"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/submit")
async def submit_expense(
    amount: float = Form(...),
    currency: str = Form(...),
    category: str = Form(...),
    description: str = Form(""),
    vendor_name: str = Form(""),
    date: str = Form(...),
    time: str = Form(""),
    location: str = Form(""),
    expense_lines: str = Form("[]"),
    receipt: Optional[UploadFile] = File(None),
    cu=Depends(get_current_user)
):
    db = get_db()
    try:
        emp = db.execute("SELECT company_id FROM users WHERE id=?", (cu["id"],)).fetchone()
        company = db.execute("SELECT default_currency FROM companies WHERE id=?",
                             (emp["company_id"],)).fetchone()
        default_currency = company["default_currency"]

        converted = await convert_currency(amount, currency, default_currency)

        receipt_path = None
        ocr_data = None
        ocr_match = None

        if receipt:
            ext = os.path.splitext(receipt.filename)[1]
            fname = f"receipt_{cu['id']}_{date.replace('-','')}_{uuid.uuid4().hex[:8]}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            with open(fpath, "wb") as f:
                shutil.copyfileobj(receipt.file, f)
            receipt_path = fname

            with open(fpath, "rb") as f:
                content = f.read()
            ocr_result = process_receipt(content)
            ocr_data = json.dumps(ocr_result)

            ocr_amount = ocr_result.get("amount")
            ocr_match = abs(ocr_amount - amount) < 1.0 if ocr_amount else None

        db.execute(
            """INSERT INTO expenses
               (user_id,amount,currency,converted_amount,category,description,vendor_name,
                date,time,location,receipt_image_path,ocr_raw_data,ocr_match_status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (cu["id"], amount, currency, converted, category, description, vendor_name,
             date, time, location, receipt_path, ocr_data,
             int(ocr_match) if ocr_match is not None else None)
        )
        expense_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        lines = json.loads(expense_lines)
        for line in lines:
            db.execute(
                "INSERT INTO expense_lines (expense_id,item_name,quantity,unit_price) VALUES (?,?,?,?)",
                (expense_id, line["item_name"], line.get("quantity", 1), line["unit_price"])
            )

        db.commit()
        build_approval_steps(expense_id, cu["id"], emp["company_id"])

        # Notify first approver
        company_full = db.execute("SELECT * FROM companies WHERE id=?", (emp["company_id"],)).fetchone()
        if company_full and company_full["smtp_email"]:
            first_step = db.execute(
                """SELECT u.email as approver_email, u.name as approver_name
                   FROM approval_steps aps JOIN users u ON u.id=aps.approver_id
                   WHERE aps.expense_id=? ORDER BY aps.step_order LIMIT 1""",
                (expense_id,)
            ).fetchone()
            if first_step:
                send_approval_notification(
                    smtp_email=company_full["smtp_email"],
                    smtp_app_password=company_full["smtp_app_password"],
                    to=first_step["approver_email"],
                    approver_name=first_step["approver_name"],
                    employee_name=cu["name"],
                    expense_id=expense_id,
                    amount=amount,
                    currency=currency,
                    category=category,
                )

        return {"id": expense_id, "message": "Expense submitted"}
    finally:
        db.close()


@router.post("/ocr")
async def ocr_receipt(receipt: UploadFile = File(...), cu=Depends(get_current_user)):
    content = await receipt.read()
    result = process_receipt(content)
    return result


@router.get("/my")
def my_expenses(cu=Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT e.*,c.default_currency FROM expenses e
               JOIN users u ON u.id=e.user_id
               JOIN companies c ON c.id=u.company_id
               WHERE e.user_id=? ORDER BY e.created_at DESC""",
            (cu["id"],)
        ).fetchall()
        result = []
        for r in rows:
            e = dict(r)
            e["trail"] = get_expense_trail(e["id"])
            lines = db.execute("SELECT * FROM expense_lines WHERE expense_id=?",
                               (e["id"],)).fetchall()
            e["expense_lines"] = [dict(l) for l in lines]
            result.append(e)
        return result
    finally:
        db.close()


@router.get("/{expense_id}")
def get_expense(expense_id: int, cu=Depends(get_current_user)):
    db = get_db()
    try:
        e = db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone()
        if not e:
            raise HTTPException(404, "Not found")
        is_owner = e["user_id"] == cu["id"]
        is_approver = db.execute(
            "SELECT 1 FROM approval_steps WHERE expense_id=? AND approver_id=?",
            (expense_id, cu["id"])
        ).fetchone()
        is_admin = cu["role"] == "admin"
        if not (is_owner or is_approver or is_admin):
            raise HTTPException(403, "Access denied")
        result = dict(e)
        result["trail"] = get_expense_trail(expense_id)
        result["expense_lines"] = [dict(l) for l in db.execute(
            "SELECT * FROM expense_lines WHERE expense_id=?", (expense_id,)).fetchall()]
        return result
    finally:
        db.close()
