from datetime import datetime
from database import get_db


def _determine_risk_level(converted_amount: float, company_id: int, db) -> str:
    """Return 'low', 'medium', or 'high' based on company risk thresholds."""
    thresholds = db.execute(
        "SELECT * FROM risk_thresholds WHERE company_id=? ORDER BY min_amount",
        (company_id,)
    ).fetchall()
    if not thresholds:
        return "low"
    for t in sorted(thresholds, key=lambda x: -(x["min_amount"] or 0)):
        min_a = t["min_amount"] or 0
        max_a = t["max_amount"]
        if converted_amount >= min_a and (max_a is None or converted_amount <= max_a):
            return t["risk_level"]
    return "low"


def build_approval_steps(expense_id: int, user_id: int, company_id: int):
    db = get_db()
    try:
        emp = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        expense = db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone()

        # Determine risk level from converted amount + company thresholds
        converted = expense["converted_amount"] or expense["amount"]
        risk_level = _determine_risk_level(converted, company_id, db)
        db.execute("UPDATE expenses SET risk_level=? WHERE id=?", (risk_level, expense_id))

        # If explicit per-employee mappings exist, use those regardless of risk
        mappings = db.execute(
            "SELECT * FROM employee_approver_mappings WHERE employee_id=? ORDER BY step_order",
            (user_id,)
        ).fetchall()

        if mappings:
            for m in mappings:
                db.execute(
                    "INSERT INTO approval_steps (expense_id,approver_id,step_order) VALUES (?,?,?)",
                    (expense_id, m["approver_id"], m["step_order"])
                )
            db.commit()
            return

        # Risk-based routing via hierarchy
        manager_id = emp["manager_id"] if emp else None

        if not manager_id:
            # No manager assigned — auto-approve
            db.execute("UPDATE expenses SET status='approved' WHERE id=?", (expense_id,))
            db.commit()
            return

        steps = [(1, manager_id)]

        if risk_level in ("medium", "high"):
            # Find Finance Head above this manager
            fh = db.execute(
                "SELECT head_user_id FROM role_relationships WHERE member_user_id=?",
                (manager_id,)
            ).fetchone()
            if fh:
                steps.append((2, fh["head_user_id"]))

                if risk_level == "high":
                    # Find Director above Finance Head
                    director = db.execute(
                        "SELECT head_user_id FROM role_relationships WHERE member_user_id=?",
                        (fh["head_user_id"],)
                    ).fetchone()
                    if director:
                        steps.append((3, director["head_user_id"]))

        for step_order, approver_id in steps:
            db.execute(
                "INSERT INTO approval_steps (expense_id,approver_id,step_order) VALUES (?,?,?)",
                (expense_id, approver_id, step_order)
            )
        db.commit()
    finally:
        db.close()


