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

MANDATORY_BRANDS = [
    "Ariel", "Persil", "Finish", "Somat", "Jar",
    "Silan", "Lenor", "Ornel", "Violeta", "Perwoll",
    "Gliss", "Elseve", "Pantene", "Taft", "FA",
    "Palmolive", "Syoss"
]

PROMPT = """Analiziraj ovaj tekst iz hrvatskog retail kataloga i izvuci SVE proizvode koji spadaju u Household ili Personal Care kategoriju.

OBAVEZNI BRENDOVI - ovi se MORAJU pojaviti u rezultatu ako ih nadjes u tekstu, cak i ako je samo ime brenda spomenuto bez cijene:
Ariel, Persil, Finish, Somat, Jar, Silan, Lenor, Ornel, Violeta, Perwoll, Gliss, Elseve, Pantene, Taft, FA, Palmolive, Syoss

DODATNI BRENDOVI za Household i Personal Care:
Domestos, Bref, Dash, Garnier, Fairy, Ajax, Cif, Dove, Nivea, Colgate, Oral-B, Always, Gillette, Old Spice, Saponia, Faks, Cien, Denkmit, W5, Balea, Head&Shoulders, Schwarzkopf, Frosch, Pur, Pril, Rexona, Signal, Meridol, Duel, Likvi, Blanx, Vesh, Super Jon, Zewa, Dax

Household = deterdzenti za rublje, deterdzenti za sude, tablete za perilicu, omeksivaci, sredstva za ciscenje, dezinficijensi, toaletni papir, maramice, papirnate rucnike, vrece za smece, spuzve
Personal Care = samponi, regeneratori, gelovi za tusiranje, sapuni, dezodoransi, kreme, zubne paste, cetkice, lak/gel/pjena za kosu, brijanje

NE izvlaci: hranu, pice, meso, mlijeko, sir, cokoladu, kruh, voce, povrce, konzerve, elektroniku, odjecu.

NAPOMENA: Tekst moze sadrzavati fraze poput "X posto popusta na odabrane Y proizvode" - to takodjer treba izvuci kao zapis.

Za svaki proizvod vrati:
- retailer: ime trgovine
- brand: tocno ime brenda (npr. "Ariel" ne "P&G")
- article: naziv proizvoda
- size: velicina ili null
- category: "Household" ili "Personal Care"
- regular_price: redovna cijena EUR ili null
- promo_price: akcijska cijena EUR ili null
- discount_pct: postotak popusta ili null
- promo_type: tip akcije ili null
- valid_from: YYYY-MM-DD ili null
- valid_to: YYYY-MM-DD ili null

Vrati SAMO validan JSON array. BEZ markdown. Ako nema Household/Personal Care proizvoda vrati []."""


def split_text(text, chunk_size=10000, overlap=1000):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks


def extract_chunk(chunk, retailer_name, chunk_num, total_chunks):
    label = str(chunk_num) + "/" + str(total_chunks)
    print("     Dio " + label)

    try:
        msg = "Retailer: " + retailer_name
        msg = msg + "\n\nTekst (dio " + label + "):\n"
        msg = msg + chunk + "\n\n" + PROMPT

        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=8192,
            messages=[{"role": "user", "content": msg}]
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
                    print("       GRESKA JSON")
                    products = []
            else:
                products = []

        # Filtriraj
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
    seen = set()
    unique = []
    for p in products:
        key = p.get("retailer", "") + "|"
        key = key + p.get("brand", "") + "|"
        key = key + p.get("article", "")
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def extract_from_text(text, retailer_name):
    print("")
    print("[AI] " + retailer_name + "...")
    print("     Input: " + str(len(text)) + " znakova")

    chunks = split_text(text, 10000, 1000)
    total = len(chunks)
    print("     " + str(total) + " dijelova")

    all_products = []
    for i, chunk in enumerate(chunks):
        products = extract_chunk(
            chunk, retailer_name, i + 1, total
        )
        all_products.extend(products)

    unique = deduplicate(all_products)

    for p in unique:
        p["scan_date"] = TODAY
        p["scan_week"] = WEEK

    found_mandatory = []
    for p in unique:
        b = p.get("brand", "")
        if b in MANDATORY_BRANDS:
            found_mandatory.append(b)

    msg = "     REZULTAT: " + str(len(unique))
    print(msg)
    if found_mandatory:
        brands_str = ", ".join(sorted(set(found_mandatory)))
        print("     MANDATORY: " + brands_str)

    missing = []
    found_set = set(found_mandatory)
    for b in MANDATORY_BRANDS:
        if b not in found_set:
            missing.append(b)
    if missing:
        miss_str = ", ".join(missing)
        print("     NEDOSTAJU: " + miss_str)

    return unique


def process_all():
    folder = Path("leaflets/" + TODAY)
    if not folder.exists():
        print("Nema mape! Pokreni scraper.py")
        return []

    retailer_map = {
        "konzum": "Konzum",
        "spar": "Spar",
        "lidl": "Lidl",
        "kaufland": "Kaufland",
        "plodine": "Plodine",
        "studenac": "Studenac",
        "tommy": "Tommy",
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
    print("UKUPNO: " + str(len(all_products)))

    hh = len([p for p in all_products
              if p.get("category") == "Household"])
    pc = len([p for p in all_products
              if p.get("category") == "Personal Care"])
    print("  Household: " + str(hh))
    print("  Personal Care: " + str(pc))

    from collections import Counter
    ret = Counter(p["retailer"] for p in all_products)
    print("")
    print("Po retaileru:")
    for r, c in ret.most_common():
        print("  " + r + ": " + str(c))

    brands = Counter(p.get("brand", "?")
                     for p in all_products)
    print("")
    print("Po brendu:")
    for b, c in brands.most_common(30):
        print("  " + b + ": " + str(c))

    # Provjeri mandatory
    found_all = set(p.get("brand", "")
                    for p in all_products)
    print("")
    print("MANDATORY brendovi:")
    for b in MANDATORY_BRANDS:
        status = "NADJEN" if b in found_all else "NEDOSTAJE"
        print("  " + b + ": " + status)

    return all_products


if __name__ == "__main__":
    process_all()