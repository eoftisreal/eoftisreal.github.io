from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We know the index route uses WebGL. We can use a different route and manually render HomePage
        # But this is just a CSS class removal, we can actually just inspect the HTML or mock the background.
        # Let's write a small temporary page that imports HomePage without the WebGL background layout.
        pass

if __name__ == '__main__':
    run()
