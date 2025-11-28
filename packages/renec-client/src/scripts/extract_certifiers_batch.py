#!/usr/bin/env python3
"""
Batch EC Certifier Extractor
Extracts certifiers for all EC standards using Playwright.
Uses fresh page per EC for reliability.
"""

import asyncio
import json
import time
from datetime import datetime
from pathlib import Path

from playwright.async_api import async_playwright

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "extracted"
CHECKPOINT_FILE = OUTPUT_DIR / "certifiers_checkpoint.json"
OUTPUT_FILE = OUTPUT_DIR / "ec_certifiers_all.json"
BATCH_SAVE_SIZE = 20

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EXTRACT_SCRIPT = """
() => {
    const result = {
        title: '',
        certifiers: [],
        courses: [],
        occupations: [],
        committee_members: []
    };

    const titleEl = document.querySelector('p');
    if (titleEl) result.title = titleEl.textContent.trim();

    document.querySelectorAll('[role="grid"]').forEach(table => {
        const header = table.querySelector('[role="columnheader"]');
        const headerText = (header?.textContent?.trim() || '').toLowerCase();
        const items = [];
        table.querySelectorAll('[role="row"]').forEach(row => {
            const cell = row.querySelector('[role="gridcell"]');
            if (cell) {
                const text = cell.textContent?.trim();
                if (text) items.push(text);
            }
        });
        if (headerText.includes('certificador')) result.certifiers = items;
        else if (headerText.includes('cursos')) result.courses = items;
        else if (headerText.includes('ocupacion')) result.occupations = items;
        else if (headerText.includes('integrantes')) result.committee_members = items;
    });
    return result;
}
"""


def load_ec_codes() -> list[str]:
    """Load EC codes from extracted standards."""
    ec_file = OUTPUT_DIR / "ec_standards_api.json"
    with open(ec_file, "r", encoding="utf-8") as f:
        standards = json.load(f)
    return sorted(
        set(
            s.get("codigo") or s.get("clave")
            for s in standards
            if s.get("codigo") or s.get("clave")
        )
    )


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


def save_final(checkpoint: dict):
    """Save final output."""
    total_certs = sum(len(v.get("certifiers", [])) for v in checkpoint["data"].values())
    total_courses = sum(len(v.get("courses", [])) for v in checkpoint["data"].values())

    # Build unique certifier list
    all_certifiers = set()
    for ec_data in checkpoint["data"].values():
        all_certifiers.update(ec_data.get("certifiers", []))

    output = {
        "extraction_date": datetime.now().isoformat(),
        "summary": {
            "ecs_processed": len(checkpoint["data"]),
            "ecs_failed": len(checkpoint["failed"]),
            "total_certifier_relationships": total_certs,
            "total_course_relationships": total_courses,
            "unique_certifiers": len(all_certifiers),
        },
        "failed_ecs": checkpoint["failed"],
        "ec_details": checkpoint["data"],
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Also save unique certifiers list
    certifiers_file = OUTPUT_DIR / "unique_certifiers.json"
    with open(certifiers_file, "w", encoding="utf-8") as f:
        json.dump(sorted(all_certifiers), f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved to {OUTPUT_FILE}")
    print(f"   ECs processed: {len(checkpoint['data'])}")
    print(f"   Certifier relationships: {total_certs}")
    print(f"   Unique certifiers: {len(all_certifiers)}")


async def process_ec(browser, ec_code: str, retry: int = 0) -> dict | None:
    """Process a single EC with fresh page."""
    page = await browser.new_page()
    try:
        await page.goto(
            "https://conocer.gob.mx/conocer/#/renec",
            wait_until="networkidle",
            timeout=60000,
        )
        await page.wait_for_timeout(3000)

        await page.wait_for_selector("input", timeout=30000)
        search = page.locator("input").first
        await search.fill(ec_code)
        await page.wait_for_timeout(1000)
        await search.press("Enter")
        await page.wait_for_timeout(3000)

        result = page.get_by_text(ec_code, exact=False).first
        await result.click(timeout=10000)
        await page.wait_for_timeout(3000)

        data = await page.evaluate(EXTRACT_SCRIPT)
        data["ec_code"] = ec_code
        data["extraction_time"] = datetime.now().isoformat()

        return data

    except Exception as e:
        if retry < 2:
            await page.close()
            await asyncio.sleep(2)
            return await process_ec(browser, ec_code, retry + 1)
        return None
    finally:
        await page.close()


async def main():
    import sys

    print("=" * 60, flush=True)
    print("EC Certifiers Batch Extractor", flush=True)
    print("=" * 60, flush=True)

    ec_codes = load_ec_codes()
    print(f"Total ECs: {len(ec_codes)}", flush=True)

    checkpoint = load_checkpoint()
    processed = set(checkpoint["processed"])
    remaining = [c for c in ec_codes if c not in processed]

    print(f"Done: {len(processed)}, Remaining: {len(remaining)}", flush=True)

    if not remaining:
        print("All done!")
        save_final(checkpoint)
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        start = time.time()

        for i, ec_code in enumerate(remaining):
            data = await process_ec(browser, ec_code)

            if data and (data.get("certifiers") or data.get("title")):
                checkpoint["data"][ec_code] = data
                checkpoint["processed"].append(ec_code)
                certs = len(data.get("certifiers", []))
                print(
                    f"[{i + 1}/{len(remaining)}] {ec_code}: {certs} certifiers ✓",
                    flush=True,
                )
            else:
                checkpoint["failed"].append(ec_code)
                print(f"[{i + 1}/{len(remaining)}] {ec_code}: FAILED", flush=True)

            if (i + 1) % BATCH_SAVE_SIZE == 0:
                save_checkpoint(checkpoint)
                elapsed = time.time() - start
                rate = (i + 1) / elapsed * 60
                eta = (len(remaining) - i - 1) / rate if rate > 0 else 0
                print(
                    f"💾 Checkpoint | {rate:.1f}/min | ETA: {eta:.0f} min", flush=True
                )

        await browser.close()

    save_checkpoint(checkpoint)
    save_final(checkpoint)
    print(
        f"\nDone! {len(checkpoint['processed'])} success, {len(checkpoint['failed'])} failed"
    )
    print(
        f"\nDone! {len(checkpoint['processed'])} success, {len(checkpoint['failed'])} failed"
    )


if __name__ == "__main__":
    asyncio.run(main())
