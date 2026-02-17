import os
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

TODAY = datetime.now().strftime("%Y-%m-%d")
WEEK = datetime.now().isocalendar()[1]


def upload():
    filepath = "vision_all_results.json"
    if not os.path.exists(filepath):
        print("Nema " + filepath)
        return

    with open(filepath, "r", encoding="utf-8") as f:
        products = json.load(f)

    print("Ucitano: " + str(len(products)) + " proizvoda")

    # Obrisi stare podatke
    try:
        supabase.table("promo_items").delete().neq(
            "id", 0
        ).execute()
        print("Baza ociscena")
    except Exception as e:
        print("Napomena: " + str(e))

    rows = []
    for p in products:
        row = {}
        row["scan_date"] = p.get("scan_date") or TODAY
        row["scan_week"] = WEEK
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
    msg = "UPLOADANO: " + str(inserted)
    msg = msg + " od " + str(len(rows))
    print(msg)
    print("Otvori dashboard: promoradar-delta.vercel.app")


if __name__ == "__main__":
    upload()