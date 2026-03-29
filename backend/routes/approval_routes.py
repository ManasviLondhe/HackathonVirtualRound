from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_db
from auth import get_current_user
from services.approval_engine import process_approval_action, get_expense_trail

router = APIRouter(prefix="/approvals", tags=["approvals"])

class ActionReq(BaseModel):
    action: str   # 'approve' or 'reject'
    comment: str

@router.get("/pending")
def pending_approvals(cu=Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute("""
            SELECT e.*,u.name as employee_name,u.email as employee_email,
                   aps.step_order as my_step,c.default_currency
            FROM approval_steps aps
            JOIN expenses e ON e.id=aps.expense_id
            JOIN users u ON u.id=e.user_id
            JOIN companies c ON c.id=u.company_id
            WHERE aps.approver_id=? AND aps.status='pending' AND e.status='pending'
            ORDER BY e.created_at DESC
        """, (cu["id"],)).fetchall()
        result = []
        for r in rows:
            e = dict(r)
            e["trail"] = get_expense_trail(e["id"])
            result.append(e)
        return result
    finally:
        db.close()

@router.post("/{expense_id}/action")
def take_action(expense_id: int, req: ActionReq, cu=Depends(get_current_user)):
    if req.action not in ["approve", "reject"]:
        raise HTTPException(400, "Action must be approve or reject")
    result = process_approval_action(expense_id, cu["id"], req.action, req.comment)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result

@router.get("/history")
def approval_history(cu=Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute("""
            SELECT e.*,u.name as employee_name,aps.status as my_decision,
                   aps.comment as my_comment,aps.acted_at,c.default_currency
            FROM approval_steps aps
            JOIN expenses e ON e.id=aps.expense_id
            JOIN users u ON u.id=e.user_id
            JOIN companies c ON c.id=u.company_id
            WHERE aps.approver_id=? AND aps.status!='pending'
            ORDER BY aps.acted_at DESC
        """, (cu["id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()