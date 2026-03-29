from datetime import datetime
from database import get_db

def build_approval_steps(expense_id, user_id, company_id):
    db = get_db()
    try:
        emp = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        mappings = db.execute("""SELECT * FROM employee_approver_mappings
                                 WHERE employee_id=? ORDER BY step_order""", (user_id,)).fetchall()
        if not mappings:
            if emp and emp["manager_id"] and emp["is_manager_approver"]:
                db.execute("INSERT INTO approval_steps (expense_id,approver_id,step_order) VALUES (?,?,1)",
                           (expense_id, emp["manager_id"]))
        else:
            for m in mappings:
                db.execute("INSERT INTO approval_steps (expense_id,approver_id,step_order) VALUES (?,?,?)",
                           (expense_id, m["approver_id"], m["step_order"]))
        db.commit()
    finally:
        db.close()

def process_approval_action(expense_id, approver_id, action, comment):
    db = get_db()
    try:
        expense = db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone()
        if not expense:
            return {"error": "Expense not found"}

        step = db.execute("""SELECT * FROM approval_steps
                             WHERE expense_id=? AND approver_id=? AND status='pending'
                             ORDER BY step_order LIMIT 1""", (expense_id, approver_id)).fetchone()
        if not step:
            return {"error": "No pending step for this approver"}

        now = datetime.utcnow().isoformat()

        if action == "reject":
            db.execute("UPDATE approval_steps SET status='rejected',comment=?,acted_at=? WHERE id=?",
                       (comment, now, step["id"]))
            db.execute("UPDATE approval_steps SET status='skipped' WHERE expense_id=? AND step_order>? AND status='pending'",
                       (expense_id, step["step_order"]))
            db.execute("UPDATE expenses SET status='rejected' WHERE id=?", (expense_id,))
            db.commit()
            return {"status": "rejected"}

        # Approve
        db.execute("UPDATE approval_steps SET status='approved',comment=?,acted_at=? WHERE id=?",
                   (comment, now, step["id"]))

        emp = db.execute("SELECT company_id FROM users WHERE id=?", (expense["user_id"],)).fetchone()
        rule_result = check_rules(expense_id, approver_id, emp["company_id"], step["step_order"], db)

        if rule_result == "approved":
            db.execute("UPDATE approval_steps SET status='skipped' WHERE expense_id=? AND step_order>? AND status='pending'",
                       (expense_id, step["step_order"]))
            db.execute("UPDATE expenses SET status='approved' WHERE id=?", (expense_id,))
            db.commit()
            return {"status": "approved", "reason": "conditional_rule"}

        next_step = db.execute("""SELECT * FROM approval_steps
                                  WHERE expense_id=? AND step_order>? AND status='pending'
                                  ORDER BY step_order LIMIT 1""", (expense_id, step["step_order"])).fetchone()
        if next_step:
            db.execute("UPDATE expenses SET current_step=? WHERE id=?", (next_step["step_order"], expense_id))
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
    rules = db.execute("SELECT * FROM approval_rules WHERE company_id=? AND is_active=1", (company_id,)).fetchall()
    all_steps = db.execute("SELECT * FROM approval_steps WHERE expense_id=? ORDER BY step_order", (expense_id,)).fetchall()
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
        rows = db.execute("""SELECT aps.*,u.name as approver_name,u.approver_designation
                             FROM approval_steps aps JOIN users u ON u.id=aps.approver_id
                             WHERE aps.expense_id=? ORDER BY aps.step_order""", (expense_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()