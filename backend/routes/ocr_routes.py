from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from auth import get_current_user
from services.ocr_service import process_receipt
from database import get_db

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/scan")
async def scan_receipt(receipt: UploadFile = File(...), _cu=Depends(get_current_user)):
    """Upload a receipt image and get extracted fields back for pre-filling the expense form."""
    if not receipt.content_type or not receipt.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    content = await receipt.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(400, "File too large (max 10 MB)")
    result = process_receipt(content)
    if "error" in result:
        raise HTTPException(422, result["error"])
    return result


@router.get("/expense/{expense_id}")
def get_ocr_data(expense_id: int, cu=Depends(get_current_user)):
    """Return the stored OCR raw data for an expense."""
    import json
    db = get_db()
    try:
        row = db.execute(
            "SELECT ocr_raw_data, ocr_match_status, user_id FROM expenses WHERE id=?",
            (expense_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Expense not found")
        is_owner = row["user_id"] == cu["id"]
        is_approver = db.execute(
            "SELECT 1 FROM approval_steps WHERE expense_id=? AND approver_id=?",
            (expense_id, cu["id"])
        ).fetchone()
        if not (is_owner or is_approver or cu["role"] == "admin"):
            raise HTTPException(403, "Access denied")
        ocr_data = json.loads(row["ocr_raw_data"]) if row["ocr_raw_data"] else None
        return {
            "ocr_data": ocr_data,
            "ocr_match_status": bool(row["ocr_match_status"]) if row["ocr_match_status"] is not None else None,
        }
    finally:
        db.close()
