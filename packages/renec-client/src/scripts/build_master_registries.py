#!/usr/bin/env python3
"""
Master Registry Builder for CONOCER/RENEC Data

Builds deduplicated master registries for:
- ECEs (Entidades Certificadoras y Evaluadoras) - Certifiers
- CCAPs (Centros de Capacitación) - Training Centers (from courses)
- EC-ECE relationships (which certifiers can certify which standards)

Input: ec_certifiers_all.json (from batch extraction)
Output:
  - master_ece_registry.json (unique certifiers with EC relationships)
  - master_ccap_registry.json (unique training centers with course relationships)
  - ec_ece_matrix.json (EC to ECE mapping for quick lookups)
"""

import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "extracted"


def normalize_name(name: str) -> str:
    """Normalize entity names for deduplication."""
    if not name:
        return ""
    # Lowercase, strip whitespace
    n = name.lower().strip()
    # Remove common suffixes/variations
    n = re.sub(
        r"\s*(s\.?a\.?\s*de\s*c\.?v\.?|s\.?c\.?|a\.?c\.?)\s*$", "", n, flags=re.I
    )
    # Remove extra whitespace
    n = re.sub(r"\s+", " ", n)
    # Remove punctuation except essential
    n = re.sub(r"[.,;:]+", "", n)
    return n.strip()


def extract_entity_info(name: str) -> dict:
    """Extract additional info from entity name if available."""
    info = {"original_name": name, "normalized": normalize_name(name)}

    # Try to detect legal entity type
    if re.search(r"s\.?a\.?\s*de\s*c\.?v\.?", name, re.I):
        info["entity_type"] = "SA de CV"
    elif re.search(r"s\.?c\.?", name, re.I):
        info["entity_type"] = "SC"
    elif re.search(r"a\.?c\.?", name, re.I):
        info["entity_type"] = "AC"
    else:
        info["entity_type"] = "Unknown"

    return info


def build_ece_registry(ec_data: dict) -> dict:
    """Build master ECE registry from extracted data."""
    # Map normalized name -> ECE record
    ece_map = defaultdict(
        lambda: {
            "names": set(),
            "ec_codes": set(),
            "first_seen": None,
            "entity_type": None,
        }
    )

    for ec_code, data in ec_data.items():
        certifiers = data.get("certifiers", [])
        for cert_name in certifiers:
            if not cert_name or len(cert_name) < 3:
                continue

            norm = normalize_name(cert_name)
            if not norm:
                continue

            ece = ece_map[norm]
            ece["names"].add(cert_name)
            ece["ec_codes"].add(ec_code)

            info = extract_entity_info(cert_name)
            if not ece["entity_type"] or ece["entity_type"] == "Unknown":
                ece["entity_type"] = info["entity_type"]

    # Convert to list format
    registry = []
    for norm_name, ece in ece_map.items():
        # Pick canonical name (longest or most complete)
        canonical = max(ece["names"], key=len)

        registry.append(
            {
                "id": f"ECE-{len(registry) + 1:05d}",
                "canonical_name": canonical,
                "alternate_names": sorted(ece["names"] - {canonical}),
                "normalized_key": norm_name,
                "entity_type": ece["entity_type"],
                "ec_codes": sorted(ece["ec_codes"]),
                "ec_count": len(ece["ec_codes"]),
            }
        )

    # Sort by EC count descending
    registry.sort(key=lambda x: (-x["ec_count"], x["canonical_name"]))

    # Reassign IDs after sorting
    for i, ece in enumerate(registry):
        ece["id"] = f"ECE-{i + 1:05d}"

    return registry


