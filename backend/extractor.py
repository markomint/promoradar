import os
import json
import anthropic
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
TODAY = datetime.now().strftime("%Y-%m-%d")
WEEK = datetime.now().isocalendar()[1]

PROMPT = """Izvuci SAMO proizvode iz kategorija HOUSEHOLD i PERSONAL CARE iz ovog teksta hrvatskog retail kataloga.

To ukljucuje: deterdzente, omeksivace, sredstva za ciscenje, sredstva za pranje suda, tablete za perilicu, osvjezivace, toaletni papir, maramice, sampone, gelove za tusiranje, dezodoranse, kreme, zubne paste, gel za pranje rublja, kapsule za pranje.

PRIORITETNI BRENDOVI - obavezno izvuci sve koje nadjes:
Ariel, Persil, Jar, Somat, Bref, Finish, Domestos, Perwoll, Dash, Gliss, Pantene, Syoss, Head&Shoulders, Elseve, Garnier, Fairy, Lenor, Ajax, Cif, Dove, Nivea, Colgate, Palmolive, Oral-B, Always, Naturella, Gillette, Old Spice, Violeta, Faks, Ornel, Saponia, Cien, Denkmit, W5, Balea

NE izvlaci: hranu, pice, meso, mlijeko, sir, cokoladu, cipove, smrznuto, konzerve, kruh.

Vrati JSON array. Za svaki proizvod:
- retailer: ime trgovine
- brand: tocno ime brenda sa ambalaze
- article: naziv proizvoda na hrvatskom
- size: velicina (npr. "1L", "900ml", "50 tableta", "8 rola")
- category: "Household" ili "Personal Care"
- regular_price: redovna cijena EUR (broj ili null)
- promo_price: akcijska cijena EUR (broj)
- discount_pct: postotak popusta (cijeli broj)
- promo_type: tip akcije
- valid_from: datum pocetka (YYYY-MM-DD)
- valid_to: datum kraja (YYYY-MM-DD)

PRAVILA:
- SAMO Household i Personal Care proizvode
- Izvuci SVE takve proizvode koje nadjes (do max 50)
- Vrati SAMO validan JSON array, BEZ markdown formatiranja
- Ako nema takvih proizvoda vrati []"""


def extract_from_text(text, retailer_name):
    print("")
    print("[AI] Extracting: " + retailer_name + "...")
    print("     Input: " + str(len(text)) + " znakova")

    if len(text) > 12000:
        text = text[:12000]

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=16000,
            messages=[{
                "role": "user",
                "content": "Retailer: " + retailer_name + "\n\nTekst:\n" + text + "\n\n" + PROMPT
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
                    print("     GRESKA: Ne mogu popraviti JSON")
                    products = []
            else:
                products = []

        # Filtriraj samo Household i Personal Care
        filtered = []
        for p in products:
            cat = p.get("category", "")
            if cat in ["Household", "Personal Care"]:
                filtered.append(p)

        priority = [
            "Ariel", "Persil", "Jar", "Somat", "Bref",
            "Finish", "Domestos", "Perwoll", "Dash",
            "Gliss", "Pantene", "Syoss", "Elseve",
            "Garnier", "Fairy", "Lenor", "Nivea",
            "Dove", "Colgate", "Head&Shoulders",
            "Violeta", "Faks", "Ornel", "Saponia",
            "Cien", "Balea", "Denkmit", "Old Spice",
            "Gillette", "Always", "Palmolive"
        ]
        found = []
        for p in filtered:
            b = p.get("brand", "")
            if b in priority:
                found.append(b)

        msg = "     IZVUCENO: " + str(len(filtered))
        msg = msg + " proizvoda"
        if found:
            msg = msg + " (" + ", ".join(sorted(set(found))) + ")"
        print(msg)

        for p in filtered:
            p["scan_date"] = TODAY
            p["scan_week"] = WEEK

        return filtered

    except Exception as e:
        print("     GRESKA API: " + str(e))
        return []


def process_all():
    folder = Path("leaflets/" + TODAY)
    if not folder.exists():
        print("Nema mape leaflets/" + TODAY)
        print("Pokreni prvo scraper.py!")
        return []

    retailer_map = {
        "konzum-akcija": "Konzum",
        "spar-katalog-2": "Spar",
        "lidl-katalog": "Lidl",
        "kaufland-katalog": "Kaufland",
        "plodine-katalog": "Plodine",
        "studenac-katalog": "Studenac",
        "tommy-katalog": "Tommy",
    }

    all_products = []
    for txt_file in sorted(folder.glob("*_text.txt")):
        slug = txt_file.stem.replace("_text", "")
        name = retailer_map.get(slug, slug.title())
        content = txt_file.read_text(encoding="utf-8")
        products = extract_from_text(content, name)
        all_products.extend(products)

    output = folder / "extracted_products.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)

    print("")
    print("=" * 50)
    print("UKUPNO: " + str(len(all_products)) + " proizvoda")
    print("  Household: " + str(len([
        p for p in all_products if p.get("category") == "Household"
    ])))
    print("  Personal Care: " + str(len([
        p for p in all_products if p.get("category") == "Personal Care"
    ])))
    print("")
    print("Spremljeno u: " + str(output))

    from collections import Counter
    ret = Counter(p["retailer"] for p in all_products)
    print("")
    print("Po retaileru:")
    for r, c in ret.most_common():
        print("  " + r + ": " + str(c))

    brands = Counter(p.get("brand", "?") for p in all_products)
    print("")
    print("Po brendu:")
    for b, c in brands.most_common(20):
        print("  " + b + ": " + str(c))

    return all_products


if __name__ == "__main__":
    process_all()