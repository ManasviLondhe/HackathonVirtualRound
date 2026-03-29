import re, io
from PIL import Image
try:
    import pytesseract
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False

def extract_text(image_bytes):
    if not OCR_AVAILABLE:
        return ""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        return pytesseract.image_to_string(img)
    except Exception:
        return ""

def parse_receipt(text):
    result = {"vendor_name": None, "amount": None, "currency": None, "date": None, "description": None, "expense_lines": []}
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if lines:
        result["vendor_name"] = lines[0]
    for pat in [r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b', r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b']:
        m = re.search(pat, text)
        if m:
            result["date"] = m.group(1)
            break
    amounts = []
    for pat in [r'(?:total|grand total|amount due)[:\s]*[\$£€₹]?\s*(\d+[,.]?\d*)',
                r'[\$£€₹]\s*(\d+[,.]?\d+)', r'(\d+\.\d{2})']:
        for m in re.findall(pat, text, re.IGNORECASE):
            try: amounts.append(float(str(m).replace(",", "")))
            except: pass
    if amounts:
        result["amount"] = max(amounts)
    for sym, code in [("$","USD"),("£","GBP"),("€","EUR"),("₹","INR")]:
        if sym in text:
            result["currency"] = code
            break
    for m in re.finditer(r'(.{3,30}?)\s+[\$£€₹]?\s*(\d+\.\d{2})', text):
        item = m.group(1).strip()
        if item.lower() not in ["total","subtotal","tax","grand total"]:
            result["expense_lines"].append({"item_name": item, "quantity": 1, "unit_price": float(m.group(2))})
    if len(lines) > 1:
        result["description"] = " | ".join(lines[1:3])
    return result

def process_receipt(image_bytes):
    text = extract_text(image_bytes)
    if not text:
        return {"error": "Could not read image", "raw_text": ""}
    parsed = parse_receipt(text)
    parsed["raw_text"] = text
    return parsed