def process_approval_action(expense_id: int, approver_id: int, action: str, comment: str):
    db = get_db()
    try:
        expense = db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone()
        if not expense:
            return {"error": "Expense not found"}

        step = db.execute(
            """SELECT * FROM approval_steps
               WHERE expense_id=? AND approver_id=? AND status='pending'
               ORDER BY step_order LIMIT 1""",
            (expense_id, approver_id)
        ).fetchone()
        if not step:
            return {"error": "No pending step for this approver"}

        now = datetime.utcnow().isoformat()

        # --- REJECT ---
        if action == "reject":
            db.execute(
                "UPDATE approval_steps SET status='rejected',comment=?,acted_at=? WHERE id=?",
                (comment, now, step["id"])
            )
            db.execute(
                "UPDATE approval_steps SET status='skipped' WHERE expense_id=? AND step_order>? AND status='pending'",
                (expense_id, step["step_order"])
            )
            db.execute("UPDATE expenses SET status='rejected' WHERE id=?", (expense_id,))
            db.commit()
            return {"status": "rejected"}

        # --- ESCALATE ---
        if action == "escalate":
            db.execute(
                "UPDATE approval_steps SET status='escalated',comment=?,acted_at=? WHERE id=?",
                (comment, now, step["id"])
            )
            # Find Finance Head above this approver
            fh = db.execute(
                "SELECT head_user_id FROM role_relationships WHERE member_user_id=?",
                (approver_id,)
            ).fetchone()
            if not fh:
                return {"error": "No Finance Head assigned above you"}

            fh_id = fh["head_user_id"]
            # Check if Finance Head step already exists
            existing = db.execute(
                "SELECT id FROM approval_steps WHERE expense_id=? AND approver_id=?",
                (expense_id, fh_id)
            ).fetchone()
            if not existing:
                next_order = step["step_order"] + 1
                # Shift any remaining pending steps to make room
                db.execute(
                    "UPDATE approval_steps SET step_order=step_order+1 WHERE expense_id=? AND step_order>=? AND status='pending'",
                    (expense_id, next_order)
                )
                db.execute(
                    "INSERT INTO approval_steps (expense_id,approver_id,step_order) VALUES (?,?,?)",
                    (expense_id, fh_id, next_order)
                )
            db.execute("UPDATE expenses SET current_step=? WHERE id=?",
                       (step["step_order"] + 1, expense_id))
            db.commit()
            return {"status": "escalated", "next_step": step["step_order"] + 1}

        # --- APPROVE ---
        db.execute(
            "UPDATE approval_steps SET status='approved',comment=?,acted_at=? WHERE id=?",
            (comment, now, step["id"])
        )

        emp = db.execute("SELECT company_id FROM users WHERE id=?", (expense["user_id"],)).fetchone()
        rule_result = check_rules(expense_id, approver_id, emp["company_id"], step["step_order"], db)

        if rule_result == "approved":
            db.execute(
                "UPDATE approval_steps SET status='skipped' WHERE expense_id=? AND step_order>? AND status='pending'",
                (expense_id, step["step_order"])
            )
            db.execute("UPDATE expenses SET status='approved' WHERE id=?", (expense_id,))
            db.commit()
            return {"status": "approved", "reason": "conditional_rule"}

        next_step = db.execute(
            """SELECT * FROM approval_steps
               WHERE expense_id=? AND step_order>? AND status='pending'
               ORDER BY step_order LIMIT 1""",
            (expense_id, step["step_order"])
        ).fetchone()

        if next_step:
            db.execute("UPDATE expenses SET current_step=? WHERE id=?",
                       (next_step["step_order"], expense_id))
            db.commit()
            return {"status": "pending", "next_step": next_step["step_order"]}
        else:
            db.execute("UPDATE expenses SET status='approved' WHERE id=?", (expense_id,))
            db.commit()
            return {"status": "approved"}

    finally:
        db.close()


def check_rules(expense_id, approver_id, company_id, current_step_order, db):
    expense = db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone()
    rules = db.execute("SELECT * FROM approval_rules WHERE company_id=? AND is_active=1",
                       (company_id,)).fetchall()
    all_steps = db.execute("SELECT * FROM approval_steps WHERE expense_id=? ORDER BY step_order",
                           (expense_id,)).fetchall()
    total = len(all_steps)
    approved = sum(1 for s in all_steps if s["status"] == "approved")

    for rule in rules:
        if rule["min_amount"] and expense["converted_amount"] and expense["converted_amount"] < rule["min_amount"]:
            continue
        if rule["max_amount"] and expense["converted_amount"] and expense["converted_amount"] > rule["max_amount"]:
            continue
        if rule["category"] and rule["category"].lower() != expense["category"].lower():
            continue
        rt = rule["rule_type"]
        pct = (approved / total * 100) if total else 0
        if rt == "percentage" and rule["threshold_percentage"] and pct >= rule["threshold_percentage"]:
            return "approved"
        elif rt == "specific_approver" and rule["specific_approver_id"] == approver_id:
            return "approved"
        elif rt == "hybrid":
            if (rule["threshold_percentage"] and pct >= rule["threshold_percentage"]) or \
               rule["specific_approver_id"] == approver_id:
                return "approved"
    return None


def get_expense_trail(expense_id):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT aps.*,u.name as approver_name,u.approver_designation,u.role as approver_role
               FROM approval_steps aps JOIN users u ON u.id=aps.approver_id
               WHERE aps.expense_id=? ORDER BY aps.step_order""",
            (expense_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()
