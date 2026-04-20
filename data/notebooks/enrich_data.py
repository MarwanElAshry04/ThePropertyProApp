import pandas as pd
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import time
import random
from tqdm import tqdm


ua = UserAgent()

def scrape_property_details(url):
    """Scrape additional details from a PropertyFinder listing"""

    headers = {
        'User-Agent': ua.random,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    try:
        time.sleep(random.uniform(4, 2))

        response = requests.get(url, headers=headers, timeout = 15)

        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'lxml')

            details = {}

            amenities = []
            amenity_items = soup.find_all('li', class_ = 'amenity')
            for item in amenity_items:
                amenities.append(item.get_text(strip = True))

            if amenities:
                details['amenities'] = ', '.join(amenities)

                # Extract coordinates (if available in meta tags or scripts)
            try:
                # Look for latitude/longitude in meta tags or JSON
                lat_meta = soup.find('meta', {'property': 'place:location:latitude'})
                lng_meta = soup.find('meta', {'property': 'place:location:longitude'})
                
                if lat_meta and lng_meta:
                    details['latitude'] = lat_meta.get('content')
                    details['longitude'] = lng_meta.get('content')
            except:
                pass
            
            return details
            
        elif response.status_code == 403:
            print(f"  403 blocked")
            return None
            
    except Exception as e:
        print(f" Error: {e}")
        return None
    

# Test on first 5 properties
print("🧪 TESTING SCRAPER ON 5 PROPERTIES...\n")

df = pd.read_csv('C:/Users/marwa/PropertyPro/data/raw/egypt_real_estate_listings.csv')

for idx in range(5):
    url = df.iloc[idx]['url']
    print(f"[{idx+1}/5] Scraping: {url[:50]}...")
    
    details = scrape_property_details(url)
    
    if details:
        print(f"✅ Extracted: {list(details.keys())}")
        print(f"   Preview: {str(details)[:100]}...")
    else:
        print(f" Failed")
    
    print()

print("\n Test complete! Check if data looks good.")
            