import json
from quota_parser import parse_quota_table
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- STEP 1: LOAD REFERENCE DATA FROM SUBFOLDER ---
# Using os.path.join for cross-platform compatibility (Windows/Mac/Linux)
sites_path = os.path.join('data', 'sites.json')

try:
    with open(sites_path, 'r', encoding='utf-8') as f:
        sites_reference = json.load(f)
except FileNotFoundError:
    print(f"Error: Could not find {sites_path}. Please ensure the 'data' folder exists.")
    sites_reference = []

# Narrow Kannada spelling aliases shared with the explorer's data rules.
import re
import unicodedata
with open(os.path.join('data', 'kannada-name-aliases.json'), encoding='utf-8') as aliases_file:
    kannada_aliases = json.load(aliases_file)

def kannada_key(value):
    value = unicodedata.normalize('NFC', value.strip())
    value = re.sub(r'(?:\s|-)(\d+(?:/\d+)?)\s*$', '', value)
    value = re.sub(r'[\s.\-–—()]', '', value)
    return kannada_aliases.get(value, value)

def get_matched_english_name(kannada_name_from_web):
    """Use original Kannada identity; never fuzzy-match a different village."""
    names = {item['grama_name_en'].strip() for item in sites_reference
             if kannada_key(item['grama_name_kn']) == kannada_key(kannada_name_from_web)}
    if len(names) == 1:
        return names.pop()
    return f"Unknown ({kannada_name_from_web})"

# --- STEP 2: SCRAPER SETUP ---
options = webdriver.ChromeOptions()
# Do not make driver.get wait for every network resource; the Ashraya site
# can keep connections open. Explicit waits below wait for the actual tables.
options.page_load_strategy = "eager"
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(options=options)
driver.set_page_load_timeout(45)
wait = WebDriverWait(driver, 30)

def scrape_sub_table():
    wait.until(EC.presence_of_element_located((By.ID, 'grdLocationwise_LinkButton1_0')))
    table_rows = driver.execute_script("""
        const location = document.getElementById('grdLocationwise_LinkButton1_0');
        const table = location.closest('table');
        return Array.from(table.rows).filter(row => row.closest('table') === table).map(row => ({
            cells: Array.from(row.cells).map(cell => ({
                text: cell.innerText.trim(), rowSpan: cell.rowSpan, colSpan: cell.colSpan,
                locationId: cell.querySelector('[id^="grdLocationwise_LinkButton1_"]')?.id || ''
            }))
        }));
    """)
    parsed = parse_quota_table(table_rows)
    rows = []
    for row in parsed:
        public = row['public']
        row_entry = {'location_kn': row['location_kn'],
                     'location_en': get_matched_english_name(row['location_kn']),
                     'SC flats': public['SC'], 'GEN flats': public['General'],
                     'Min Flats': public['Minority'], 'Total': public['Total'],
                     'mla_quota': row['mla'],
                     'public_stock': row['public_stock'], 'mla_stock': row['mla_stock'],
                     'combined_stock': int(row['public_stock']['Total']) + int(row['mla_stock']['Total']),
                     'location_id': row['location_id'],
                     'public_source_headers': public['source_headers']}
        rows.append(row_entry)
    return rows

# --- STEP 3: MAIN EXECUTION ---
try:
    driver.get("https://ashraya.karnataka.gov.in/cm_selection_flat/frmConstwise_Report_Available.aspx")
    os.makedirs("scraper-debug", exist_ok=True)
    print("Page URL:", driver.current_url)
    print("Page title:", driver.title)
    driver.save_screenshot("scraper-debug/page.png")
    with open("scraper-debug/page.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)	
    all_master_data = []
    
    wait.until(EC.presence_of_element_located((By.ID, 'grdConstwise_LinkButton1_0')))
    # Identify all main LinkButtons
    main_links = driver.find_elements(By.XPATH, '//a[contains(@id, "grdConstwise_LinkButton1_")]')
    main_links_count = len(main_links)

    for i in range(main_links_count):
        # Re-fetch link to avoid stale elements
        link = wait.until(EC.element_to_be_clickable((By.ID, f"grdConstwise_LinkButton1_{i}")))
        category_name = link.text
        print(f"Scraping category: {category_name}")
        link.click()
        
        # Scrape the horizontal data for this category
        table_data = scrape_sub_table()
        
        all_master_data.append({
            "category_name": category_name,
            "data": table_data
        })
        
        # Return to main list
        driver.back()
        wait.until(EC.presence_of_element_located((By.ID, "grdConstwise_LinkButton1_0")))

    if not all_master_data or any(not category['data'] for category in all_master_data):
        raise RuntimeError('Incomplete scrape; refusing to replace the existing report.')

    mla_rows = sum(row.get('mla_quota') is not None
                   for category in all_master_data for row in category['data'])
    if not mla_rows:
        raise RuntimeError('No MLA Available columns found; existing report retained.')
    if os.path.exists('ashraya_master_report.json'):
        with open('ashraya_master_report.json', encoding='utf-8') as previous_file:
            previous = json.load(previous_file)
        if not mla_rows and any(row.get('mla_quota') for category in previous for row in category['data']):
            raise RuntimeError('MLA controls disappeared; refusing to replace a report containing MLA data.')

    # Save final synchronized report
    with open('ashraya_master_report.json.tmp', 'w', encoding='utf-8') as f:
        json.dump(all_master_data, f, ensure_ascii=False, indent=4)
    os.replace('ashraya_master_report.json.tmp', 'ashraya_master_report.json')
    
    print("\nSuccess! Report saved as ashraya_master_report.json using names from data/sites.json")

finally:
    driver.quit()