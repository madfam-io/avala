# CONOCER/RENEC Data Extraction Summary

**Extraction Date**: 2025-11-28 03:26:18

## Overview

| Dataset | Count |
|---------|-------|
| Committees | 581 |
| EC Standards (API) | 1,477 |
| EC Codes (from committees) | 2,973 |

## Committee Data Quality

| Metric | Count | Percentage |
|--------|-------|------------|
| With President | 435 | 74.9% |
| With Email | 419 | 72.1% |
| With Phone | 416 | 71.6% |
| With EC Standards | 435 | 74.9% |
| Total EC Associations | 3,005 | - |

## Committees by Sector (Top 15)

| Sector | Count |
|--------|-------|
| Sin sector | 144 |
| Servicios Profesionales y Técnicos | 112 |
| Educación y Formación de Personas | 65 |
| Administración Pública | 44 |
| Social | 33 |
| Seguridad Pública | 22 |
| Construcción | 19 |
| Transporte | 15 |
| Turismo | 14 |
| Tecnologías de la Información | 12 |
| Financiero | 10 |
| Deportivo | 10 |
| Petróleo y Gas | 10 |
| Comercio | 9 |
| Logística | 8 |

## Committees by State (Top 15)

| State | Count |
|-------|-------|
| CIUDAD DE MÉXICO | 290 |
| Sin estado | 145 |
| MÉXICO | 31 |
| Nuevo León | 21 |
| PUEBLA | 13 |
| HIDALGO | 10 |
| JALISCO | 9 |
| CHIAPAS | 5 |
| AGUASCALIENTES | 5 |
| CHIHUAHUA | 5 |
| MORELOS | 4 |
| QUINTANA ROO | 4 |
| SONORA | 4 |
| GUANAJUATO | 4 |
| QUERETARO | 3 |

## EC Standards by Sector (Top 15)

| Sector | Count |
|--------|-------|
| Sin sector | 1477 |

## Files Generated

| File | Description |
|------|-------------|
| `committees_complete.json` | Full committee data with contacts and EC associations |
| `ec_standards_api.json` | All EC standards from CONOCER API |
| `ec_codes_from_committees.json` | EC codes referenced by committees |
| `extraction_stats.json` | Statistical summary |
| `EXTRACTION_REPORT.md` | This report |

## Data Sources

- **Committees API**: `https://conocer.gob.mx/CONOCERBACKCITAS/comites/{id}` (IDs 1-800)
- **EC Standards API**: `https://conocer.gob.mx/CONOCERBACKCITAS/sectoresProductivos/getEstandaresAll`

## Notes

1. Committee IDs are sparse (not all IDs have data)
2. EC codes from committees include older qualification formats (CADM, CAEL, etc.)
3. Certifier/training center data requires browser scraping (no direct API)
