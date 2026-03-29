from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Literal
from database import get_db
from auth import hash_password, require_role
from services.email_service import send_email

router = APIRouter(prefix="/admin", tags=["admin"])

# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

APPROVER_ROLES = {"manager", "finance_head", "director"}
ROLE_DESIGNATIONS = {"manager": "Manager", "finance_head": "Finance Head", "director": "Director"}

class CreateUserReq(BaseModel):
    name: str
    email: str
    password: str
    role: Literal["employee", "manager", "finance_head", "director"] = "employee"
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

class RelationshipReq(BaseModel):
    head_user_id: int
    member_user_id: int

class RiskThresholdReq(BaseModel):
    risk_level: Literal["low", "medium", "high"]
    min_amount: float = 0
    max_amount: Optional[float] = None

class TrustScoreReq(BaseModel):
    employee_id: int
    trust_score: float

# ---------------------------------------------------------------------------
# SMTP settings
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Unified user creation (employee / manager / finance_head / director)
# ---------------------------------------------------------------------------

@router.post("/users")
def create_user(req: CreateUserReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        if db.execute("SELECT id FROM users WHERE email=?", (req.email,)).fetchone():
            raise HTTPException(400, "Email already exists")

        is_approver = 1 if req.role in APPROVER_ROLES else 0
        approver_designation = ROLE_DESIGNATIONS.get(req.role)

        db.execute(
            """INSERT INTO users
               (company_id,name,email,password_hash,role,manager_id,is_approver,
                approver_designation,is_manager_approver,must_change_password)
               VALUES (?,?,?,?,?,?,?,?,?,1)""",
            (cu["company_id"], req.name, req.email, hash_password(req.password),
             req.role, req.manager_id, is_approver, approver_designation,
             int(req.is_manager_approver))
        )
        uid = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        for m in (req.approver_mappings or []):
            db.execute(
                "INSERT INTO employee_approver_mappings (employee_id,approver_id,step_order) VALUES (?,?,?)",
                (uid, m["approver_id"], m["step_order"])
            )

        db.commit()

        c = db.execute("SELECT * FROM companies WHERE id=?", (cu["company_id"],)).fetchone()
        if c and c["smtp_email"]:
            send_email(c["smtp_email"], c["smtp_app_password"], req.email, req.name, req.password)

        return {"id": uid, "message": f"{req.role.replace('_',' ').title()} created"}
    finally:
        db.close()

# Keep legacy endpoints for backward compatibility
@router.post("/approvers")
def create_approver(req: CreateUserReq, cu=Depends(require_role("admin"))):
    req.role = "manager"
    return create_user(req, cu)

@router.post("/employees")
def create_employee(req: CreateUserReq, cu=Depends(require_role("admin"))):
    return create_user(req, cu)

# ---------------------------------------------------------------------------
# List / delete users
# ---------------------------------------------------------------------------

@router.get("/approvers")
def list_approvers(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT id,name,email,role,approver_designation,is_manager_approver,trust_score,last_seen,created_at
               FROM users WHERE company_id=? AND is_approver=1""",
            (cu["company_id"],)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.delete("/approvers/{aid}")
def delete_approver(aid: int, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM employee_approver_mappings WHERE approver_id=?", (aid,))
        db.execute("DELETE FROM approval_steps WHERE approver_id=?", (aid,))
        db.execute("DELETE FROM role_relationships WHERE head_user_id=? OR member_user_id=?", (aid, aid))
        db.execute("DELETE FROM users WHERE id=? AND company_id=?", (aid, cu["company_id"]))
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()

@router.get("/employees")
def list_employees(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT u.id,u.name,u.email,u.role,u.is_manager_approver,u.trust_score,
                      u.last_seen,u.created_at, m.name as manager_name
               FROM users u LEFT JOIN users m ON m.id=u.manager_id
               WHERE u.company_id=? AND u.role!='admin'
               ORDER BY u.role, u.created_at DESC""",
            (cu["company_id"],)
        ).fetchall()
        result = []
        for r in rows:
            e = dict(r)
            maps = db.execute(
                """SELECT eam.step_order,eam.approver_id,u.name as approver_name,u.approver_designation
                   FROM employee_approver_mappings eam
                   JOIN users u ON u.id=eam.approver_id
                   WHERE eam.employee_id=? ORDER BY eam.step_order""",
                (r["id"],)
            ).fetchall()
            e["approver_chain"] = [dict(m) for m in maps]
            result.append(e)
        return result
    finally:
        db.close()

@router.delete("/employees/{eid}")
def delete_employee(eid: int, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM approval_steps WHERE expense_id IN (SELECT id FROM expenses WHERE user_id=?)", (eid,))
        db.execute("DELETE FROM expense_lines WHERE expense_id IN (SELECT id FROM expenses WHERE user_id=?)", (eid,))
        db.execute("DELETE FROM expenses WHERE user_id=?", (eid,))
        db.execute("DELETE FROM employee_approver_mappings WHERE employee_id=?", (eid,))
        db.execute("DELETE FROM role_relationships WHERE head_user_id=? OR member_user_id=?", (eid, eid))
        db.execute("DELETE FROM users WHERE id=? AND company_id=?", (eid, cu["company_id"]))
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Current users (online / last seen, grouped by role)
# ---------------------------------------------------------------------------

@router.get("/current-users")
def current_users(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT id,name,email,role,trust_score,last_seen,created_at
               FROM users WHERE company_id=? AND role!='admin'
               ORDER BY last_seen DESC NULLS LAST""",
            (cu["company_id"],)
        ).fetchall()
        grouped = {"employee": [], "manager": [], "finance_head": [], "director": []}
        for r in rows:
            d = dict(r)
            role = d.get("role", "employee")
            if role in grouped:
                grouped[role].append(d)
        return grouped
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Trust score
# ---------------------------------------------------------------------------

@router.post("/trust-score")
def update_trust_score(req: TrustScoreReq, cu=Depends(require_role("admin", "manager"))):
    if not (0 <= req.trust_score <= 100):
        raise HTTPException(400, "Trust score must be between 0 and 100")
    db = get_db()
    try:
        emp = db.execute("SELECT company_id FROM users WHERE id=?", (req.employee_id,)).fetchone()
        if not emp or emp["company_id"] != cu["company_id"]:
            raise HTTPException(404, "Employee not found")
        db.execute("UPDATE users SET trust_score=? WHERE id=?", (req.trust_score, req.employee_id))
        db.commit()
        return {"message": "Trust score updated"}
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Role relationships (Finance Head <-> Managers, Director <-> Staff)
# ---------------------------------------------------------------------------

@router.get("/relationships")
def list_relationships(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT rr.id, rr.head_user_id, rr.member_user_id,
                      h.name as head_name, h.role as head_role,
                      m.name as member_name, m.role as member_role
               FROM role_relationships rr
               JOIN users h ON h.id=rr.head_user_id
               JOIN users m ON m.id=rr.member_user_id
               WHERE rr.company_id=?""",
            (cu["company_id"],)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.post("/relationships")
def create_relationship(req: RelationshipReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        # Validate both users belong to this company
        head = db.execute("SELECT id,role FROM users WHERE id=? AND company_id=?",
                          (req.head_user_id, cu["company_id"])).fetchone()
        member = db.execute("SELECT id,role FROM users WHERE id=? AND company_id=?",
                            (req.member_user_id, cu["company_id"])).fetchone()
        if not head or not member:
            raise HTTPException(404, "User not found in this company")
        try:
            db.execute(
                "INSERT INTO role_relationships (company_id,head_user_id,member_user_id) VALUES (?,?,?)",
                (cu["company_id"], req.head_user_id, req.member_user_id)
            )
            db.commit()
        except Exception:
            raise HTTPException(400, "Relationship already exists")
        return {"message": "Relationship created"}
    finally:
        db.close()

@router.delete("/relationships/{rid}")
def delete_relationship(rid: int, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM role_relationships WHERE id=? AND company_id=?", (rid, cu["company_id"]))
        db.commit()
        return {"message": "Relationship removed"}
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Risk thresholds
# ---------------------------------------------------------------------------

@router.get("/risk-thresholds")
def list_risk_thresholds(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM risk_thresholds WHERE company_id=? ORDER BY min_amount",
                          (cu["company_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.post("/risk-thresholds")
def set_risk_threshold(req: RiskThresholdReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        # Replace existing threshold for this risk level
        db.execute("DELETE FROM risk_thresholds WHERE company_id=? AND risk_level=?",
                   (cu["company_id"], req.risk_level))
        db.execute(
            "INSERT INTO risk_thresholds (company_id,risk_level,min_amount,max_amount) VALUES (?,?,?,?)",
            (cu["company_id"], req.risk_level, req.min_amount, req.max_amount)
        )
        db.commit()
        return {"message": f"{req.risk_level} threshold saved"}
    finally:
        db.close()

@router.delete("/risk-thresholds/{tid}")
def delete_risk_threshold(tid: int, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM risk_thresholds WHERE id=? AND company_id=?", (tid, cu["company_id"]))
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Expenses (admin view)
# ---------------------------------------------------------------------------

@router.get("/expenses")
def all_expenses(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT e.*,u.name as employee_name,u.email as employee_email,c.default_currency
               FROM expenses e JOIN users u ON u.id=e.user_id
               JOIN companies c ON c.id=u.company_id
               WHERE u.company_id=? ORDER BY e.created_at DESC""",
            (cu["company_id"],)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Approval flow templates
# ---------------------------------------------------------------------------

@router.post("/approval-flow")
def save_flow(req: FlowReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute("DELETE FROM approval_flow_templates WHERE company_id=?", (cu["company_id"],))
        for s in req.steps:
            db.execute(
                "INSERT INTO approval_flow_templates (company_id,step_order,approver_designation,is_manager_step) VALUES (?,?,?,?)",
                (cu["company_id"], s.step_order, s.approver_designation, int(s.is_manager_step))
            )
        db.commit()
        return {"message": "Flow saved"}
    finally:
        db.close()

@router.get("/approval-flow")
def get_flow(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM approval_flow_templates WHERE company_id=? ORDER BY step_order",
                          (cu["company_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Approval rules
# ---------------------------------------------------------------------------

@router.post("/approval-rules")
def create_rule(req: RuleReq, cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        db.execute(
            """INSERT INTO approval_rules (company_id,rule_type,threshold_percentage,specific_approver_id,min_amount,max_amount,category)
               VALUES (?,?,?,?,?,?,?)""",
            (cu["company_id"], req.rule_type, req.threshold_percentage,
             req.specific_approver_id, req.min_amount, req.max_amount, req.category)
        )
        db.commit()
        return {"message": "Rule created"}
    finally:
        db.close()

@router.get("/approval-rules")
def list_rules(cu=Depends(require_role("admin"))):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT ar.*,u.name as approver_name FROM approval_rules ar
               LEFT JOIN users u ON u.id=ar.specific_approver_id
               WHERE ar.company_id=?""",
            (cu["company_id"],)
        ).fetchall()
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
