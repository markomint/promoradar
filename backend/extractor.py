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

To ukljucuje: deterdzente, omeksivace, sredstva za ciscenje, sredstva za pranje suda, tablete za perilicu, osvjezivace, toaletni papir, maramice, sampone, gelove za tusiranje, dezodoranse, kreme, zubne paste, gel za pranje rublja, kapsule za pranje, losione, sapune.

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
- Izvuci SVE takve proizvode koje nadjes u tekstu
- Vrati SAMO validan JSON array, BEZ markdown formatiranja
- Ako nema takvih proizvoda vrati []"""


def split_text(text, chunk_size=8000, overlap=500):
    """Podijeli tekst u manje dijelove s preklapanjem."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks


def extract_chunk(chunk, retailer_name, chunk_num, total_chunks):
    """Izvuci proizvode iz jednog dijela teksta."""
    label = retailer_name + " (" + str(chunk_num)
    label = label + "/" + str(total_chunks) + ")"
    print("     Dio " + str(chunk_num) + "/" + str(total_chunks))

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=8192,
            messages=[{
                "role": "user",
                "content": "Retailer: " + retailer_name + "\n\nTekst (dio " + str(chunk_num) + " od " + str(total_chunks) + "):\n" + chunk + "\n\n" + PROMPT
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
                    print("       GRESKA JSON u diu " + str(chunk_num))
                    products = []
            else:
                products = []

        # Filtriraj samo Household i Personal Care
        filtered = []
        for p in products:
            cat = p.get("category", "")
            if cat in ["Household", "Personal Care"]:
                filtered.append(p)

        print("       " + str(len(filtered)) + " proizvoda")
        return filtered

    except Exception as e:
        print("       GRESKA: " + str(e))
        return []


def deduplicate(products):
    """Makni duplikate bazirano na brand + article + retailer."""
    seen = set()
    unique = []
    for p in products:
        key = p.get("retailer", "")
        key = key + "|" + p.get("brand", "")
        key = key + "|" + p.get("article", "")
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def extract_from_text(text, retailer_name):
    print("")
    print("[AI] Extracting: " + retailer_name + "...")
    total_chars = str(len(text))
    print("     Input: " + total_chars + " znakova")

    # Podijeli tekst u dijelove
    chunks = split_text(text, 8000, 500)
    total = len(chunks)
    print("     Podijeljeno u " + str(total) + " dijelova")

    all_products = []
    for i, chunk in enumerate(chunks):
        products = extract_chunk(chunk, retailer_name, i + 1, total)
        all_products.extend(products)

    # Makni duplikate nastale preklapanjem
    unique = deduplicate(all_products)

    # Dodaj metadata
    for p in unique:
        p["scan_date"] = TODAY
        p["scan_week"] = WEEK

    # Prikazi nadjene brendove
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
    for p in unique:
        b = p.get("brand", "")
        if b in priority:
            found.append(b)

    msg = "     UKUPNO: " + str(len(unique)) + " jedinstvenih"
    if found:
        brands_str = ", ".join(sorted(set(found)))
        msg = msg + " (" + brands_str + ")"
    print(msg)

    return unique


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

    hh = len([p for p in all_products if p.get("category") == "Household"])
    pc = len([p for p in all_products if p.get("category") == "Personal Care"])
    print("  Household: " + str(hh))
    print("  Personal Care: " + str(pc))

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
    for b, c in brands.most_common(25):
        print("  " + b + ": " + str(c))

    return all_products


if __name__ == "__main__":
    process_all()