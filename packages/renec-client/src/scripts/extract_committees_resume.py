#!/usr/bin/env python3
"""
Resume CONOCER Committee Extraction from last checkpoint
"""

import json
import os
import re
import time
import urllib.error
import urllib.request

DATA_DIR = "data/extracted"
OUTPUT_FILE = f"{DATA_DIR}/committees_complete.json"
PROGRESS_FILE = f"{DATA_DIR}/extraction_progress.json"
MAX_ID = 800  # Extended range


def clean_json_string(s):
    """Remove control characters that break JSON parsing"""
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", s)


def fetch_committee(id):
    """Fetch a single committee by ID"""
    url = f"https://conocer.gob.mx/CONOCERBACKCITAS/comites/{id}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8", errors="replace")
            cleaned = clean_json_string(raw)
            data = json.loads(cleaned)

            if data.get("responseStatus") == 200 and data.get("results"):
                result = data["results"]
                result["id"] = id
                return result
    except urllib.error.HTTPError as e:
        if e.code not in [404, 409]:
            print(f"  HTTP {e.code} for ID {id}")
    except Exception as e:
        print(f"  Error ID {id}: {type(e).__name__}")

    return None


def load_existing():
    """Load existing committees and progress"""
    committees = []
    start_id = 1

    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r") as f:
            committees = json.load(f)
        print(f"Loaded {len(committees)} existing committees")

    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            progress = json.load(f)
            start_id = progress.get("last_id", 0) + 1
            print(f"Resuming from ID {start_id}")

    return committees, start_id


def save_progress(committees, last_id, total_scanned):
    """Save current state"""
    with open(OUTPUT_FILE, "w") as f:
        json.dump(committees, f, indent=2, ensure_ascii=False)

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
    print("CONOCER Committee Extraction - Resume")
    print("=" * 60)

    committees, start_id = load_existing()

    if start_id > MAX_ID:
        print(f"Extraction already complete up to ID {MAX_ID}")
        return

    print(f"Scanning IDs {start_id} to {MAX_ID}...")
    print()

    total_scanned = start_id - 1
    new_found = 0

    for id in range(start_id, MAX_ID + 1):
        committee = fetch_committee(id)

        if committee:
            committees.append(committee)
            new_found += 1

        total_scanned = id

        # Save every 50 IDs
        if id % 50 == 0:
            save_progress(committees, id, id)
            print(
                f"  Scanned {id}/{MAX_ID} - Total: {len(committees)} committees (+{new_found} new)"
            )

        # Rate limit
        time.sleep(0.15)

    # Final save
    save_progress(committees, MAX_ID, MAX_ID)

    print()
    print("=" * 60)
    print(f"EXTRACTION COMPLETE")
    print(f"  Total committees: {len(committees)}")
    print(f"  New in this run: {new_found}")
    print(f"  IDs scanned: 1 to {MAX_ID}")
    print("=" * 60)

    # Extract associated EC codes
    all_ec_codes = set()
    for c in committees:
        if "estandaresAsociados" in c:
            for ec in c["estandaresAsociados"]:
                if "codigo" in ec:
                    all_ec_codes.add(ec["codigo"])

    print(f"\nAssociated EC codes found: {len(all_ec_codes)}")

    # Save EC code list
    with open(f"{DATA_DIR}/ec_codes_from_committees.json", "w") as f:
        json.dump(sorted(list(all_ec_codes)), f, indent=2)
    print(f"Saved EC codes to ec_codes_from_committees.json")


if __name__ == "__main__":
    main()
