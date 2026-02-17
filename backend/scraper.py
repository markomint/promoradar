import requests
import re
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
import time

TODAY = datetime.now().strftime("%Y-%m-%d")
LEAFLET_DIR = Path("leaflets") / TODAY
HEADERS = {"User-Agent": "PromoRadar/1.0"}

RETAILERS = [
    {
        "name": "Konzum",
        "main_url": "https://katalozi.net/konzum-akcija",
        "catalog_base": "https://katalozi.net/konzum-katalog",
        "slug": "konzum",
    },
    {
        "name": "Spar",
        "main_url": "https://katalozi.net/spar-katalog-2",
        "catalog_base": "https://katalozi.net/spar-katalog",
        "slug": "spar",
    },
    {
        "name": "Lidl",
        "main_url": "https://katalozi.net/lidl-katalog",
        "catalog_base": "https://katalozi.net/lidl-katalog",
        "slug": "lidl",
    },
    {
        "name": "Kaufland",
        "main_url": "https://katalozi.net/kaufland-katalog",
        "catalog_base": "https://katalozi.net/kaufland-katalog",
        "slug": "kaufland",
    },
    {
        "name": "Plodine",
        "main_url": "https://katalozi.net/plodine-katalog",
        "catalog_base": "https://katalozi.net/plodine-katalog",
        "slug": "plodine",
    },
    {
        "name": "Studenac",
        "main_url": "https://katalozi.net/studenac-katalog",
        "catalog_base": "https://katalozi.net/studenac-katalog",
        "slug": "studenac",
    },
    {
        "name": "Tommy",
        "main_url": "https://katalozi.net/tommy-katalog",
        "catalog_base": "https://katalozi.net/tommy-katalog",
        "slug": "tommy",
    },
]


def fetch_page(url):
    try:
        resp = requests.get(url, timeout=15, headers=HEADERS)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print("     GRESKA fetch: " + str(e))
        return ""


def extract_article_links(html, catalog_base):
    """Izvuci linkove na pojedinacne kataloge."""
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if catalog_base in href or "/akcija/" in href:
            if href not in links:
                links.append(href)
    # Filtriraj samo veljaca 2026
    feb_links = []
    for link in links:
        text = link.lower()
        keep = False
        for marker in [
            "02-2", "02.", "2-2", "veljac",
            "10-2", "17-2", "24-2", "16-2",
            "04-02", "11-02", "18-02",
            "pocetak-tjedna", "vikend-akcija",
        ]:
            if marker in text:
                keep = True
                break
        if keep:
            feb_links.append(link)
    return feb_links


def extract_article_text(html):
    """Izvuci samo tekst clanka bez navigacije."""
    soup = BeautifulSoup(html, "html.parser")
    # Probaj naci main content
    article = soup.find("article")
    if not article:
        article = soup.find("div", class_="entry-content")
    if not article:
        article = soup.find("div", class_="post")
    if not article:
        # Fallback: uzmi sve paragrafe
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text(" ", strip=True) for p in paragraphs)
        return text
    return article.get_text(" ", strip=True)


def scrape_retailer(retailer):
    name = retailer["name"]
    main_url = retailer["main_url"]
    catalog_base = retailer["catalog_base"]
    slug = retailer["slug"]

    LEAFLET_DIR.mkdir(parents=True, exist_ok=True)
    print("")
    print("[SCRAPE] " + name)
    print("  Glavna: " + main_url)

    # 1. Dohvati glavnu stranicu
    main_html = fetch_page(main_url)
    if not main_html:
        return ""

    main_text = extract_article_text(main_html)
    print("  Glavna: " + str(len(main_text)) + " znakova")

    # 2. Nadi linkove na pojedinacne kataloge
    links = extract_article_links(main_html, catalog_base)
    print("  Nadjeno " + str(len(links)) + " pod-stranica")

    # 3. Dohvati svaku pod-stranicu
    all_text = main_text + "\n\n"
    fetched = 0
    for link in links[:10]:  # Max 10 pod-stranica
        if not link.startswith("http"):
            link = "https://katalozi.net" + link
        time.sleep(1)  # Budi pristojan
        sub_html = fetch_page(link)
        if sub_html:
            sub_text = extract_article_text(sub_html)
            if len(sub_text) > 200:
                all_text = all_text + sub_text + "\n\n"
                fetched = fetched + 1
                short = link.split("/")[-1]
                msg = "    + " + short
                msg = msg + " (" + str(len(sub_text)) + " zn.)"
                print(msg)

    total = str(len(all_text))
    msg = "  UKUPNO: " + total + " znakova"
    msg = msg + " (" + str(fetched) + " pod-str.)"
    print(msg)

    # Spremi
    filepath = LEAFLET_DIR / (slug + "_text.txt")
    filepath.write_text(all_text[:30000], encoding="utf-8")
    return all_text[:30000]


def scrape_all():
    print("=" * 50)
    print("PromoRadar Deep Scraper v2 — " + TODAY)
    print("=" * 50)
    for ret in RETAILERS:
        scrape_retailer(ret)
        time.sleep(2)
    print("")
    print("Gotovo! Datoteke u: leaflets/" + TODAY + "/")


if __name__ == "__main__":
    scrape_all()