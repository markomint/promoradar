import time
from datetime import datetime

print("=" * 50)
print("  PromoRadar Pipeline")
print("  " + datetime.now().strftime("%Y-%m-%d %H:%M"))
print("=" * 50)

print("")
print("KORAK 1/4: Scraping kataloga...")
print("-" * 50)
from scraper import scrape_all
scrape_all()
time.sleep(2)

print("")
print("KORAK 2/4: AI ekstrakcija proizvoda...")
print("-" * 50)
from extractor import process_all
products = process_all()

print("")
print("KORAK 3/4: Upload u Supabase...")
print("-" * 50)
from uploader import upload_products
count = upload_products(products)

print("")
print("KORAK 4/4: Email digest...")
print("-" * 50)
from emailer import send_digest
send_digest()

print("")
print("=" * 50)
print("  GOTOVO!")
msg = "  " + str(len(products)) + " izvuceno, "
msg = msg + str(count) + " uneseno u bazu"
print(msg)
print("=" * 50)