from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class SignupReq(BaseModel):
    company_name: str
    admin_name: str
    email: str
    password: str
    country: str
    currency: str

class LoginReq(BaseModel):
    email: str
    password: str

class ChangePwdReq(BaseModel):
    old_password: str
    new_password: str

@router.post("/signup")
def signup(req: SignupReq):
    db = get_db()
    try:
        if db.execute("SELECT id FROM users WHERE email=?", (req.email,)).fetchone():
            raise HTTPException(400, "Email already registered")
        db.execute("INSERT INTO companies (name,country,default_currency) VALUES (?,?,?)",
                   (req.company_name, req.country, req.currency))
        company_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.execute("""INSERT INTO users (company_id,name,email,password_hash,role,must_change_password)
                      VALUES (?,?,?,?,'admin',0)""",
                   (company_id, req.admin_name, req.email, hash_password(req.password)))
        db.commit()
        return {"message": "Account created successfully"}
    finally:
        db.close()

@router.post("/login")
def login(req: LoginReq):
    db = get_db()
    try:
        user = db.execute("SELECT * FROM users WHERE email=?", (req.email,)).fetchone()
        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(401, "Invalid credentials")
        token = create_token({"user_id": user["id"], "role": user["role"]})
        return {
            "access_token": token, "token_type": "bearer",
            "role": user["role"], "user_name": user["name"],
            "user_id": user["id"], "must_change_password": bool(user["must_change_password"])
        }
    finally:
        db.close()

@router.post("/change-password")
def change_password(req: ChangePwdReq, cu=Depends(get_current_user)):
    db = get_db()
    try:
        user = db.execute("SELECT * FROM users WHERE id=?", (cu["id"],)).fetchone()
        if not verify_password(req.old_password, user["password_hash"]):
            raise HTTPException(400, "Old password incorrect")
        db.execute("UPDATE users SET password_hash=?,must_change_password=0 WHERE id=?",
                   (hash_password(req.new_password), cu["id"]))
        db.commit()
        return {"message": "Password changed"}
    finally:
        db.close()

@router.get("/me")
def me(cu=Depends(get_current_user)):
    db = get_db()
    try:
        company = db.execute("SELECT * FROM companies WHERE id=?", (cu["company_id"],)).fetchone()
        return {**cu, "company_name": company["name"] if company else None,
                "default_currency": company["default_currency"] if company else None}
    finally:
        db.close()