def build_ccap_registry(ec_data: dict) -> dict:
    """Build master CCAP registry from course data."""
    # Courses might contain training center info
    ccap_map = defaultdict(
        lambda: {"names": set(), "ec_codes": set(), "courses": set()}
    )

    for ec_code, data in ec_data.items():
        courses = data.get("courses", [])
        for course in courses:
            if not course or len(course) < 5:
                continue

            # Courses are typically "Course Name - Provider" or just names
            # For now, track unique courses per EC
            norm = normalize_name(course)
            if not norm:
                continue

            ccap = ccap_map[norm]
            ccap["names"].add(course)
            ccap["ec_codes"].add(ec_code)
            ccap["courses"].add(course)

    registry = []
    for norm_name, ccap in ccap_map.items():
        canonical = max(ccap["names"], key=len)

        registry.append(
            {
                "id": f"CCAP-{len(registry) + 1:05d}",
                "canonical_name": canonical,
                "alternate_names": sorted(ccap["names"] - {canonical}),
                "normalized_key": norm_name,
                "ec_codes": sorted(ccap["ec_codes"]),
                "ec_count": len(ccap["ec_codes"]),
            }
        )

    registry.sort(key=lambda x: (-x["ec_count"], x["canonical_name"]))

    for i, ccap in enumerate(registry):
        ccap["id"] = f"CCAP-{i + 1:05d}"

    return registry


def build_ec_ece_matrix(ec_data: dict, ece_registry: list) -> dict:
    """Build EC to ECE lookup matrix."""
    # Create normalized name to ECE ID mapping
    norm_to_id = {}
    for ece in ece_registry:
        norm_to_id[ece["normalized_key"]] = ece["id"]

    matrix = {}
    for ec_code, data in ec_data.items():
        certifiers = data.get("certifiers", [])
        ece_ids = []
        for cert in certifiers:
            norm = normalize_name(cert)
            if norm in norm_to_id:
                ece_ids.append(norm_to_id[norm])

        matrix[ec_code] = {
            "ece_ids": sorted(set(ece_ids)),
            "ece_count": len(set(ece_ids)),
            "title": data.get("title", ""),
        }

    return matrix


def generate_stats(
    ec_data: dict, ece_registry: list, ccap_registry: list, matrix: dict
) -> dict:
    """Generate comprehensive statistics."""
    total_relationships = sum(len(d.get("certifiers", [])) for d in ec_data.values())
    ecs_with_certifiers = sum(1 for d in ec_data.values() if d.get("certifiers"))

    # ECE stats
    ece_ec_counts = [e["ec_count"] for e in ece_registry]

    # Top certifiers
    top_eces = ece_registry[:20]

    return {
        "extraction_summary": {
            "total_ecs_processed": len(ec_data),
            "ecs_with_certifiers": ecs_with_certifiers,
            "ecs_without_certifiers": len(ec_data) - ecs_with_certifiers,
            "total_certifier_relationships": total_relationships,
        },
        "ece_registry_stats": {
            "unique_certifiers": len(ece_registry),
            "avg_ecs_per_certifier": round(sum(ece_ec_counts) / len(ece_ec_counts), 2)
            if ece_ec_counts
            else 0,
            "max_ecs_per_certifier": max(ece_ec_counts) if ece_ec_counts else 0,
            "certifiers_with_1_ec": sum(1 for c in ece_ec_counts if c == 1),
            "certifiers_with_5plus_ecs": sum(1 for c in ece_ec_counts if c >= 5),
            "certifiers_with_10plus_ecs": sum(1 for c in ece_ec_counts if c >= 10),
        },
        "ccap_registry_stats": {"unique_courses_or_centers": len(ccap_registry)},
        "top_20_certifiers": [
            {"name": e["canonical_name"], "ec_count": e["ec_count"]} for e in top_eces
        ],
    }


