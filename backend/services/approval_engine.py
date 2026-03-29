from datetime import datetime
from database import get_db


def build_approval_steps(expense_id: int, user_id: int, company_id: int):
    """
    Fixed 3-step chain: Manager → Finance Head → Director
    Steps are created in order; current_step starts at 1.
    """
    db = get_db()
    try:
        emp = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()

        manager_id = emp["manager_id"] if emp else None

        if not manager_id:
            # No manager → auto-approve immediately
            db.execute("UPDATE expenses SET status='approved' WHERE id=?", (expense_id,))
            db.commit()
            return

        steps = [(1, manager_id)]

        # Step 2: Finance Head linked to this manager
        fh = db.execute(
            "SELECT head_user_id FROM role_relationships WHERE member_user_id=?",
            (manager_id,)
        ).fetchone()

        if fh:
            steps.append((2, fh["head_user_id"]))

            # Step 3: Director linked to the Finance Head
            director = db.execute(
                "SELECT head_user_id FROM role_relationships WHERE member_user_id=?",
                (fh["head_user_id"],)
            ).fetchone()

            if director:
                steps.append((3, director["head_user_id"]))

        for step_order, approver_id in steps:
            db.execute(
                "INSERT INTO approval_steps (expense_id, approver_id, step_order) VALUES (?,?,?)",
                (expense_id, approver_id, step_order)
            )

        db.execute("UPDATE expenses SET current_step=1 WHERE id=?", (expense_id,))
        db.commit()
    finally:
        db.close()


def process_approval_action(expense_id: int, approver_id: int, action: str, comment: str):
    db = get_db()
    try:
        expense = db.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone()
        if not expense:
            return {"error": "Expense not found"}

        # Only allow action on the current step
        step = db.execute(
            """SELECT aps.* FROM approval_steps aps
               WHERE aps.expense_id=? AND aps.approver_id=? AND aps.status='pending'
               AND aps.step_order = (SELECT current_step FROM expenses WHERE id=?)
               LIMIT 1""",
            (expense_id, approver_id, expense_id)
        ).fetchone()

        if not step:
            return {"error": "No pending step for this approver at the current stage"}

        now = datetime.utcnow().isoformat()

        if action == "reject":
            # Rejected — skip all remaining steps, expense denied
            db.execute(
                "UPDATE approval_steps SET status='rejected', comment=?, acted_at=? WHERE id=?",
                (comment, now, step["id"])
            )
            db.execute(
                "UPDATE approval_steps SET status='skipped' WHERE expense_id=? AND step_order>? AND status='pending'",
                (expense_id, step["step_order"])
            )
            db.execute("UPDATE expenses SET status='rejected' WHERE id=?", (expense_id,))
            db.commit()
            return {"status": "rejected"}

        if action == "escalate":
            # Escalate — pass to next level approver
            db.execute(
                "UPDATE approval_steps SET status='escalated', comment=?, acted_at=? WHERE id=?",
                (comment, now, step["id"])
            )
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
                return {"status": "escalated", "next_step": next_step["step_order"]}
            else:
                # Already at top — auto approve
                db.execute("UPDATE expenses SET status='approved' WHERE id=?", (expense_id,))
                db.commit()
                return {"status": "approved"}

        # Approve — fully approved, skip all remaining steps, chain ends
        db.execute(
            "UPDATE approval_steps SET status='approved', comment=?, acted_at=? WHERE id=?",
            (comment, now, step["id"])
        )
        db.execute(
            "UPDATE approval_steps SET status='skipped' WHERE expense_id=? AND step_order>? AND status='pending'",
            (expense_id, step["step_order"])
        )
        db.execute("UPDATE expenses SET status='approved' WHERE id=?", (expense_id,))
        db.commit()
        return {"status": "approved"}

    finally:
        db.close()


def get_expense_trail(expense_id):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT aps.*, u.name as approver_name, u.approver_designation, u.role as approver_role
               FROM approval_steps aps JOIN users u ON u.id=aps.approver_id
               WHERE aps.expense_id=? ORDER BY aps.step_order""",
            (expense_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()
