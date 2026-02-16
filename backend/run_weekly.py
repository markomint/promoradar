"""
PromoRadar Master Pipeline
Pokrece cijeli tjedni proces: scrape -> extract -> upload
Pokreni ovu jednu skriptu i sve se odradi automatski.
"""

import time
from datetime import datetime

print("=" * 50)
print(f"  PromoRadar Pipeline")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
print("=" * 50)

# --- KORAK 1: Scraping ---
print("\n" + "-" * 50)
print("KORAK 1/3: Scraping kataloga...")
print("-" * 50)

from scraper import scrape_all
scrape_all()
time.sleep(2)

# --- KORAK 2: AI Ekstrakcija ---
print("\n" + "-" * 50)
print("KORAK 2/3: AI ekstrakcija proizvoda...")
print("-" * 50)

from extractor import process_all
products = process_all()

# --- KORAK 3: Upload u bazu ---
print("\n" + "-" * 50)
print("KORAK 3/3: Upload u Supabase...")
print("-" * 50)

from uploader import upload_products
count = upload_products(products)

# --- GOTOVO ---
print("\n" + "=" * 50)
print(f"  GOTOVO!")
print(f"  {len(products)} proizvoda izvuceno")
print(f"  {count} proizvoda uneseno u bazu")
print(f"  Dashboard: https://promoradar-TVOJ-URL.vercel.app")
print("=" * 50)