def main():
    print("=" * 60)
    print("CONOCER Master Registry Builder")
    print("=" * 60)

    # Load extracted data
    input_file = OUTPUT_DIR / "ec_certifiers_all.json"
    if not input_file.exists():
        # Try checkpoint file
        checkpoint_file = OUTPUT_DIR / "certifiers_checkpoint.json"
        if checkpoint_file.exists():
            print(f"Using checkpoint file: {checkpoint_file}")
            with open(checkpoint_file, "r", encoding="utf-8") as f:
                checkpoint = json.load(f)
                ec_data = checkpoint.get("data", {})
        else:
            print("ERROR: No extraction data found!")
            print(f"Expected: {input_file}")
            return
    else:
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            ec_data = data.get("ec_details", {})

    print(f"Loaded {len(ec_data)} EC records")

    # Build ECE registry
    print("\nBuilding ECE (Certifier) registry...")
    ece_registry = build_ece_registry(ec_data)
    print(f"  → {len(ece_registry)} unique certifiers identified")

    # Build CCAP registry
    print("\nBuilding CCAP (Training Center/Course) registry...")
    ccap_registry = build_ccap_registry(ec_data)
    print(f"  → {len(ccap_registry)} unique courses/centers identified")

    # Build EC-ECE matrix
    print("\nBuilding EC-ECE relationship matrix...")
    matrix = build_ec_ece_matrix(ec_data, ece_registry)

    # Generate stats
    print("\nGenerating statistics...")
    stats = generate_stats(ec_data, ece_registry, ccap_registry, matrix)

    # Save outputs
    timestamp = datetime.now().isoformat()

    # ECE Registry
    ece_output = {
        "generated_at": timestamp,
        "description": "Master registry of ECEs (Entidades Certificadoras y Evaluadoras)",
        "total_count": len(ece_registry),
        "registry": ece_registry,
    }
    ece_file = OUTPUT_DIR / "master_ece_registry.json"
    with open(ece_file, "w", encoding="utf-8") as f:
        json.dump(ece_output, f, indent=2, ensure_ascii=False)
    print(f"\n✅ ECE Registry saved: {ece_file}")

    # CCAP Registry
    ccap_output = {
        "generated_at": timestamp,
        "description": "Master registry of CCAPs and training courses",
        "total_count": len(ccap_registry),
        "registry": ccap_registry,
    }
    ccap_file = OUTPUT_DIR / "master_ccap_registry.json"
    with open(ccap_file, "w", encoding="utf-8") as f:
        json.dump(ccap_output, f, indent=2, ensure_ascii=False)
    print(f"✅ CCAP Registry saved: {ccap_file}")

    # EC-ECE Matrix
    matrix_output = {
        "generated_at": timestamp,
        "description": "EC to ECE relationship matrix for quick lookups",
        "total_ecs": len(matrix),
        "matrix": matrix,
    }
    matrix_file = OUTPUT_DIR / "ec_ece_matrix.json"
    with open(matrix_file, "w", encoding="utf-8") as f:
        json.dump(matrix_output, f, indent=2, ensure_ascii=False)
    print(f"✅ EC-ECE Matrix saved: {matrix_file}")

    # Stats
    stats_output = {"generated_at": timestamp, **stats}
    stats_file = OUTPUT_DIR / "registry_stats.json"
    with open(stats_file, "w", encoding="utf-8") as f:
        json.dump(stats_output, f, indent=2, ensure_ascii=False)
    print(f"✅ Statistics saved: {stats_file}")

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"ECs processed: {stats['extraction_summary']['total_ecs_processed']}")
    print(f"ECs with certifiers: {stats['extraction_summary']['ecs_with_certifiers']}")
    print(
        f"Total certifier relationships: {stats['extraction_summary']['total_certifier_relationships']}"
    )
    print(
        f"Unique ECEs (certifiers): {stats['ece_registry_stats']['unique_certifiers']}"
    )
    print(
        f"Unique CCAPs/courses: {stats['ccap_registry_stats']['unique_courses_or_centers']}"
    )
    print(f"\nTop 5 certifiers by EC coverage:")
    for i, top in enumerate(stats["top_20_certifiers"][:5], 1):
        print(f"  {i}. {top['name'][:50]}... ({top['ec_count']} ECs)")


if __name__ == "__main__":
    main()
