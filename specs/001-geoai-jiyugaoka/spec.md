# Feature Specification: Jiyugaoka ArcGIS GeoAI Coffee Recommendation PoC

**Feature Branch**: `001-geoai-jiyugaoka`  
**Created**: 2026-04-03  
**Status**: Draft  
**Input**: User description: "GeoAIのPoCを作る。対象は東京・自由が丘。一般的なLLMではなく ArcGIS GeoAI 機能を使い、自然言語の揺れを吸収しながら、コーヒーショップまたはコーヒー豆店を選定する。ベスト3提示またはニーズの絞り込みができるようにしたい。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - GeoAI-Driven Recommendation From Natural Language (Priority: P1)

A reviewer enters a free-form Japanese request such as "静かで豆もちゃんとしている店に行きたい" and receives ArcGIS-grounded recommendations for coffee shops or coffee bean stores in Jiyugaoka.

**Why this priority**: This is the core PoC claim. If the system cannot convert natural language into a credible ArcGIS-backed recommendation, the demo fails regardless of additional UI or workflow enhancements.

**Independent Test**: Can be fully tested by entering varied Japanese requests and verifying that the system returns up to three Jiyugaoka candidates along with ArcGIS-based rationale, without depending on any follow-up narrowing flow.

**Acceptance Scenarios**:

1. **Given** the app is loaded with Jiyugaoka as the active search area, **When** a user enters a natural language request for a coffee venue, **Then** the system returns up to three recommendation candidates limited to coffee shops or coffee bean stores within the approved area.
2. **Given** the system returns recommendations, **When** the result cards are shown, **Then** each recommendation includes an explanation tied to ArcGIS-supported spatial or category reasoning rather than a generic LLM-style summary.
3. **Given** two users describe similar needs with different Japanese wording, **When** both requests are processed, **Then** the system handles the phrasing variation without collapsing into a no-result or irrelevant-result response.

---

### User Story 2 - GIS Reviewer Can Inspect Why Results Were Chosen (Priority: P2)

A GIS reviewer can inspect the recommendation output and understand which ArcGIS-driven inputs, constraints, or ranking factors led to the selected venues.

**Why this priority**: The intended audience will judge whether the system is genuinely GIS-centered. Explanations and traceability are essential to demo credibility.

**Independent Test**: Can be tested by reviewing any generated recommendation set and confirming that the UI exposes enough GIS-oriented reasoning to explain why each venue appears in the top results.

**Acceptance Scenarios**:

1. **Given** recommendations are displayed, **When** a reviewer opens the explanation for a candidate, **Then** the system shows GIS-relevant reasoning such as spatial scope, category filtering, ranking basis, or ArcGIS-derived interpretation.
2. **Given** a candidate was recommended, **When** a reviewer asks why it was included, **Then** the answer references ArcGIS-backed logic and not only vague statements like "AI judged it suitable."

---

### User Story 3 - Funnel-Style Narrowing For Ambiguous Needs (Priority: P3)

If a request is broad or ambiguous, the system can narrow the search by asking follow-up questions or by presenting interpretable refinements before locking the final recommendation set.

**Why this priority**: This improves usability and better reflects how people choose cafes, but it is less critical than proving the first-pass ArcGIS GeoAI recommendation loop.

**Independent Test**: Can be tested by entering a vague request such as "いい感じの店" and verifying that the system asks narrowing questions or presents structured refinement choices before finalizing recommendations.

**Acceptance Scenarios**:

1. **Given** a user submits a vague request, **When** the system determines that the need is underspecified, **Then** it offers one or more narrowing prompts relevant to venue choice in Jiyugaoka.
2. **Given** the user answers follow-up prompts, **When** the recommendation is recalculated, **Then** the resulting top candidates become more specific without leaving the approved geography or venue categories.

### Edge Cases

