#!/usr/bin/env python3
"""
CONOCER/RENEC Extraction Report Generator

Generates a comprehensive markdown report of all extracted data.
"""

import json
from datetime import datetime
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "extracted"


def load_json(filename: str) -> dict | list | None:
    """Load JSON file if exists."""
    filepath = OUTPUT_DIR / filename
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def format_number(n: int) -> str:
    """Format number with commas."""
    return f"{n:,}"


def generate_report() -> str:
    """Generate comprehensive extraction report."""
    # Load all data sources
    ec_standards = load_json("ec_standards_api.json") or []
    committees = load_json("committees_complete.json") or []
    ec_certifiers = load_json("ec_certifiers_all.json")
    checkpoint = load_json("certifiers_checkpoint.json")
    ece_registry = load_json("master_ece_registry.json")
    ccap_registry = load_json("master_ccap_registry.json")
    registry_stats = load_json("registry_stats.json")
    ec_ece_matrix = load_json("ec_ece_matrix.json")

    # Use checkpoint if final file not available
    if not ec_certifiers and checkpoint:
        ec_details = checkpoint.get("data", {})
        failed_ecs = checkpoint.get("failed", [])
        processed_count = len(checkpoint.get("processed", []))
    elif ec_certifiers:
        ec_details = ec_certifiers.get("ec_details", {})
        failed_ecs = ec_certifiers.get("failed_ecs", [])
        processed_count = len(ec_details)
    else:
        ec_details = {}
        failed_ecs = []
        processed_count = 0

    # Calculate stats
    total_cert_relationships = sum(
        len(d.get("certifiers", [])) for d in ec_details.values()
    )
    total_course_relationships = sum(
        len(d.get("courses", [])) for d in ec_details.values()
    )
    ecs_with_certifiers = sum(1 for d in ec_details.values() if d.get("certifiers"))

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    report = f"""# CONOCER/RENEC Data Extraction Report

**Generated**: {now}
**Status**: {"✅ Complete" if processed_count >= len(ec_standards) else f"🔄 In Progress ({processed_count}/{len(ec_standards)})"}

---

## Executive Summary

This report summarizes the comprehensive data extraction from the Mexican CONOCER (Consejo Nacional de Normalización y Certificación de Competencias Laborales) RENEC system.

### Key Metrics

| Metric | Value |
|--------|-------|
| EC Standards Catalogued | {format_number(len(ec_standards))} |
| Committees Extracted | {format_number(len(committees))} |
| ECs Processed for Details | {format_number(processed_count)} |
| Unique Certifiers (ECEs) | {format_number(ece_registry["total_count"] if ece_registry else 0)} |
| Unique Courses/CCAPs | {format_number(ccap_registry["total_count"] if ccap_registry else 0)} |
| Certifier-EC Relationships | {format_number(total_cert_relationships)} |
| Course-EC Relationships | {format_number(total_course_relationships)} |

---

## 1. EC Standards (Estándares de Competencia)

**Total**: {format_number(len(ec_standards))} standards extracted from API

EC Standards define the competencies that can be certified. Each standard specifies:
- Required knowledge and skills
- Performance criteria
- Evaluation methods

### Sample Standards
"""

    # Add sample standards
    if ec_standards:
        report += "\n| Code | Title |\n|------|-------|\n"
        for std in ec_standards[:10]:
            code = std.get("codigo") or std.get("clave", "N/A")
            title = std.get("titulo") or std.get("nombre", "N/A")
            if len(title) > 60:
                title = title[:57] + "..."
            report += f"| {code} | {title} |\n"
        if len(ec_standards) > 10:
            report += (
                f"\n*...and {format_number(len(ec_standards) - 10)} more standards*\n"
            )

    report += f"""

---

## 2. Committees (Comités de Gestión por Competencias)

**Total**: {format_number(len(committees))} committees extracted

Committees are industry groups that develop and maintain EC standards for their sector.

### Committee Statistics
"""

    if committees:
        # Count ECs per committee
        ec_counts = [
            len(c.get("ec_codes", []))
            for c in committees
            if isinstance(c.get("ec_codes"), list)
        ]
        if ec_counts:
            report += f"""
| Metric | Value |
|--------|-------|
| Total Committees | {format_number(len(committees))} |
| Avg ECs per Committee | {sum(ec_counts) / len(ec_counts):.1f} |
| Max ECs per Committee | {max(ec_counts)} |
| Committees with 10+ ECs | {sum(1 for c in ec_counts if c >= 10)} |
"""

    report += f"""

---

## 3. ECE Registry (Entidades Certificadoras y Evaluadoras)

**Unique Certifiers**: {format_number(ece_registry["total_count"] if ece_registry else 0)}

ECEs are authorized organizations that can evaluate and certify individuals against EC standards.

"""

    if registry_stats:
        ece_stats = registry_stats.get("ece_registry_stats", {})
        report += f"""### ECE Statistics

| Metric | Value |
|--------|-------|
| Unique ECEs | {format_number(ece_stats.get("unique_certifiers", 0))} |
| Avg ECs per ECE | {ece_stats.get("avg_ecs_per_certifier", 0)} |
| Max ECs per ECE | {ece_stats.get("max_ecs_per_certifier", 0)} |
| ECEs with 1 EC only | {format_number(ece_stats.get("certifiers_with_1_ec", 0))} |
| ECEs with 5+ ECs | {format_number(ece_stats.get("certifiers_with_5plus_ecs", 0))} |
| ECEs with 10+ ECs | {format_number(ece_stats.get("certifiers_with_10plus_ecs", 0))} |

### Top Certifiers by EC Coverage
"""
        top_certs = registry_stats.get("top_20_certifiers", [])[:15]
        if top_certs:
            report += "\n| Rank | Certifier | ECs |\n|------|-----------|-----|\n"
            for i, cert in enumerate(top_certs, 1):
                name = (
                    cert["name"][:55] + "..."
                    if len(cert["name"]) > 55
                    else cert["name"]
                )
                report += f"| {i} | {name} | {cert['ec_count']} |\n"

    report += f"""

---

## 4. CCAP/Course Registry

**Unique Entries**: {format_number(ccap_registry["total_count"] if ccap_registry else 0)}

Training centers and courses associated with EC standards.

---

## 5. Data Quality

### Extraction Status

| Status | Count |
|--------|-------|
| Successfully Processed | {format_number(processed_count)} |
| Failed/Skipped | {format_number(len(failed_ecs))} |
| ECs with Certifiers | {format_number(ecs_with_certifiers)} |
| ECs without Certifiers | {format_number(processed_count - ecs_with_certifiers)} |

"""

    if failed_ecs:
        report += f"""### Failed ECs (first 20)

The following EC codes could not be processed:

```
{", ".join(failed_ecs[:20])}
```
"""
        if len(failed_ecs) > 20:
            report += f"\n*...and {len(failed_ecs) - 20} more*\n"

    report += f"""

---

## 6. Output Files

All extracted data is stored in `data/extracted/`:

| File | Description | Records |
|------|-------------|---------|
| `ec_standards_api.json` | All EC standards from API | {format_number(len(ec_standards))} |
| `committees_complete.json` | All committees with EC mappings | {format_number(len(committees))} |
| `ec_certifiers_all.json` | EC detail extraction results | {format_number(processed_count)} |
| `master_ece_registry.json` | Deduplicated ECE registry | {format_number(ece_registry["total_count"] if ece_registry else 0)} |
| `master_ccap_registry.json` | Deduplicated CCAP registry | {format_number(ccap_registry["total_count"] if ccap_registry else 0)} |
| `ec_ece_matrix.json` | EC-to-ECE relationship matrix | {format_number(len(ec_ece_matrix.get("matrix", {})) if ec_ece_matrix else 0)} |
| `registry_stats.json` | Computed statistics | - |

---

## 7. Usage Notes

### Finding Certifiers for an EC

```python
import json

# Load the matrix
with open('ec_ece_matrix.json') as f:
    matrix = json.load(f)['matrix']

# Look up certifiers for EC0217.01
ec_info = matrix.get('EC0217.01')
print(f"ECE IDs: {{ec_info['ece_ids']}}")
print(f"Count: {{ec_info['ece_count']}}")
```

### Finding ECs for a Certifier

```python
import json

# Load ECE registry
with open('master_ece_registry.json') as f:
    registry = json.load(f)['registry']

# Find certifier by name (partial match)
for ece in registry:
    if 'CONALEP' in ece['canonical_name'].upper():
        print(f"{{ece['canonical_name']}}: {{ece['ec_count']}} ECs")
        print(f"EC codes: {{ece['ec_codes'][:10]}}...")
```

---

*Report generated by RENEC Harvester - Avala Project*
"""

    return report


def main():
    print("Generating extraction report...")

    report = generate_report()

    # Save report
    report_file = OUTPUT_DIR / "CONOCER_EXTRACTION_REPORT.md"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"✅ Report saved: {report_file}")

    # Also print summary to console
    print("\n" + "=" * 60)
    print("Report generated successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
