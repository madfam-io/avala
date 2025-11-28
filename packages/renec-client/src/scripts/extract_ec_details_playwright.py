#!/usr/bin/env python3
"""
EC Details Extractor using Playwright
Extracts certifiers, training courses, and other details for each EC standard
by navigating the CONOCER SPA and extracting data from the DOM.

Uses progressive saving to prevent data loss.
"""

import asyncio
import json
import os
import time
from datetime import datetime
from pathlib import Path

# Try to import playwright
try:
    from playwright.async_api import TimeoutError as PlaywrightTimeout
    from playwright.async_api import async_playwright
    print(
        "Playwright not installed. Install with: pip install playwright && playwright install chromium"
    )
    exit(1)

# Configuration
BASE_URL = "https://conocer.gob.mx/conocer/#/renec"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "extracted"
CHECKPOINT_FILE = OUTPUT_DIR / "ec_details_checkpoint.json"
OUTPUT_FILE = OUTPUT_DIR / "ec_details_full.json"
BATCH_SIZE = 10  # Save every N ECs
TIMEOUT = 30000  # 30 seconds
MAX_RETRIES = 3

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_ec_codes() -> list[str]:
    """Load EC codes from the extracted standards file."""
    ec_file = OUTPUT_DIR / "ec_standards_api.json"
    if not ec_file.exists():
        print(f"Error: {ec_file} not found. Run API extraction first.")
        exit(1)

    with open(ec_file, "r", encoding="utf-8") as f:
        standards = json.load(f)

    # Extract unique codes
    codes = []
    for std in standards:
        code = std.get("codigo") or std.get("clave")
        if code:
            codes.append(code)

    return sorted(set(codes))


def load_checkpoint() -> dict:
    """Load checkpoint data if exists."""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"processed": [], "failed": [], "data": {}, "last_updated": None}


def save_checkpoint(checkpoint: dict):
    """Save checkpoint data."""
    checkpoint["last_updated"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, indent=2, ensure_ascii=False)


