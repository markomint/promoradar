"""
PromoRadar Vision Scan — Production v4
- Cita datume s naslovnice kataloga
- Uploada slike stranica u Supabase Storage
- Sprema URL slike uz svaki proizvod
"""

import os
import json
import base64
import re
import anthropic
import fitz
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

TODAY = datetime.now().strftime("%Y-%m-%d")
WEEK = datetime.now().isocalendar()[1]
KATALOG_DIR = Path("katalozi")
SUPABASE_URL = os.getenv("SUPABASE_URL")

RETAILER_NAMES = {
    "konzum": "Konzum",
    "spar": "Spar",
    "lidl": "Lidl",
    "kaufland": "Kaufland",
    "plodine": "Plodine",
    "studenac": "Studenac",
    "tommy": "Tommy",
    "bipa": "Bipa",
    "dm": "DM",
}

BRAND_MAP = {
    "violeta": "Violeta",
    "teta violeta": "Violeta",
    "violeta double care": "Violeta",
    "garnier fructis": "Garnier",
    "garnier skin naturals": "Garnier",
    "garnier ambre solaire": "Garnier",
    "head & shoulders": "Head&Shoulders",
    "head&shoulders": "Head&Shoulders",
    "head and shoulders": "Head&Shoulders",
    "weisser riese": "Weisser Riese",
    "weißer riese": "Weisser Riese",
    "l'oreal": "L'Oreal",
    "l'oréal": "L'Oreal",
    "loreal": "L'Oreal",
    "l'oreal paris": "L'Oreal",
    "schwarzkopf gliss": "Gliss",
    "gliss kur": "Gliss",
    "schwarzkopf syoss": "Syoss",
    "schwarzkopf taft": "Taft",
    "schwarzkopf palette": "Palette",
    "nivea men": "Nivea",
    "nivea sun": "Nivea",
    "dove men+care": "Dove",
    "dove men": "Dove",
    "oral-b": "Oral-B",
    "oral b": "Oral-B",
    "gillette venus": "Gillette",
    "pantene pro-v": "Pantene",
    "palmolive naturals": "Palmolive",
    "fa men": "FA",
    "bi care": "BI CARE",
    "finish ultimate": "Finish",
    "finish all in 1": "Finish",
    "finish quantum": "Finish",
    "somat all in 1": "Somat",
    "somat excellence": "Somat",
    "ariel pods": "Ariel",
    "persil discs": "Persil",
    "zorina mast": "Zorina",
}


def normalize_brand(brand):
    if not brand:
        return "Nepoznato"
    key = brand.lower().strip()
    if key in BRAND_MAP:
        return BRAND_MAP[key]
    for k, v in BRAND_MAP.items():
        if k in key:
            return v
    return brand.strip()


def validate_date(date_str):
    if not date_str:
        return None
    d = str(date_str).strip()
    match = re.match(r"(\d{4})-(\d{2})-(\d{2})", d)
    if not match:
        return None
    year = int(match.group(1))
    month = int(match.group(2))
    day = int(match.group(3))
    if day == 0:
        day = 1
    if day > 31:
        day = 28
    if month > 12 or month == 0:
        return None
    if year == 2025:
        year = 2026
    try:
        datetime(year, month, min(day, 28))
        return str(year) + "-" + str(month).zfill(2) + "-" + str(min(day, 28)).zfill(2)
    except ValueError:
        return None


def clean_product(p):
    p["brand"] = normalize_brand(p.get("brand"))
    p["article"] = (p.get("article") or "Nepoznato").strip()
    p["valid_from"] = validate_date(p.get("valid_from"))
    p["valid_to"] = validate_date(p.get("valid_to"))
    pp = p.get("promo_price")
    if pp is not None:
        try:
            p["promo_price"] = round(float(pp), 2)
        except (ValueError, TypeError):
            p["promo_price"] = None
    rp = p.get("regular_price")
    if rp is not None:
        try:
            p["regular_price"] = round(float(rp), 2)
        except (ValueError, TypeError):
            p["regular_price"] = None
    dp = p.get("discount_pct")
    if dp is not None:
        try:
            dp = int(dp)
            if dp < 0 or dp > 90:
                dp = None
            p["discount_pct"] = dp
        except (ValueError, TypeError):
            p["discount_pct"] = None
    # Validate share_of_page
    sop = p.get("share_of_page")
    if sop not in ("Hero", "Premium", "Standard", "Small"):
        p["share_of_page"] = "Standard"
    return p


