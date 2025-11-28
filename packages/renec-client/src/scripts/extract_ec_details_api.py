#!/usr/bin/env python3
"""
EC Details API Extractor
Attempts to extract EC certifier data using direct API calls.
Falls back to Playwright DOM extraction if API fails.
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "extracted"
CHECKPOINT_FILE = OUTPUT_DIR / "ec_details_api_checkpoint.json"
OUTPUT_FILE = OUTPUT_DIR / "ec_certifiers.json"
BATCH_SIZE = 50
MAX_WORKERS = 5  # Parallel requests
REQUEST_DELAY = 0.5  # Seconds between requests

# API endpoints discovered from the SPA
API_BASE = "https://conocer.gob.mx/CONOCERBACKCITAS"
ENDPOINTS = {
    "desc_estandar": f"{API_BASE}/sectoresProductivos/getDescEstandar/",
    "datos_comite": f"{API_BASE}/sectoresProductivos/getDatosGeneralesComite/",
    "all_standards": f"{API_BASE}/sectoresProductivos/getEstandaresAll",
}

# Headers to mimic browser
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Origin": "https://conocer.gob.mx",
    "Referer": "https://conocer.gob.mx/conocer/",
}

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def clean_json_response(text: str) -> str:
    """Remove control characters that may break JSON parsing."""
    return re.sub(r"[\x00-\x1f\x7f-\x9f]", "", text)


def load_ec_codes() -> list[str]:
    """Load EC codes from extracted standards."""
    ec_file = OUTPUT_DIR / "ec_standards_api.json"
    if not ec_file.exists():
        print(f"Error: {ec_file} not found")
        return []

    with open(ec_file, "r", encoding="utf-8") as f:
        standards = json.load(f)

    codes = set()
    for std in standards:
        code = std.get("codigo") or std.get("clave")
        if code:
            codes.add(code)

    return sorted(codes)


def load_checkpoint() -> dict:
    """Load checkpoint."""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"processed": [], "failed": [], "data": {}}


def save_checkpoint(checkpoint: dict):
    """Save checkpoint."""
    checkpoint["last_updated"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False)


def fetch_ec_detail_api(ec_code: str) -> dict | None:
    """Try to fetch EC details via direct API call."""
    url = f"{ENDPOINTS['desc_estandar']}{ec_code}"

    # Try different request body formats
    bodies = [
        None,  # No body
        b"",  # Empty body
        b"{}",  # Empty JSON
        json.dumps({"codigo": ec_code}).encode("utf-8"),
    ]

    for body in bodies:
        try:
            req = urllib.request.Request(url, data=body, method="POST", headers=HEADERS)

            with urllib.request.urlopen(req, timeout=30) as response:
                if response.status == 200:
                    data = response.read().decode("utf-8")
                    data = clean_json_response(data)
                    result = json.loads(data)

                    # Check if we got valid data
                    if isinstance(result, dict) and result:
                        return result
                    elif isinstance(result, list) and result:
                        return {"items": result}
        except urllib.error.HTTPError as e:
            if e.code != 500:  # Ignore 500 errors, try next body
                pass
        except Exception as e:
            pass

    return None


def fetch_ec_via_search_api(ec_code: str) -> dict | None:
    """Try to fetch EC via search endpoint."""
    url = "https://conocer.gob.mx/CONOCERBACKCITAS/sectoresProductivos/search"

    try:
        body = json.dumps({"query": ec_code}).encode("utf-8")
        req = urllib.request.Request(url, data=body, method="POST", headers=HEADERS)

        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                data = response.read().decode("utf-8")
                data = clean_json_response(data)
                return json.loads(data)
    except:
        pass

    return None


def process_ec(ec_code: str) -> tuple[str, dict | None]:
    """Process a single EC code."""
    time.sleep(REQUEST_DELAY)  # Rate limiting

    # Try direct API first
    result = fetch_ec_detail_api(ec_code)

    if result:
        return (
            ec_code,
            {
                "ec_code": ec_code,
                "source": "api",
                "data": result,
                "extraction_time": datetime.now().isoformat(),
            },
        )

    # API failed
    return (ec_code, None)


def main():
    """Main extraction process."""
    print("=" * 60)
    print("EC Details API Extractor")
    print("=" * 60)

    # Load EC codes
    ec_codes = load_ec_codes()
    print(f"Found {len(ec_codes)} EC codes")

    # Load checkpoint
    checkpoint = load_checkpoint()
    processed = set(checkpoint["processed"])
    remaining = [c for c in ec_codes if c not in processed]

    print(f"Already processed: {len(processed)}, Remaining: {len(remaining)}")

    if not remaining:
        print("All done!")
        return

    # Test first few to see if API works
    print("\nTesting API access with first 5 ECs...")
    test_results = []
    for ec_code in remaining[:5]:
        print(f"  Testing {ec_code}...", end=" ")
        code, result = process_ec(ec_code)
        if result:
            print("✓ API works!")
            test_results.append(result)
        else:
            print("✗ API failed")

    if not test_results:
        print("\n⚠️  Direct API access not working.")
        print("The CONOCER API requires browser context/cookies.")
        print("Use the Playwright-based extractor instead:")
        print("  python extract_ec_details_playwright.py")
        return

    # If API works, continue with parallel extraction
    print(
        f"\nAPI working! Processing {len(remaining)} ECs with {MAX_WORKERS} workers..."
    )

    success_count = 0
    fail_count = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_ec, code): code for code in remaining}

        for i, future in enumerate(as_completed(futures)):
            ec_code, result = future.result()

            if result:
                checkpoint["data"][ec_code] = result
                checkpoint["processed"].append(ec_code)
                success_count += 1
            else:
                checkpoint["failed"].append(ec_code)
                fail_count += 1

            # Progress update
            if (i + 1) % BATCH_SIZE == 0:
                save_checkpoint(checkpoint)
                print(
                    f"Progress: {i + 1}/{len(remaining)} | Success: {success_count} | Failed: {fail_count}"
                )

    # Save final results
    save_checkpoint(checkpoint)

    # Save consolidated output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "extraction_date": datetime.now().isoformat(),
                "total": len(checkpoint["data"]),
                "failed": checkpoint["failed"],
                "ec_certifiers": checkpoint["data"],
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    print("\n" + "=" * 60)
    print("Extraction Complete!")
    print(f"  Success: {success_count}")
    print(f"  Failed: {fail_count}")
    print(f"  Output: {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
