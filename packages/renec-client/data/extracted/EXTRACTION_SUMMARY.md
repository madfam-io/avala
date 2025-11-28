# RENEC/CONOCER Data Extraction Summary

**Extraction Date:** 2025-11-28
**Source:** https://conocer.gob.mx/conocer/#/renec

## Data Extracted

### 1. EC Standards (Estándares de Competencia)
- **Total Records:** 1,477
- **File:** `ec_standards_api.json` (520KB)
- **Excel Export:** `renec.xlsx` (539KB)
- **Fields per record:**
  - `idEstandarCompetencia` - Internal database ID
  - `idSectorProductivo` - Sector ID reference
  - `codigo` - EC code (e.g., EC0001, EC0217.01)
  - `nivel` - Competency level (1-5)
  - `titulo` - Full title/description
  - `comite` - Committee that developed it
  - `secProductivo` - Productive sector name

### 2. Committees (Comités de Gestión por Competencias)
- **Total Unique:** 314
- **File:** `committees.json` (60KB)
- **Fields per record:**
  - `nombre` - Committee name
  - `ecCount` - Number of ECs developed
  - `ecCodigos` - Array of EC codes

### 3. Productive Sectors
- **Total Categories:** 22
- **File:** `sectors.json` (2.2KB)
- **Categories include:**
  - SERVICIOS EDUCATIVOS
  - SERVICIOS DE SALUD Y DE ASISTENCIA SOCIAL
  - INDUSTRIAS MANUFACTURERAS
  - TRANSPORTES, CORREOS Y ALMACENAMIENTO
  - SERVICIOS PROFESIONALES, CIENTÍFICOS Y TÉCNICOS
  - And 17 more...

### 4. Certifying Entities (Sample)
- **Sample EC:** EC0217.01 (Impartición de cursos)
- **Certifiers for EC0217.01:** 371 entities
- **File:** `certifiers_ec0217.json`
- **Types identified:**
  - ECE (Entidades de Certificación y Evaluación) - Educational/Government
  - OC (Organismos Certificadores) - Private Companies

## API Endpoints Discovered

### Working Endpoints
```
GET https://conocer.gob.mx/CONOCERBACKCITAS/sectoresProductivos/getEstandaresAll
- Returns: All 1,477 EC standards in JSON format
- No authentication required
- Headers: Accept: application/json
```

### Non-Working Endpoints (404/400)
- `/sectoresProductivos/getSectoresProductivos` - 404
- `/certificadores/getAll` - 404
- `/centrosCapacitacion/getAll` - 404
- `/comites/getAll` - 400

## Data Sources

1. **API Extraction** - Primary source for EC standards
2. **Excel Export** - "Exportar a Excel" button on RENEC page
3. **Page Scraping** - For sectors and detailed certifier lists

## Data Quality Notes

- All 1,477 ECs successfully extracted with complete metadata
- Committee-to-EC relationships preserved
- Certifier extraction requires individual EC page visits
- Training centers appear as course titles, not organization names

## Usage

```typescript
// Load EC standards
import ecStandards from './ec_standards_api.json';

// Load committees with EC counts
import committees from './committees.json';

// Load sectors
import sectors from './sectors.json';
```

## Files Manifest

| File | Size | Records | Description |
|------|------|---------|-------------|
| ec_standards_api.json | 520KB | 1,477 | All EC standards from API |
| committees.json | 60KB | 314 | Unique committees with EC lists |
| sectors.json | 2.2KB | 22 | Productive sector categories |
| certifiers_ec0217.json | 2.1KB | 371 | Sample certifiers for EC0217.01 |
| renec.xlsx | 539KB | 1,477 | Official Excel export |

## Next Steps for Full Extraction

To extract ALL certifiers and training centers:
1. Iterate through all 1,477 ECs
2. Visit each EC detail page
3. Expand certification section
4. Extract certifier names
5. Deduplicate across all ECs

Estimated unique certifiers: 500-1000 entities nationwide