COVER_PROMPT = """Pogledaj naslovnicu ovog kataloga. 
Pronadi datume vazenja kataloga. Obicno pise nesto poput:
"Vrijedi od 18.02. do 24.02.2026." ili "11.2. - 24.2." ili "od 18. do 24. veljace"

Vrati SAMO JSON objekt s dva polja:
- valid_from: datum pocetka u formatu YYYY-MM-DD
- valid_to: datum kraja u formatu YYYY-MM-DD

Koristi godinu 2026 ako godina nije eksplicitno navedena.
Ako ne vidis datume, vrati {"valid_from": null, "valid_to": null}
Vrati SAMO JSON, BEZ markdown formatiranja."""


PROMPT_TEMPLATE = """Pogledaj pazljivo ovu stranicu iz RETAILER kataloga. Analiziraj SVE vizualne elemente:
- Proizvode u velikim kucicama/karticama sa slikom
- Proizvode u grid layoutu
- Istaknute ponude u bannerima ili okvirima
- Male proizvode na rubovima stranice

Izvuci SAMO proizvode iz kategorija HOUSEHOLD i PERSONAL CARE.

Household = deterdzenti za rublje, deterdzenti za sude, tablete za perilicu suda, omeksivaci, sredstva za ciscenje, dezinficijensi, toaletni papir, maramice, papirnate rucnike, vrece za smece, spuzve
Personal Care = samponi, regeneratori, gelovi za tusiranje, sapuni, dezodoransi, kreme za lice i tijelo, losioni, zubne paste, cetkice za zube, lak/gel/pjena za kosu, brijanje, higijenski ulosci

OBAVEZNI BRENDOVI:
Ariel, Persil, Finish, Somat, Jar, Silan, Lenor, Ornel, Violeta, Perwoll, Gliss, Elseve, Pantene, Taft, FA, Palmolive, Syoss, Domestos, Bref, Garnier, Nivea, Colgate, Dove, Head&Shoulders, Schwarzkopf, Fairy, Ajax, Cif, Old Spice, Gillette, Always, Oral-B, Rexona, Frosch, Denkmit, Coccolino, Vanish, Zewa, Likvi, Faks, Saponia

DATUMI: Ovaj katalog vrijedi od VALID_FROM do VALID_TO. Koristi te datume za sve proizvode OSIM ako na ovoj stranici eksplicitno pise drugaciji datum.

POPUSTI: discount_pct popuni SAMO ako je postotak eksplicitno prikazan na slici kao broj s postotkom (npr. "-30%", "30% popusta", ikonica/badge s postotkom, "UŠTEDI 25%"). Fokusiraj se na brojke i % znak. Ako nema eksplicitnog postotka, stavi null. NE racunaj sam iz razlike cijena.

SHARE OF PAGE — klasificiraj velicinu prikaza svakog proizvoda na stranici:
- "Hero" = proizvod zauzima pola stranice ili vise, jako istaknut, 1-2 proizvoda na cijeloj stranici
- "Premium" = velik prikaz, oko 1/4 do 1/3 stranice, istaknut okvir
- "Standard" = srednja kucica u gridu, 4-8 proizvoda na stranici
- "Small" = mali prikaz, u listi ili na rubu, 9+ proizvoda na stranici

Za svaki proizvod vrati:
- brand: tocno ime brenda sa ambalaze
- article: naziv proizvoda
- size: velicina ili null
- category: "Household" ili "Personal Care"
- promo_price: akcijska cijena EUR ili null
- regular_price: redovna cijena EUR ili null
- discount_pct: postotak popusta SAMO ako eksplicitno prikazan (broj ili null)
- share_of_page: "Hero", "Premium", "Standard" ili "Small"
- valid_from: YYYY-MM-DD
- valid_to: YYYY-MM-DD

Ako NEMA H&PC proizvoda, vrati [].
Vrati SAMO validan JSON array, BEZ markdown formatiranja."""


def read_cover_dates(img_bytes, retailer):
    """Procitaj datume s naslovnice kataloga."""
    print("  Citam datume s naslovnice...")
    b64 = base64.b64encode(img_bytes).decode()
    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}},
                    {"type": "text", "text": COVER_PROMPT}
                ]
            }]
        )
        result = response.content[0].text.strip()
        if result.startswith("```"):
            result = result.split("\n", 1)[-1]
        if result.endswith("```"):
            result = result[:-3]
        result = result.strip()
        data = json.loads(result)
        vf = validate_date(data.get("valid_from"))
        vt = validate_date(data.get("valid_to"))
        if vf and vt:
            print("  Katalog vrijedi: " + vf + " do " + vt)
        else:
            print("  Datumi nisu nadjeni na naslovnici")
        return vf, vt
    except Exception as e:
        print("  Greska citanja datuma: " + str(e))
        return None, None


