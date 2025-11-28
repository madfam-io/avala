#!/usr/bin/env python3
"""
Robust committee extraction from CONOCER API
Handles JSON with control characters and saves progressively
"""

import json
import os
import re
import time
import urllib.request

OUTPUT_DIR = "./data/extracted"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "committees_complete.json")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "extraction_progress.json")


def clean_json_string(s):
    """Remove control characters that break JSON parsing"""
    # Remove control characters except newline and tab
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", s)


def fetch_committee(id):
    """Fetch single committee with robust error handling"""
    url = f"https://conocer.gob.mx/CONOCERBACKCITAS/comites/{id}"

    try:
        req = urllib.request.Request(
            url, headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8", errors="replace")
            cleaned = clean_json_string(raw)
            data = json.loads(cleaned)

            if data.get("responseStatus") == 200 and data.get("results"):
                result = data["results"]
                result["id"] = id
                return result
    except Exception as e:
        pass  # Silently skip errors

    return None


def save_progress(committees, last_id, total_scanned):
    """Save current progress"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Save committees
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(committees, f, ensure_ascii=False, indent=2)

    # Save progress info
    with open(PROGRESS_FILE, "w") as f:
        json.dump(
            {
                "last_id": last_id,
                "total_scanned": total_scanned,
                "committees_found": len(committees),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            },
            f,
            indent=2,
        )


def main():
    print("=" * 60)
    print("CONOCER Committee Extraction")
    print("=" * 60)

    committees = []
    max_id = 750
    save_interval = 50

    print(f"Scanning IDs 1 to {max_id}...")
    print()

    for id in range(1, max_id + 1):
        committee = fetch_committee(id)

        if committee:
            committees.append(committee)

        # Progress update
        if id % 50 == 0:
            print(f"  Scanned {id}/{max_id} - Found {len(committees)} committees")

        # Save periodically
        if id % save_interval == 0:
            save_progress(committees, id, id)

        # Small delay to be nice to the server
        time.sleep(0.08)

    # Final save
    save_progress(committees, max_id, max_id)

    print()
    print("=" * 60)
    print(f"EXTRACTION COMPLETE")
    print(f"  Total committees: {len(committees)}")
    print(f"  Output file: {OUTPUT_FILE}")
    print("=" * 60)

    # Show sample
    if committees:
        print("\nSample committee data:")
        sample = committees[0]
        print(f"  Name: {sample.get('nombre', 'N/A')}")
        print(f"  President: {sample.get('presidente', 'N/A')}")
        print(f"  ECs associated: {len(sample.get('estandaresAsociados', []))}")


if __name__ == "__main__":
    main()
