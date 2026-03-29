import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "reimbursement.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        default_currency TEXT NOT NULL,
        smtp_email TEXT,
        smtp_app_password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        must_change_password INTEGER DEFAULT 1,
        is_approver INTEGER DEFAULT 0,
        approver_designation TEXT,
        manager_id INTEGER,
        is_manager_approver INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (manager_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS employee_approver_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        approver_id INTEGER NOT NULL,
        step_order INTEGER NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES users(id),
        FOREIGN KEY (approver_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        converted_amount REAL,
        category TEXT NOT NULL,
        description TEXT,
        vendor_name TEXT,
        date TEXT NOT NULL,
        receipt_image_path TEXT,
        ocr_raw_data TEXT,
        ocr_match_status INTEGER,
        status TEXT DEFAULT 'pending',
        current_step INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS expense_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price REAL NOT NULL,
        FOREIGN KEY (expense_id) REFERENCES expenses(id)
    );
    CREATE TABLE IF NOT EXISTS approval_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER NOT NULL,
        approver_id INTEGER NOT NULL,
        step_order INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        comment TEXT,
        acted_at TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id),
        FOREIGN KEY (approver_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS approval_flow_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        step_order INTEGER NOT NULL,
        approver_designation TEXT NOT NULL,
        is_manager_step INTEGER DEFAULT 0,
        FOREIGN KEY (company_id) REFERENCES companies(id)
    );
    CREATE TABLE IF NOT EXISTS approval_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        rule_type TEXT NOT NULL,
        threshold_percentage REAL,
        specific_approver_id INTEGER,
        min_amount REAL,
        max_amount REAL,
        category TEXT,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (specific_approver_id) REFERENCES users(id)
    );
    """)
    conn.commit()
    conn.close()