from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, httpx
from database import init_db
from routes.auth_routes import router as auth_router
from routes.admin_routes import router as admin_router
from routes.expense_routes import router as expense_router
from routes.approval_routes import router as approval_router
from routes.ocr_routes import router as ocr_router

app = FastAPI(title="Reimbursement API")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

init_db()
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(expense_router)
app.include_router(approval_router)
app.include_router(ocr_router)

@app.get("/")
def root():
    return {"message": "Reimbursement API running"}

@app.get("/countries")
async def countries():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://restcountries.com/v3.1/all?fields=name,currencies")
            data = r.json()
            result = []
            for c in data:
                name = c.get("name", {}).get("common", "")
                for code, info in c.get("currencies", {}).items():
                    result.append({"country": name, "currency_code": code,
                                   "currency_name": info.get("name",""), "symbol": info.get("symbol","")})
            return sorted(result, key=lambda x: x["country"])
    except Exception:
        return []