- What happens when the user asks for something outside Jiyugaoka, such as Shibuya or Kiyosumi-Shirakawa?
- What happens when the user request mixes coffee needs with unsupported venue types such as bars, bakeries, or restaurants?
- How does the system respond when ArcGIS returns too few qualified candidates in the selected area?
- How does the system behave when the input is highly vague, such as "いい感じ" or "失敗したくない"?
- How does the system behave when ArcGIS services are temporarily unavailable?
- What happens when the user intent implies both coffee consumption and bean purchase?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST constrain all recommendation behavior to Jiyugaoka, Tokyo for the MVP.
- **FR-002**: System MUST constrain candidate venue types to coffee shops and coffee bean stores for the MVP.
- **FR-003**: Users MUST be able to enter free-form Japanese natural language requests describing mood, purpose, taste, or desired shop characteristics.
- **FR-004**: System MUST tolerate wording variation in Japanese input without requiring users to select from rigid predefined phrases.
- **FR-005**: System MUST use ArcGIS-centered capabilities as the primary basis for recommendation generation and ranking.
- **FR-006**: System MUST NOT rely on a generic LLM as the primary decision-maker for venue recommendation.
- **FR-007**: System MUST return up to three recommendation candidates for a valid request when sufficient qualifying data exists.
- **FR-008**: System MUST show why each recommended venue was selected using ArcGIS-relevant reasoning that can be explained to GIS reviewers.
- **FR-009**: System MUST display the selected venues on a map scoped to the MVP geography.
- **FR-010**: System MUST indicate whether a recommendation refers to a coffee shop, a coffee bean store, or both when relevant.
- **FR-011**: System MUST handle broad or ambiguous requests either by producing a reasonable first-pass top 3 or by asking targeted narrowing questions before finalizing results.
- **FR-012**: System MUST gracefully handle cases where ArcGIS services fail or return insufficient candidates, and it MUST communicate that limitation clearly to the user.
- **FR-013**: System MUST make it possible during a demo to identify which ArcGIS capability, service, or dataset contributes to the recommendation workflow.
- **FR-014**: System MUST avoid presenting unsupported confidence, fabricated rationale, or generic "AI style" answers that cannot be traced back to ArcGIS-driven logic.

### Key Entities *(include if feature involves data)*

- **User Intent**: A free-form Japanese request describing desired atmosphere, use case, product type, or shopping goal.
- **Search Area**: The bounded MVP geography representing Jiyugaoka, Tokyo, including the rules that keep results inside scope.
- **Venue Candidate**: A coffee shop or coffee bean store considered for recommendation, including category, location, ArcGIS-derived attributes, and explanation fields.
- **Recommendation Result**: A ranked candidate output that includes map placement, recommendation order, and GIS-grounded explanation.
- **Refinement Prompt**: A follow-up question or narrowing choice used when the initial user intent is too broad to produce confident results.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In demo scenarios, 100% of shown recommendations remain within Jiyugaoka and within the approved venue categories.
- **SC-002**: For a curated set of representative Japanese requests, the system returns at least one relevant recommendation in at least 80% of trials.
- **SC-003**: Every displayed recommendation includes an explanation that a GIS reviewer can trace to ArcGIS-based logic or ArcGIS-derived constraints.
- **SC-004**: During internal review, the recommendation workflow can be demonstrated without needing to claim that a generic LLM made the final venue choice.
- **SC-005**: For vague inputs, the system either returns a reasonable top 3 set or requests clarifying input within one interaction step.

## Assumptions

- The primary demo audience is GIS-savvy reviewers who will evaluate whether ArcGIS capabilities are genuinely central to the recommendation flow.
- ArcGIS personal use licensing is available for this PoC and can be used during development and demo preparation.
- Mobile-first optimization is not required for the first MVP as long as the desktop demo is stable and legible.
- The MVP may use a bounded and curated venue dataset for Jiyugaoka as long as the recommendation process remains ArcGIS-centered and explainable.
- Follow-up narrowing is desirable but secondary to producing a credible first-pass ArcGIS GeoAI recommendation experience.
