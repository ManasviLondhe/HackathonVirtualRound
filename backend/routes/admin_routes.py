from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Literal
from database import get_db
from auth import hash_password, require_role
from services.email_service import send_email

router = APIRouter(prefix="/admin", tags=["admin"])

class CreateApproverReq(BaseModel):
    name: str
    email: str
    password: str
    approver_designation: str

class CreateEmployeeReq(BaseModel):
    name: str
    email: str
    password: str
    role: Literal["employee", "manager"] = "employee"
    manager_id: Optional[int] = None
    is_manager_approver: bool = False
    approver_mappings: Optional[List[dict]] = []

class SMTPReq(BaseModel):
    smtp_email: str
    smtp_app_password: str

class FlowStep(BaseModel):
    step_order: int
    approver_designation: str
    is_manager_step: bool = False

class FlowReq(BaseModel):
    steps: List[FlowStep]

class RuleReq(BaseModel):
    rule_type: str
    threshold_percentage: Optional[float] = None
    specific_approver_id: Optional[int] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    category: Optional[str] = None

@router.post("/settings/smtp")
def save_smtp(req: SMTPReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("UPDATE companies SET smtp_email=?,smtp_app_password=? WHERE id=?",
                   (req.smtp_email, req.smtp_app_password, cu["company_id"]))
        db.commit()
        return {"message": "SMTP saved"}
    finally:
        db.close()

@router.get("/settings/smtp")
def get_smtp(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        c = db.execute("SELECT smtp_email FROM companies WHERE id=?", (cu["company_id"],)).fetchone()
        return {"smtp_email": c["smtp_email"] if c else None}
    finally:
        db.close()

@router.post("/approvers")
def create_approver(req: CreateApproverReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        if db.execute("SELECT id FROM users WHERE email=?", (req.email,)).fetchone():
            raise HTTPException(400, "Email exists")
        db.execute("""INSERT INTO users (company_id,name,email,password_hash,role,is_approver,approver_designation,must_change_password)
                      VALUES (?,?,?,?,'manager',1,?,1)""",
                   (cu["company_id"], req.name, req.email, hash_password(req.password), req.approver_designation))
        db.commit()
        c = db.execute("SELECT * FROM companies WHERE id=?", (cu["company_id"],)).fetchone()
        if c and c["smtp_email"]:
            send_email(c["smtp_email"], c["smtp_app_password"], req.email, req.name)  # pwd omitted intentionally
        return {"message": "Approver created"}
    finally:
        db.close()

@router.get("/approvers")
def list_approvers(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute("""SELECT id,name,email,approver_designation,is_manager_approver,created_at
                             FROM users WHERE company_id=? AND is_approver=1""", (cu["company_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.delete("/approvers/{aid}")
def delete_approver(aid: int, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM employee_approver_mappings WHERE approver_id=?", (aid,))
        db.execute("DELETE FROM approval_steps WHERE approver_id=?", (aid,))
        db.execute("DELETE FROM users WHERE id=? AND company_id=?", (aid, cu["company_id"]))
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()

@router.post("/employees")
def create_employee(req: CreateEmployeeReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        if db.execute("SELECT id FROM users WHERE email=?", (req.email,)).fetchone():
            raise HTTPException(400, "Email exists")
        db.execute("""INSERT INTO users (company_id,name,email,password_hash,role,manager_id,is_manager_approver,must_change_password)
                      VALUES (?,?,?,?,?,?,?,1)""",
                   (cu["company_id"], req.name, req.email, hash_password(req.password),
                    req.role, req.manager_id, int(req.is_manager_approver)))
        uid = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        for m in (req.approver_mappings or []):
            db.execute("INSERT INTO employee_approver_mappings (employee_id,approver_id,step_order) VALUES (?,?,?)",
                       (uid, m["approver_id"], m["step_order"]))
        db.commit()
        c = db.execute("SELECT * FROM companies WHERE id=?", (cu["company_id"],)).fetchone()
        if c and c["smtp_email"]:
            send_email(c["smtp_email"], c["smtp_app_password"], req.email, req.name)  # pwd omitted intentionally
        return {"id": uid, "message": "Employee created"}
    finally:
        db.close()

@router.get("/employees")
def list_employees(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute("""SELECT u.id,u.name,u.email,u.role,u.is_manager_approver,u.created_at,
                                    m.name as manager_name
                             FROM users u LEFT JOIN users m ON m.id=u.manager_id
                             WHERE u.company_id=? AND u.role!='admin'
                             ORDER BY u.created_at DESC""", (cu["company_id"],)).fetchall()
        result = []
        for r in rows:
            e = dict(r)
            maps = db.execute("""SELECT eam.step_order,eam.approver_id,u.name as approver_name,u.approver_designation
                                 FROM employee_approver_mappings eam
                                 JOIN users u ON u.id=eam.approver_id
                                 WHERE eam.employee_id=? ORDER BY eam.step_order""", (r["id"],)).fetchall()
            e["approver_chain"] = [dict(m) for m in maps]
            result.append(e)
        return result
    finally:
        db.close()

@router.delete("/employees/{eid}")
def delete_employee(eid: int, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM employee_approver_mappings WHERE employee_id=?", (eid,))
        db.execute("DELETE FROM users WHERE id=? AND company_id=?", (eid, cu["company_id"]))
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()

@router.get("/expenses")
def all_expenses(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute("""SELECT e.*,u.name as employee_name,u.email as employee_email,c.default_currency
                             FROM expenses e JOIN users u ON u.id=e.user_id
                             JOIN companies c ON c.id=u.company_id
                             WHERE u.company_id=? ORDER BY e.created_at DESC""", (cu["company_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.post("/approval-flow")
def save_flow(req: FlowReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM approval_flow_templates WHERE company_id=?", (cu["company_id"],))
        for s in req.steps:
            db.execute("INSERT INTO approval_flow_templates (company_id,step_order,approver_designation,is_manager_step) VALUES (?,?,?,?)",
                       (cu["company_id"], s.step_order, s.approver_designation, int(s.is_manager_step)))
        db.commit()
        return {"message": "Flow saved"}
    finally:
        db.close()

@router.get("/approval-flow")
def get_flow(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM approval_flow_templates WHERE company_id=? ORDER BY step_order", (cu["company_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.post("/approval-rules")
def create_rule(req: RuleReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("""INSERT INTO approval_rules (company_id,rule_type,threshold_percentage,specific_approver_id,min_amount,max_amount,category)
                      VALUES (?,?,?,?,?,?,?)""",
                   (cu["company_id"], req.rule_type, req.threshold_percentage,
                    req.specific_approver_id, req.min_amount, req.max_amount, req.category))
        db.commit()
        return {"message": "Rule created"}
    finally:
        db.close()

@router.get("/approval-rules")
def list_rules(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute("""SELECT ar.*,u.name as approver_name FROM approval_rules ar
                             LEFT JOIN users u ON u.id=ar.specific_approver_id
                             WHERE ar.company_id=?""", (cu["company_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.delete("/approval-rules/{rid}")
def delete_rule(rid: int, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM approval_rules WHERE id=? AND company_id=?", (rid, cu["company_id"]))
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()