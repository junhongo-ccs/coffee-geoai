# coffee-map Constitution

## Core Principles

### I. GIS Rule First
This project demonstrates a GIS-grounded recommendation proof of concept, not a generic LLM wrapper. Recommendation, filtering, and prioritization logic MUST be grounded in explicit, inspectable spatial rules and curated geodata that can be explained to a GIS audience. A generic LLM MAY assist with peripheral UX copy only, and MUST NOT be the primary decision-maker for candidate selection.

### II. Explainable Spatial Reasoning
Every recommendation shown to users MUST be explainable in GIS terms. The application MUST be able to show why a location was selected using spatial and category reasoning that a GIS practitioner can inspect and defend. Opaque "AI chose this" behavior is not acceptable for demos, reviews, or milestone sign-off.

### III. Jiyugaoka Scope Discipline
The initial proof of concept is intentionally narrow. The target geography is limited to Jiyugaoka, Tokyo, and the target venue types are limited to coffee shops and coffee bean stores. Scope expansion beyond this area or category set requires an explicit spec update so the PoC remains sharp, credible, and demonstrable.

### IV. Natural Language Robustness Without Rule-Only Shortcuts
The product MUST accept varied Japanese natural language input and tolerate phrasing differences in user intent. However, simple if/then keyword branching alone is not sufficient to satisfy the product goal. Heuristic parsing may be used as support, but the final recommendation experience MUST still reflect robust spatial ranking rather than a brittle rules-only pipeline.

### V. Demo Credibility Over UI Polish
When tradeoffs arise, the project prioritizes GIS credibility, traceability, and evaluability over visual polish or speculative feature breadth. A smaller PoC that clearly proves explainable GIS value is preferable to a broader interface that appears AI-shaped but cannot withstand expert scrutiny.

## Product Constraints

- The primary reviewers are GIS professionals who can quickly identify whether the system relies on genuine GIS capabilities or generic conversational output.
- The product MUST make spatial reasoning and data provenance legible in both implementation and demo flow.
- The MVP output MAY present a top 3 recommendation set rather than a single "best" result.
- The product MAY ask follow-up questions to narrow needs like a funnel, but this is secondary to establishing a credible first-pass recommendation flow.
- Drag-and-drop input is explicitly optional and out of scope for MVP unless later required by a feature spec.

## Development Workflow

- Any feature spec MUST state which spatial rules and data flows are responsible for recommendation behavior.
- Any implementation that introduces generic LLM-based judgment into the main recommendation path MUST be rejected unless the constitution is amended first.
- Reviews MUST check whether recommendation logic is explainable, GIS-grounded, and limited to the approved geography and category scope.
- Prototypes SHOULD favor real geodata and repeatable processing over opaque intelligence because unverifiable outputs undermine demo trust.

## Governance

This constitution overrides convenience-driven implementation choices. If a proposed change makes the application look more impressive but weakens GIS-centered credibility, the change does not comply. Amendments require documenting the new intent, the reason existing principles are insufficient, and the migration impact on current specs and plans.

**Version**: 1.1.0 | **Ratified**: 2026-04-03 | **Last Amended**: 2026-04-06