def upload_page_image(img_bytes, retailer, page_num):
    """Uploada sliku stranice u Supabase Storage."""
    slug = retailer.lower().replace(" ", "-")
    filename = slug + "_" + TODAY + "_p" + str(page_num) + ".jpg"
    path = "pages/" + filename

    # Konvertiraj PNG u JPEG za manju velicinu
    from PIL import Image
    import io
    img = Image.open(io.BytesIO(img_bytes))
    jpg_buffer = io.BytesIO()
    img = img.convert("RGB")
    img.save(jpg_buffer, format="JPEG", quality=70)
    jpg_bytes = jpg_buffer.getvalue()

    try:
        supabase.storage.from_("catalog-pages").upload(
            path, jpg_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        url = SUPABASE_URL + "/storage/v1/object/public/catalog-pages/" + path
        return url
    except Exception as e:
        err = str(e)
        if "Duplicate" in err or "already exists" in err:
            url = SUPABASE_URL + "/storage/v1/object/public/catalog-pages/" + path
            return url
        print("    Img upload greska: " + err[:80])
        return None


def extract_page(img_bytes, retailer, page_num, total, cover_from, cover_to, page_img_url):
    label = str(page_num) + "/" + str(total)
    b64 = base64.b64encode(img_bytes).decode()

    prompt = PROMPT_TEMPLATE.replace("RETAILER", retailer)
    vf_str = cover_from or "nepoznato"
    vt_str = cover_to or "nepoznato"
    prompt = prompt.replace("VALID_FROM", vf_str)
    prompt = prompt.replace("VALID_TO", vt_str)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}},
                    {"type": "text", "text": prompt}
                ]
            }]
        )

        result = response.content[0].text.strip()
        if result.startswith("```json"):
            result = result[7:]
        elif result.startswith("```"):
            result = result[3:]
        if result.endswith("```"):
            result = result[:-3]
        result = result.strip()

        try:
            products = json.loads(result)
        except json.JSONDecodeError:
            lc = result.rfind("}")
            if lc > 0:
                t = result[:lc + 1]
                if not t.endswith("]"):
                    t = t + "]"
                try:
                    products = json.loads(t)
                except json.JSONDecodeError:
                    products = []
            else:
                products = []

        filtered = []
        for p in products:
            cat = p.get("category", "")
            if cat in ["Household", "Personal Care"]:
                p["retailer"] = retailer
                p["scan_date"] = TODAY
                p["scan_week"] = WEEK
                p["source_url"] = page_img_url
                # Ako nema datuma, koristi cover datume
                if not p.get("valid_from"):
                    p["valid_from"] = cover_from
                if not p.get("valid_to"):
                    p["valid_to"] = cover_to
                p = clean_product(p)
                filtered.append(p)

        if filtered:
            brands = [p.get("brand", "?") for p in filtered]
            msg = "  Str. " + label + ": "
            msg = msg + str(len(filtered)) + " H&PC"
            msg = msg + " (" + ", ".join(brands[:5])
            if len(brands) > 5:
                msg = msg + "..."
            msg = msg + ")"
            print(msg)
        else:
            print("  Str. " + label + ": -")

        return filtered

    except Exception as e:
        print("  Str. " + label + " GRESKA: " + str(e))
        return []


def process_pdf(pdf_path, retailer_name):
    print("")
    print("=" * 50)
    print("[VISION] " + retailer_name)

    doc = fitz.open(str(pdf_path))
    total = len(doc)
    print("  " + str(total) + " stranica")

    # 1. Citaj datume s naslovnice (str. 1)
    cover_page = doc[0]
    cover_pix = cover_page.get_pixmap(dpi=150)
    cover_bytes = cover_pix.tobytes("png")
    cover_from, cover_to = read_cover_dates(cover_bytes, retailer_name)

    # 2. Obradi svaku stranicu
    all_products = []
    for i in range(total):
        page = doc[i]
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")

        # Upload slike
        page_url = upload_page_image(img_bytes, retailer_name, i + 1)

        products = extract_page(
            img_bytes, retailer_name, i + 1, total,
            cover_from, cover_to, page_url
        )
        all_products.extend(products)

    doc.close()

    msg = "  >> " + retailer_name + ": "
    msg = msg + str(len(all_products)) + " H&PC"
    print(msg)
    return all_products


