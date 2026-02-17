import os
import json
import base64
import anthropic
import fitz
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
TODAY = datetime.now().strftime("%Y-%m-%d")

KATALOZI = [
    {"file": "katalozi/konzum.pdf", "name": "Konzum"},
    {"file": "katalozi/spar.pdf", "name": "Spar"},
    {"file": "katalozi/bipa.pdf", "name": "Bipa"},
]

PROMPT_TEMPLATE = """Pogledaj ovu stranicu iz RETAILER kataloga.

Izvuci SAMO proizvode iz kategorija HOUSEHOLD i PERSONAL CARE.

Household = deterdzenti za rublje, deterdzenti za sude, tablete za perilicu suda, omeksivaci, sredstva za ciscenje, dezinficijensi, toaletni papir, maramice, papirnate rucnike, vrece za smece, spuzve
Personal Care = samponi, regeneratori, gelovi za tusiranje, sapuni, dezodoransi, kreme za lice i tijelo, losioni, zubne paste, cetkice za zube, lak/gel/pjena za kosu, brijanje, higijenski ulosci

OBAVEZNI BRENDOVI — izvuci ih OBAVEZNO ako ih vidis na slici:
Ariel, Persil, Finish, Somat, Jar, Silan, Lenor, Ornel, Violeta, Perwoll, Gliss, Elseve, Pantene, Taft, FA, Palmolive, Syoss, Domestos, Bref, Garnier, Nivea, Colgate, Dove, Head&Shoulders, Schwarzkopf, Fairy, Ajax, Cif, Old Spice, Gillette, Always, Oral-B, Rexona, Frosch, Denkmit, Coccolino, Vanish, Zewa, Likvi, Faks, Saponia

Za svaki proizvod vrati:
- brand: tocno ime brenda sa ambalaze (npr. "Ariel" ne "P&G", "Gliss" ne "Schwarzkopf Gliss")
- article: naziv proizvoda na hrvatskom
- size: velicina (npr. "1L", "900ml", "28 tableta")
- category: "Household" ili "Personal Care"
- promo_price: akcijska cijena EUR (broj ili null)
- regular_price: redovna cijena EUR (broj ili null)
- discount_pct: postotak popusta ili null

Ako na stranici NEMA Household ili Personal Care proizvoda, vrati prazan array [].
Vrati SAMO validan JSON array, BEZ markdown formatiranja."""


def extract_page(img_bytes, retailer, page_num, total):
    label = str(page_num) + "/" + str(total)
    b64 = base64.b64encode(img_bytes).decode()

    prompt = PROMPT_TEMPLATE.replace("RETAILER", retailer)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64,
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
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
            last_close = result.rfind("}")
            if last_close > 0:
                trimmed = result[:last_close + 1]
                if not trimmed.endswith("]"):
                    trimmed = trimmed + "]"
                try:
                    products = json.loads(trimmed)
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
                filtered.append(p)

        if filtered:
            brands = [p.get("brand", "?") for p in filtered]
            msg = "  Str. " + label + ": "
            msg = msg + str(len(filtered)) + " H&PC"
            msg = msg + " (" + ", ".join(brands) + ")"
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
    print("  PDF: " + pdf_path)

    if not os.path.exists(pdf_path):
        print("  GRESKA: PDF ne postoji!")
        return []

    doc = fitz.open(pdf_path)
    total = len(doc)
    print("  Stranica: " + str(total))
    print("")

    all_products = []
    for i in range(total):
        page = doc[i]
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")
        products = extract_page(
            img_bytes, retailer_name, i + 1, total
        )
        all_products.extend(products)

    doc.close()
    return all_products


def deduplicate(products):
    seen = set()
    unique = []
    for p in products:
        key = p.get("retailer", "") + "|"
        key = key + p.get("brand", "").lower() + "|"
        key = key + p.get("article", "").lower()
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def run_all():
    print("=" * 50)
    print("PromoRadar Vision — Multi-Retailer Test")
    print("Datum: " + TODAY)
    print("=" * 50)

    all_products = []
    for kat in KATALOZI:
        products = process_pdf(kat["file"], kat["name"])
        all_products.extend(products)
        count = str(len(products))
        print("")
        print("  >> " + kat["name"] + ": " + count + " H&PC")

    unique = deduplicate(all_products)

    print("")
    print("=" * 50)
    print("UKUPNI REZULTAT")
    print("=" * 50)
    print("Ukupno: " + str(len(unique)) + " proizvoda")

    hh = len([p for p in unique
              if p.get("category") == "Household"])
    pc = len([p for p in unique
              if p.get("category") == "Personal Care"])
    print("  Household: " + str(hh))
    print("  Personal Care: " + str(pc))

    from collections import Counter

    ret = Counter(p["retailer"] for p in unique)
    print("")
    print("Po retaileru:")
    for r, c in ret.most_common():
        print("  " + r + ": " + str(c))

    brands = Counter(p.get("brand", "?") for p in unique)
    print("")
    print("Top brendovi:")
    for b, c in brands.most_common(30):
        print("  " + b + ": " + str(c))

    mandatory = [
        "Ariel", "Persil", "Finish", "Somat", "Jar",
        "Silan", "Lenor", "Ornel", "Violeta", "Perwoll",
        "Gliss", "Elseve", "Pantene", "Taft", "FA",
        "Palmolive", "Syoss"
    ]

    # Provjeri i varijante imena
    all_brands_lower = {}
    for p in unique:
        b = p.get("brand", "")
        all_brands_lower[b.lower()] = b

    print("")
    print("MANDATORY brendovi:")
    found_count = 0
    for b in mandatory:
        found = False
        if b.lower() in all_brands_lower:
            found = True
        # Provjeri i kao dio imena
        if not found:
            for key in all_brands_lower:
                if b.lower() in key:
                    found = True
                    break
        if found:
            print("  " + b + ": NADJEN")
            found_count = found_count + 1
        else:
            print("  " + b + ": -")

    pct = round(found_count / len(mandatory) * 100)
    msg = "\nPreciznost: " + str(found_count)
    msg = msg + "/" + str(len(mandatory))
    msg = msg + " (" + str(pct) + "%)"
    print(msg)

    out = Path("vision_all_results.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)
    print("\nSpremljeno u: " + str(out))

    return unique


if __name__ == "__main__":
    run_all()