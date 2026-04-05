import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from multiprocessing import Pool
import time

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# =========================================
# Chrome options
# =========================================
def chrome_options():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    return options

# =========================================
# Scanner Helper (Finds all options)
# =========================================
def scan_page_for_buttons(url):
    print(f"🔍 Scanning page: {url} ...")
    driver = webdriver.Chrome(options=chrome_options())
    found_buttons = []

    try:
        driver.get(url)
        time.sleep(4) # Wait for load

        # Find ALL potential buttons
        button_texts = ["Download Links", "Episode Links", "Batch/Zip File"]
        raw_buttons = []
        for text in button_texts:
            elems = driver.find_elements(By.XPATH, f"//a[normalize-space()='{text}'] | //button[normalize-space()='{text}']")
            raw_buttons.extend(elems)

        # Remove duplicates & Sort Top-to-Bottom
        unique_buttons = list(set(raw_buttons))
        unique_buttons.sort(key=lambda x: x.location['y'])

        print(f"✅ Found {len(unique_buttons)} buttons. analyzing locations...")

        # Extract info for the user to choose
        for index, btn in enumerate(unique_buttons):
            try:
                y_pos = btn.location['y']
                txt = btn.text
                found_buttons.append({
                    "id": index,
                    "text": txt,
                    "y": y_pos,
                    "url_hint": btn.get_attribute('href')
                })
            except:
                pass

    except Exception as e:
        print(f"Error scanning: {e}")
    finally:
        driver.quit()

    return found_buttons

# =========================================
# Worker function (Executes Selection)
# =========================================
def worker(task):
    target_url, button_index_to_click = task
    print(f"🚀 [Worker] Starting task for Button #{button_index_to_click + 1}...")

    driver = webdriver.Chrome(options=chrome_options())
    wait = WebDriverWait(driver, 25)

    try:
        # --- PART A: Navigate & Re-Find Button ---
        driver.get(target_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(3)

        # Re-scan to find the same sorted list
        button_texts = ["Download Links", "Episode Links", "Batch/Zip File"]
        raw_buttons = []
        for text in button_texts:
            elems = driver.find_elements(By.XPATH, f"//a[normalize-space()='{text}'] | //button[normalize-space()='{text}']")
            raw_buttons.extend(elems)

        unique_buttons = list(set(raw_buttons))
        unique_buttons.sort(key=lambda x: x.location['y'])

        if button_index_to_click >= len(unique_buttons):
            return {"index": button_index_to_click, "status": "error", "message": f"Button index {button_index_to_click} no longer exists."}

        target_btn = unique_buttons[button_index_to_click]
        btn_text_log = target_btn.text

        # Scroll & Click
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", target_btn)
        time.sleep(1)

        current_handles = set(driver.window_handles)
        target_btn.click()
        print(f"✅ [Worker] Clicked button #{button_index_to_click + 1}")
        time.sleep(5)

        # Switch to new tab
        new_handles = set(driver.window_handles) - current_handles
        if new_handles:
            driver.switch_to.window(new_handles.pop())

        # --- PART B: Verification Logic ---

        # 1. Fast Server
        try:
            server_btn = wait.until(EC.presence_of_element_located((
                By.XPATH, "//*[contains(text(), 'Fast Server') or contains(text(), 'All Episodes Batch')]"
            )))
            driver.execute_script("arguments[0].click();", server_btn)
            time.sleep(3)
            if len(driver.window_handles) > len(current_handles) + 1:
                driver.switch_to.window(driver.window_handles[-1])
        except:
            pass

        # 2. Verification Steps
        def click_verify(txt):
            try:
                xpath = f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{txt.lower()}')]"
                el = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
                driver.execute_script("arguments[0].click();", el)
                print(f"[Worker] Clicked '{txt}'")
                return True
            except:
                return False

        click_verify('Start Verification')
        time.sleep(2)
        click_verify('Verify To Continue')
        print(f"[Worker] Waiting 10s...")
        time.sleep(10)
        click_verify('Click Here To Continue')
        time.sleep(3)
        click_verify('Go to download')

        # --- PART C: FINAL RESOLVE ---
        print(f"[Worker] Searching for final pepe link...")
        time.sleep(5)

        target_pattern = "https://cloud.unblockedgames.world/?go=pepe-"
        found_link = None

        links = driver.find_elements(By.TAG_NAME, 'a')
        for link_element in links:
            href = link_element.get_attribute('href')
            if href and href.startswith(target_pattern):
                found_link = href
                break

        if found_link:
            print(f"✅ [Worker] Found matching link: {found_link}")
            driver.get(found_link)
            print(f"[Worker] Resolving final URL...")
            time.sleep(5)
            final_resolved_url = driver.current_url
            print(f"🎯 [Worker] FINAL RESULT: {final_resolved_url}")
            return {"index": button_index_to_click, "text": btn_text_log, "status": "success", "url": final_resolved_url}
        else:
            return {"index": button_index_to_click, "text": btn_text_log, "status": "error", "message": "Failed: Pattern not found"}

    except Exception as e:
        return {"index": button_index_to_click, "status": "error", "message": f"Error: {str(e)}"}

    finally:
        driver.quit()

# =========================================
# API Endpoints
# =========================================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/scan', methods=['POST'])
def api_scan():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    buttons = scan_page_for_buttons(url)
    return jsonify({"buttons": buttons})

@app.route('/api/resolve', methods=['POST'])
def api_resolve():
    data = request.json
    url = data.get('url')
    indices = data.get('indices', [])

    if not url or not indices:
        return jsonify({"error": "Invalid input"}), 400

    tasks = [(url, idx) for idx in indices]
    results = []

    # We use sequential processing here to be safer with resources
    # instead of full multiprocessing pool, or limit pool size
    try:
        # Limited to 2 processes to avoid choking the server on standard environments
        with Pool(processes=min(len(tasks), 2)) as pool:
            results = pool.map(worker, tasks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"results": results})

if __name__ == '__main__':
    # Start on port 3000 to match typical portfolio setups
    app.run(host='0.0.0.0', port=3000, debug=True)
