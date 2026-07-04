import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # Launch browser
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Intercept the SERVER RESPONSE containing the actual links
    def handle_response(response):
        if "/api/sources" in response.url:
            print("\n================ [ CAPTURED VIDEO SOURCES ] ================")
            try:
                # Print the raw JSON containing the iframe/stream URLs
                data = response.json()
                print(json.dumps(data, indent=2))
            except Exception:
                print(response.text())
            print("============================================================\n")

    page.on("response", handle_response)

    print("Opening page...")
    page.goto("https://bingebox.to/watch/show/48891?s=1&e=1")

    # Keep alive long enough to catch the API response
    page.wait_for_timeout(25000)
    browser.close()