def deduplicate(products):
    seen = set()
    unique = []
    for p in products:
        brand = (p.get("brand") or "").lower()
        article = (p.get("article") or "").lower()
        retailer = (p.get("retailer") or "").lower()
        key = retailer + "|" + brand + "|" + article
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def upload_to_supabase(products):
    print("")
    print("[UPLOAD] " + str(len(products)) + " proizvoda")

    try:
        # Obrisi samo retailere koje skeniramo u ovom runu
        retailers = list(set((p.get("retailer") or "") for p in products))
        for ret in retailers:
            if ret:
                supabase.table("promo_items").delete().eq(
                    "retailer", ret
                ).eq("scan_date", TODAY).execute()
                print("  Ocisceno za danas: " + ret)
    except Exception as e:
        print("  " + str(e))

    rows = []
    for p in products:
        row = {}
        row["scan_date"] = p.get("scan_date") or TODAY
        row["scan_week"] = p.get("scan_week") or WEEK
        row["retailer"] = p.get("retailer") or "Nepoznato"
        row["brand"] = p.get("brand") or "Nepoznato"
        row["article"] = p.get("article") or "Nepoznato"
        row["size"] = p.get("size")
        row["category"] = p.get("category")
        row["regular_price"] = p.get("regular_price")
        row["promo_price"] = p.get("promo_price")
        row["discount_pct"] = p.get("discount_pct")
        row["share_of_page"] = p.get("share_of_page")
        row["valid_from"] = p.get("valid_from")
        row["valid_to"] = p.get("valid_to")
        row["source_url"] = p.get("source_url")
        rows.append(row)

    inserted = 0
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        num = i // 50 + 1
        try:
            supabase.table("promo_items").insert(batch).execute()
            inserted = inserted + len(batch)
            print("  Batch " + str(num) + ": " + str(len(batch)) + " OK")
        except Exception as e:
            print("  Batch " + str(num) + " GRESKA: " + str(e))

    print("  UPLOADANO: " + str(inserted))
    return inserted


def run():
    print("=" * 50)
    print("  PromoRadar Vision Scan v4")
    print("  " + TODAY)
    print("=" * 50)

    if not KATALOG_DIR.exists():
        print("GRESKA: Nema katalozi/ mape!")
        return

    pdfs = sorted(KATALOG_DIR.glob("*.pdf"))
    if not pdfs:
        print("GRESKA: Nema PDF-ova!")
        return

    print("")
    print("Nadjeni katalozi:")
    for pdf in pdfs:
        name = pdf.stem
        retailer = RETAILER_NAMES.get(name, name.title())
        size_mb = pdf.stat().st_size / 1024 / 1024
        print("  " + retailer + " (" + pdf.name + ", " + str(round(size_mb, 1)) + " MB)")

    all_products = []
    for pdf in pdfs:
        name = pdf.stem
        retailer = RETAILER_NAMES.get(name, name.title())
        products = process_pdf(pdf, retailer)
        all_products.extend(products)

    unique = deduplicate(all_products)

    out = Path("vision_results_" + TODAY + ".json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)

    upload_to_supabase(unique)

    # Statistika
    print("")
    print("=" * 50)
    print("REZULTAT")
    print("=" * 50)
    print("Ukupno: " + str(len(unique)))

    hh = len([p for p in unique if p.get("category") == "Household"])
    pc = len([p for p in unique if p.get("category") == "Personal Care"])
    print("  Household: " + str(hh))
    print("  Personal Care: " + str(pc))

    from collections import Counter
    ret = Counter((p.get("retailer") or "?") for p in unique)
    print("")
    print("Po retaileru:")
    for r, c in ret.most_common():
        print("  " + r + ": " + str(c))

    with_dates = len([p for p in unique if p.get("valid_from") and p.get("valid_to")])
    with_img = len([p for p in unique if p.get("source_url")])
    pct_d = round(with_dates / max(len(unique), 1) * 100)
    pct_i = round(with_img / max(len(unique), 1) * 100)
    print("")
    print("S datumima: " + str(with_dates) + " (" + str(pct_d) + "%)")
    print("Sa slikom: " + str(with_img) + " (" + str(pct_i) + "%)")

    mandatory = [
        "Ariel", "Persil", "Finish", "Somat", "Jar",
        "Silan", "Lenor", "Ornel", "Violeta", "Perwoll",
        "Gliss", "Elseve", "Pantene", "Taft", "FA",
        "Palmolive", "Syoss"
    ]
    all_brands = set((p.get("brand") or "").lower() for p in unique)
    print("")
    print("MANDATORY:")
    found = 0
    for b in mandatory:
        is_found = b.lower() in all_brands
        if not is_found:
            for key in all_brands:
                if b.lower() in key:
                    is_found = True
                    break
        if is_found:
            print("  " + b + ": OK")
            found = found + 1
        else:
            print("  " + b + ": -")
    print("")
    print("Preciznost: " + str(found) + "/" + str(len(mandatory)) + " (" + str(round(found / len(mandatory) * 100)) + "%)")
    print("Dashboard: promoradar-delta.vercel.app")


if __name__ == "__main__":
    run()