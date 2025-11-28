#!/usr/bin/env python3
"""
Check extraction status and optionally run final build.

Usage:
  python check_extraction_status.py         # Check status
  python check_extraction_status.py --build # Check and build if complete
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "extracted"
SCRIPTS_DIR = Path(__file__).parent


def load_checkpoint() -> dict:
    """Load checkpoint file."""
    checkpoint_file = OUTPUT_DIR / "certifiers_checkpoint.json"
    if checkpoint_file.exists():
        with open(checkpoint_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_ec_count() -> int:
    """Load total EC count."""
    ec_file = OUTPUT_DIR / "ec_standards_api.json"
    if ec_file.exists():
        with open(ec_file, "r", encoding="utf-8") as f:
            return len(json.load(f))
    return 0


def check_process_running() -> bool:
    """Check if extraction is still running."""
    try:
        result = subprocess.run(
            ["pgrep", "-f", "extract_certifiers_batch"], capture_output=True, text=True
        )
        return result.returncode == 0
    except Exception:
        return False


def run_build():
    """Run registry builder and report generator."""
    print("\n🔨 Running registry builder...")
    subprocess.run([sys.executable, SCRIPTS_DIR / "build_master_registries.py"])

    print("\n📊 Generating report...")
    subprocess.run([sys.executable, SCRIPTS_DIR / "generate_extraction_report.py"])


def main():
    build_if_complete = "--build" in sys.argv

    print("=" * 60)
    print("CONOCER/RENEC Extraction Status")
    print("=" * 60)

    total_ecs = load_ec_count()
    checkpoint = load_checkpoint()

    processed = len(checkpoint.get("processed", []))
    failed = len(checkpoint.get("failed", []))
    last_updated = checkpoint.get("last_updated", "Unknown")

    # Calculate certifier stats from data
    data = checkpoint.get("data", {})
    total_certs = sum(len(d.get("certifiers", [])) for d in data.values())
    ecs_with_certs = sum(1 for d in data.values() if d.get("certifiers"))

    running = check_process_running()

    progress_pct = (processed / total_ecs * 100) if total_ecs > 0 else 0

    print(f"\n📈 Progress: {processed:,}/{total_ecs:,} ({progress_pct:.1f}%)")
    print(f"❌ Failed: {failed:,}")
    print(f"⏱️  Last Update: {last_updated}")
    print(f"🔄 Process Running: {'Yes' if running else 'No'}")

    print(f"\n📊 Current Stats:")
    print(f"   ECs with certifiers: {ecs_with_certs:,}")
    print(f"   Total certifier relationships: {total_certs:,}")

    # Estimate completion
    if running and processed > 0:
        # Parse last_updated to estimate rate
        try:
            from datetime import datetime

            last_dt = datetime.fromisoformat(last_updated)
            # Rough estimate assuming 4-5 ECs/min
            remaining = total_ecs - processed
            eta_minutes = remaining / 4.5
            print(
                f"\n⏳ Estimated time remaining: {eta_minutes:.0f} minutes (~{eta_minutes / 60:.1f} hours)"
            )
        except Exception:
            pass

    is_complete = processed >= total_ecs or (not running and processed > 0)

    if is_complete:
        print("\n✅ EXTRACTION COMPLETE!")

        if build_if_complete:
            run_build()
        else:
            print("\nRun with --build to generate final registries and report")
    elif not running and processed == 0:
        print("\n⚠️  Extraction not started or checkpoint empty")
    else:
        print("\n🔄 Extraction in progress...")
        print("   Run this script again to check status")

    print()


if __name__ == "__main__":
    main()
