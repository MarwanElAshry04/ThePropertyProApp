from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.microsoft import EdgeChromiumDriverManager
import time

# Setup Edge
edge_options = Options()
# edge_options.add_argument('--headless')  # Comment out to see browser
edge_options.add_argument('--no-sandbox')
edge_options.add_argument('--disable-blink-features=AutomationControlled')
edge_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

service = Service(EdgeChromiumDriverManager().install())
driver = webdriver.Edge(service=service, options=edge_options)

# Test URL
url = "https://www.propertyfinder.eg/en/plp/buy/chalet-for-sale-red-sea-hurghada-al-gouna-swan-lake-gouna-7841194.html"

print(f"🌐 Opening: {url}\n")

driver.get(url)

# Wait for page to load
time.sleep(5)

# Check if it loaded
page_source = driver.page_source

if "AWS WAF" in page_source or len(page_source) < 5000:
    print("❌ BLOCKED by AWS WAF")
    print(f"Page length: {len(page_source)}")
else:
    print("✅ PAGE LOADED!")
    print(f"Page length: {len(page_source)}")
    
    # Try to find elements
    try:
        title = driver.title
        print(f"Title: {title}")
        
        # Save page source
        with open('selenium_page.html', 'w', encoding='utf-8') as f:
            f.write(page_source)
        print("\n📄 Saved to selenium_page.html")
        
    except Exception as e:
        print(f"Error: {e}")

driver.quit()