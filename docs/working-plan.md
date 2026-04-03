# Working Plan

## Goal

Build a credible GeoAI PoC for Jiyugaoka coffee venue recommendation that can survive scrutiny from GIS professionals.

## Immediate Priority

Do not continue polishing the current UI until the ArcGIS service and authentication path is proven.

## Proposed Work Order

### Phase 1: Feasibility

- Verify ArcGIS Personal Use constraints
- Verify OAuth app registration path
- Verify whether HTTPS localhost or another app type is required
- Verify what ArcGIS services can be used in practice

### Phase 2: Recommendation Architecture

Choose one of these paths:

#### Option A

ArcGIS-only recommendation flow

- ArcGIS-authenticated search or geospatial services
- ArcGIS-centered ranking and explanation
- strongest GIS credibility if workable

#### Option B

Google Places + ArcGIS hybrid

- Google Places for candidate venue retrieval
- ArcGIS for area constraint, map, spatial reasoning, explanation, and ranking structure
- acceptable only if ArcGIS still remains clearly central in the story

### Phase 3: App Refactor

- remove `VITE_ARCGIS_API_KEY` assumption if invalid
- replace rule-first recommendation framing
- align app copy with the PoC definition
- support top 3 recommendation presentation
- reserve funnel-style narrowing as a secondary feature

### Phase 4: Demo Readiness

- make ArcGIS usage legible in UI and narrative
- show why each result is selected in GIS terms
- ensure all outputs stay inside Jiyugaoka and allowed venue types
- prepare a small set of demo prompts in Japanese

## Risks

- ArcGIS Personal Use may block the easiest service/auth path
- Google Places may weaken ArcGIS credibility if overused
- current prototype may mislead implementation if reused too directly

## Current Practical Conclusion

The safest next move is not coding more recommendation logic yet.

The safest next move is to settle:

- auth model
- service availability
- data source strategy

before implementation planning goes deeper.
