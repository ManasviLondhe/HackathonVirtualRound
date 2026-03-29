from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import json, os, shutil
from database import get_db
from auth import get_current_user
from services.approval_engine import build_approval_steps, get_expense_trail
from services.ocr_service import process_receipt
import httpx

router = APIRouter(prefix="/expenses", tags=["expenses"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def convert_currency(amount, from_cur, to_cur):
    if from_cur == to_cur:
        return amount
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"https://api.exchangerate-api.com/v4/latest/{from_cur}")
            rates = r.json().get("rates", {})
            return round(amount * rates.get(to_cur, 1), 2)
    except:
        return amount

@router.post("/submit")
async def submit_expense(
    amount: float = Form(...),
    currency: str = Form(...),
    category: str = Form(...),
    description: str = Form(""),
    vendor_name: str = Form(""),
    date: str = Form(...),
    expense_lines: str = Form("[]"),
    receipt: Optional[UploadFile] = File(None),
    cu=Depends(get_current_user)
):
    db = get_db()
    try:
        emp = db.execute("SELECT company_id FROM users WHERE id=?", (cu["id"],)).fetchone()
        company = db.execute("SELECT default_currency FROM companies WHERE id=?", (emp["company_id"],)).fetchone()
        default_currency = company["default_currency"]

        converted = await convert_currency(amount, currency, default_currency)

        receipt_path = None
        ocr_data = None
        ocr_match = None

        if receipt:
            ext = os.path.splitext(receipt.filename)[1]
            fname = f"receipt_{cu['id']}_{date.replace('-','')}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            with open(fpath, "wb") as f:
                shutil.copyfileobj(receipt.file, f)
            receipt_path = fname

            content = open(fpath, "rb").read()
            ocr_result = process_receipt(content)
            ocr_data = json.dumps(ocr_result)

            # Check match
            ocr_amount = ocr_result.get("amount")
            ocr_match = abs(ocr_amount - amount) < 1.0 if ocr_amount else None

        db.execute("""INSERT INTO expenses
            (user_id,amount,currency,converted_amount,category,description,vendor_name,date,receipt_image_path,ocr_raw_data,ocr_match_status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (cu["id"], amount, currency, converted, category, description, vendor_name,
             date, receipt_path, ocr_data, int(ocr_match) if ocr_match is not None else None))
        expense_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        lines = json.loads(expense_lines)
        for line in lines:
            db.execute("INSERT INTO expense_lines (expense_id,item_name,quantity,unit_price) VALUES (?,?,?,?)",
                       (expense_id, line["item_name"], line.get("quantity",1), line["unit_price"]))

        db.commit()
        build_approval_steps(expense_id, cu["id"], emp["company_id"])
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
        rows = db.execute("""SELECT e.*,c.default_currency FROM expenses e
                             JOIN users u ON u.id=e.user_id
                             JOIN companies c ON c.id=u.company_id
                             WHERE e.user_id=? ORDER BY e.created_at DESC""", (cu["id"],)).fetchall()
        result = []
        for r in rows:
            e = dict(r)
            e["trail"] = get_expense_trail(e["id"])
            lines = db.execute("SELECT * FROM expense_lines WHERE expense_id=?", (e["id"],)).fetchall()
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
        result = dict(e)
        result["trail"] = get_expense_trail(expense_id)
        result["expense_lines"] = [dict(l) for l in db.execute(
            "SELECT * FROM expense_lines WHERE expense_id=?", (expense_id,)).fetchall()]
        return result
    finally:
        db.close()