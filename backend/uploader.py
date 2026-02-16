import os
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

TODAY = datetime.now().strftime("%Y-%m-%d")


def upload_products(products):
    total = str(len(products))
    print("")
    print("[UPLOAD] " + total + " proizvoda...")

    # Obrisi stare podatke za danasnji datum
    # Ovo sprijecava duplikate kad pokrenemo vise puta
    try:
        result = supabase.table("promo_items").delete().eq(
            "scan_date", TODAY
        ).execute()
        print("  Obrisani stari podaci za " + TODAY)
    except Exception as e:
        print("  Napomena: " + str(e))

    rows = []
    for p in products:
        row = {}
        row["scan_date"] = p.get("scan_date") or TODAY
        row["scan_week"] = p.get("scan_week") or 8
        row["retailer"] = p.get("retailer") or "Nepoznato"
        row["brand"] = p.get("brand") or "Nepoznato"
        row["article"] = p.get("article") or "Nepoznato"
        row["size"] = p.get("size")
        row["category"] = p.get("category")
        row["regular_price"] = p.get("regular_price")
        row["promo_price"] = p.get("promo_price")
        row["discount_pct"] = p.get("discount_pct")
        row["promo_type"] = p.get("promo_type")
        row["valid_from"] = p.get("valid_from")
        row["valid_to"] = p.get("valid_to")
        rows.append(row)

    inserted = 0
    batch_num = 0
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        batch_num = batch_num + 1
        try:
            supabase.table("promo_items").insert(batch).execute()
            inserted = inserted + len(batch)
            msg = "  Batch " + str(batch_num)
            msg = msg + ": " + str(len(batch)) + " OK"
            print(msg)
        except Exception as e:
            msg = "  Batch " + str(batch_num)
            msg = msg + " GRESKA: " + str(e)
            print(msg)

    print("")
    msg = "  UPLOADANO: " + str(inserted)
    msg = msg + " od " + str(len(rows))
    print(msg)
    return inserted


def upload_from_file():
    path = "leaflets/" + TODAY
    path = path + "/extracted_products.json"
    filepath = Path(path)
    if not filepath.exists():
        print("Nema datoteke!")
        return 0
    with open(filepath, "r", encoding="utf-8") as f:
        products = json.load(f)
    return upload_products(products)


if __name__ == "__main__":
    upload_from_file()