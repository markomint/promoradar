"""
PromoRadar Scraper
Preuzima tekstualne opise kataloga sa katalozi.net
"""

import requests
from datetime import datetime
from pathlib import Path

TODAY = datetime.now().strftime("%Y-%m-%d")
LEAFLET_DIR = Path("leaflets") / TODAY


def scrape_retailer(slug, name):
    LEAFLET_DIR.mkdir(parents=True, exist_ok=True)
    url = f"https://katalozi.net/{slug}"
    print(f"[SCRAPE] {name} — {url}")
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "PromoRadar/1.0"})
        resp.raise_for_status()
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        filepath = LEAFLET_DIR / f"{slug}_text.txt"
        filepath.write_text(text[:20000], encoding="utf-8")
        print(f"  OK — {len(text)} znakova")
        return text[:20000]
    except Exception as e:
        print(f"  GRESKA — {e}")
        return ""


def scrape_all():
    retailers = [
        ("konzum-akcija", "Konzum"),
        ("spar-katalog-2", "Spar"),
        ("lidl-katalog", "Lidl"),
        ("kaufland-katalog", "Kaufland"),
        ("plodine-katalog", "Plodine"),
        ("studenac-katalog", "Studenac"),
        ("tommy-katalog", "Tommy"),
    ]
    print("=" * 50)
    print(f"PromoRadar Scraper — {TODAY}")
    print("=" * 50)
    for slug, name in retailers:
        scrape_retailer(slug, name)
    print(f"\nGotovo! Datoteke u: leaflets/{TODAY}/")


if __name__ == "__main__":
    scrape_all()