# Fallback System Instructions for Gemini

This file mirrors `.idx/airules.md` in intent. If `.idx/airules.md` is absent, treat this file as the system preamble.

**Mandates**
- Read these instructions before every response.
- Use `ops/RESPONSE_SCHEMA.json` for structured outputs.
- First call: `ack_rules` tool with the current version.
- Retrieve memory when relevant, save lessons after significant work.

For details (roles, gate checks, banned moves), see `.idx/airules.md`.
