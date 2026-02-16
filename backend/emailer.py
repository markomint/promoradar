import os
import csv
import io
import base64
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import requests

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

RESEND_KEY = os.getenv("RESEND_API_KEY")
TODAY = datetime.now().strftime("%Y-%m-%d")


def get_promos():
    result = supabase.table("promo_items").select("*").eq(
        "scan_date", TODAY
    ).order(
        "discount_pct", desc=True
    ).execute()
    return result.data


def make_csv(products):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Retailer", "Brand", "Article", "Size",
        "Category", "Regular EUR", "Promo EUR",
        "Discount %", "Promo Type",
        "Valid From", "Valid To"
    ])
    for p in products:
        writer.writerow([
            p.get("retailer", ""),
            p.get("brand", ""),
            p.get("article", ""),
            p.get("size", ""),
            p.get("category", ""),
            p.get("regular_price", ""),
            p.get("promo_price", ""),
            p.get("discount_pct", ""),
            p.get("promo_type", ""),
            p.get("valid_from", ""),
            p.get("valid_to", ""),
        ])
    return output.getvalue()


def make_html(products):
    top = products[:20]
    rows = ""
    for p in top:
        reg = ""
        if p.get("regular_price"):
            reg = str(p["regular_price"])
        promo = ""
        if p.get("promo_price"):
            promo = str(p["promo_price"])
        disc = str(p.get("discount_pct", ""))

        rows = rows + "<tr>"
        rows = rows + '<td style="padding:8px;border-bottom:1px solid #eee">'
        rows = rows + str(p.get("retailer", "")) + "</td>"
        rows = rows + '<td style="padding:8px;border-bottom:1px solid #eee">'
        rows = rows + "<strong>" + str(p.get("brand", "")) + "</strong></td>"
        rows = rows + '<td style="padding:8px;border-bottom:1px solid #eee">'
        rows = rows + str(p.get("article", ""))
        if p.get("size"):
            rows = rows + " " + str(p["size"])
        rows = rows + "</td>"
        rows = rows + '<td style="padding:8px;border-bottom:1px solid #eee;'
        rows = rows + 'color:#999;text-decoration:line-through">'
        rows = rows + reg + "</td>"
        rows = rows + '<td style="padding:8px;border-bottom:1px solid #eee;'
        rows = rows + 'color:#10B981;font-weight:bold">'
        rows = rows + promo + "</td>"
        rows = rows + '<td style="padding:8px;border-bottom:1px solid #eee;'
        rows = rows + 'color:#EF4444;font-weight:bold">'
        rows = rows + "-" + disc + "%</td>"
        rows = rows + "</tr>"

    count = str(len(products))
    html = """
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
        <div style="background:#0B0F1A;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:24px">PromoRadar Weekly</h1>
            <p style="color:#94A3B8;margin:8px 0 0">"""
    html = html + "Scan: " + TODAY + " | " + count + " promo artikala</p>"
    html = html + """
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e5e7eb">
            <h2 style="font-size:18px;margin:0 0 16px">Top 20 popusta ovog tjedna</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f9fafb">
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280">RETAILER</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280">BRAND</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280">ARTIKL</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280">REG.</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280">AKCIJA</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280">POPUST</th>
                    </tr>
                </thead>
                <tbody>"""
    html = html + rows
    html = html + """</tbody>
            </table>
            <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
                Kompletni podaci u CSV prilogu. Dashboard:
                <a href="https://promoradar-delta.vercel.app">promoradar-delta.vercel.app</a>
            </p>
        </div>
        <div style="padding:16px;background:#f9fafb;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#9ca3af">
            PromoRadar — Competitive Promo Intelligence for Croatian Retail
        </div>
    </div>"""
    return html


def send_email(to_email, products):
    if not RESEND_KEY:
        print("  Nema RESEND_API_KEY!")
        return False

    html = make_html(products)
    csv_data = make_csv(products)
    csv_b64 = base64.b64encode(csv_data.encode()).decode()

    count = str(len(products))
    subject = "PromoRadar Weekly: "
    subject = subject + count + " deals ("
    subject = subject + TODAY + ")"

    payload = {
        "from": "PromoRadar <onboarding@resend.dev>",
        "to": to_email,
        "subject": subject,
        "html": html,
        "attachments": [{
            "filename": "promoradar-" + TODAY + ".csv",
            "content": csv_b64,
        }]
    }

    try:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": "Bearer " + RESEND_KEY,
                "Content-Type": "application/json",
            },
            json=payload
        )
        if resp.status_code == 200:
            print("  Poslano na " + to_email)
            return True
        else:
            msg = "  Greska " + str(resp.status_code)
            msg = msg + ": " + resp.text
            print(msg)
            return False
    except Exception as e:
        print("  Greska: " + str(e))
        return False


def send_digest():
    print("")
    print("[EMAIL] Slanje tjednog digesta...")

    products = get_promos()
    if not products:
        print("  Nema podataka za danas.")
        return

    msg = "  Nadjeno " + str(len(products))
    msg = msg + " proizvoda"
    print(msg)

    # Dohvati pretplatnike iz baze
    subs = supabase.table("subscribers").select("*").eq(
        "active", True
    ).execute()

    if subs.data and len(subs.data) > 0:
        print("  Saljem na " + str(len(subs.data)) + " pretplatnika...")
        for sub in subs.data:
            send_email(sub["email"], products)
    else:
        print("  Nema pretplatnika u bazi.")
        print("  Saljem testni email...")
        # Posalji sebi za test - zamijeni s tvojim emailom
        send_email("markomintas@gmail.com", products)


if __name__ == "__main__":
    send_digest()