def save_final_output(checkpoint: dict):
    """Save the final consolidated output."""
    output = {
        "extraction_date": datetime.now().isoformat(),
        "total_ecs": len(checkpoint["data"]),
        "failed_ecs": checkpoint["failed"],
        "ec_details": checkpoint["data"],
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved final output to {OUTPUT_FILE}")


async def extract_ec_data(page) -> dict:
    """Extract EC data from the currently loaded detail page."""

    extraction_script = """
    () => {
        const result = {
            title: '',
            occupations: [],
            certifiers: [],
            committee_members: [],
            courses: [],
            error: null
        };

        try {
            // Get EC title
            const titleEl = document.querySelector('p');
            if (titleEl) {
                result.title = titleEl.textContent.trim();
            }

            // Get all tables
            const tables = document.querySelectorAll('mat-table, table, [role="grid"]');

            tables.forEach((table) => {
                const header = table.querySelector('mat-header-cell, th, [role="columnheader"]');
                const headerText = header?.textContent?.trim() || '';

                const rows = table.querySelectorAll('mat-row, [role="row"]');
                const items = [];

                rows.forEach(row => {
                    const cell = row.querySelector('mat-cell, [role="gridcell"]');
                    if (cell) {
                        const text = cell.textContent?.trim();
                        if (text && text !== headerText) {
                            items.push(text);
                        }
                    }
                });

                // Categorize by header
                if (headerText.includes('Ocupacion')) {
                    result.occupations = items;
                } else if (headerText.includes('Certificador')) {
                    result.certifiers = items;
                } else if (headerText.includes('Integrantes')) {
                    result.committee_members = items;
                } else if (headerText.includes('Cursos')) {
                    result.courses = items;
                }
            });
        } catch (e) {
            result.error = e.message;
        }

        return result;
    }
    """

    return await page.evaluate(extraction_script)


async def navigate_to_ec(page, ec_code: str) -> bool:
    """Navigate to an EC's detail page via search."""
    try:
        # Go to RENEC main page
        await page.goto(BASE_URL, wait_until="networkidle", timeout=TIMEOUT)
        await page.wait_for_timeout(2000)  # Wait for Angular to initialize

        # Find and fill the search input
        search_input = page.locator(
            'input[type="text"], input[placeholder*="Buscar"], input[placeholder*="buscar"]'
        ).first
        await search_input.fill(ec_code)
        await page.wait_for_timeout(1000)

        # Press Enter or click search button
        await search_input.press("Enter")
        await page.wait_for_timeout(2000)

        # Click on the search result that matches our EC code
        result_link = page.locator(f'text="{ec_code}"').first
        await result_link.click(timeout=5000)
        await page.wait_for_timeout(3000)  # Wait for detail page to load

        return True
    except Exception as e:
        print(f"  Navigation error: {e}")
        return False


async def expand_sections(page):
    """Expand all collapsible sections on the detail page."""
    try:
        # Find all expand arrows/buttons and click them
        expand_buttons = page.locator(
            'img[src*="down"], img[src*="arrow"], a[href="#collapse"]'
        )
        count = await expand_buttons.count()

        for i in range(count):
            try:
                button = expand_buttons.nth(i)
                if await button.is_visible():
                    await button.click()
                    await page.wait_for_timeout(500)
            except:
                pass
    except:
        pass


async def process_ec(page, ec_code: str, retry: int = 0) -> dict | None:
    """Process a single EC code and extract its data."""
    try:
        print(f"  Processing {ec_code}...")

        # Navigate to EC detail
        if not await navigate_to_ec(page, ec_code):
            if retry < MAX_RETRIES:
                print(f"  Retrying {ec_code} ({retry + 1}/{MAX_RETRIES})...")
                await page.wait_for_timeout(2000)
                return await process_ec(page, ec_code, retry + 1)
            return None

        # Expand all sections
        await expand_sections(page)
        await page.wait_for_timeout(1000)

        # Extract data
        data = await extract_ec_data(page)

        if data.get("error"):
            print(f"  Extraction error: {data['error']}")
            if retry < MAX_RETRIES:
                return await process_ec(page, ec_code, retry + 1)
            return None

        # Add metadata
        data["ec_code"] = ec_code
        data["extraction_time"] = datetime.now().isoformat()

        print(
            f"  ✓ {ec_code}: {len(data.get('certifiers', []))} certifiers, {len(data.get('courses', []))} courses"
        )
        return data

    except Exception as e:
        print(f"  Error processing {ec_code}: {e}")
        if retry < MAX_RETRIES:
            return await process_ec(page, ec_code, retry + 1)
        return None


async def main():
    """Main extraction loop."""
    print("=" * 60)
    print("EC Details Extractor - Playwright Edition")
    print("=" * 60)

    # Load EC codes
    ec_codes = load_ec_codes()
    print(f"Loaded {len(ec_codes)} EC codes to process")

    # Load checkpoint
    checkpoint = load_checkpoint()
    processed = set(checkpoint["processed"])

    # Filter out already processed
    remaining = [code for code in ec_codes if code not in processed]
    print(f"Already processed: {len(processed)}, Remaining: {len(remaining)}")

    if not remaining:
        print("All ECs already processed!")
        save_final_output(checkpoint)
        return

    # Start extraction
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )
        page = await context.new_page()

        batch_count = 0
        start_time = time.time()

        for i, ec_code in enumerate(remaining):
            print(f"\n[{i + 1}/{len(remaining)}] Processing {ec_code}")

            data = await process_ec(page, ec_code)

            if data:
                checkpoint["data"][ec_code] = data
                checkpoint["processed"].append(ec_code)
            else:
                checkpoint["failed"].append(ec_code)

            batch_count += 1

            # Save checkpoint every batch
            if batch_count >= BATCH_SIZE:
                save_checkpoint(checkpoint)
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed * 60  # ECs per minute
                remaining_time = (len(remaining) - i - 1) / rate if rate > 0 else 0
                print(f"\n💾 Checkpoint saved. Progress: {i + 1}/{len(remaining)}")
                print(f"\n💾 Checkpoint saved. Progress: {i+1}/{len(remaining)}")
                print(f"   Rate: {rate:.1f} ECs/min, ETA: {remaining_time:.0f} min")
                batch_count = 0

            # Small delay between requests
            await page.wait_for_timeout(1000)

        await browser.close()

    # Final save
    save_checkpoint(checkpoint)
    save_final_output(checkpoint)

    print("\n" + "=" * 60)
    print("Extraction Complete!")
    print(f"  Total processed: {len(checkpoint['processed'])}")
    print(f"  Failed: {len(checkpoint['failed'])}")
    print(f"  Output: {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
