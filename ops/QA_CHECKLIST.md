# QA Gate — Must Pass Before "OK"

## Functional
- [ ] Core flows unchanged unless explicitly requested
- [ ] New behavior covered by tests or explicit test plan

## Security & Privacy
- [ ] No secrets in code or logs
- [ ] PII minimized; access controlled

## Data & Migrations
- [ ] Backups or shadow fields in place
- [ ] Rollback plan documented and feasible

## UX & Accessibility
- [ ] Keyboard accessible; focus order sane
- [ ] Contrast and ARIA where applicable

## Ops
- [ ] Observability added/updated (logs/metrics)
- [ ] Deploy + rollback steps rehearsed

## Rule Compliance
- [ ] `ack_rules` called
- [ ] `rule_checklist` all PASS
