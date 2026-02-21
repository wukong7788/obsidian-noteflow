---
description: Code review process for NoteFlow PRs
---

## Roles
- Author: writes code + self-review
- Reviewer: checks correctness, safety, maintainability
- (Optional) Agent reviewer: runs checklist + suggests fixes

## Workflow (PR)
1. Author opens PR with:
   - What changed / Why
   - Demo steps (exact commands to run)
   - Risk & rollback notes
2. CI gates:
   - lint, typecheck, tests
3. Reviewer pass:
   - Use checklist below, comment with severity (Critical/High/Med/Low)
4. Author addresses feedback
5. Reviewer approves
6. Squash merge (default) + tag version if needed

## Severity guide
- Critical: data loss, security/privacy, crash
- High: incorrect output, major UX regression
- Medium: edge-case bugs, maintainability issues
- Low: style, minor refactor, nits

## Review checklist
### Correctness
- [ ] Commands appear and run from Command Palette
- [ ] Active note content is read correctly (no empty/undefined cases)
- [ ] Transform output matches requirements (WeChat HTML + XHS text)
- [ ] Edge cases handled (images/tables/code/internal links) without crash

### Security & privacy
- [ ] No network calls added (Phase 1 rule)
- [ ] No secrets stored
- [ ] No logging of full note content in production
- [ ] No unsafe eval / shell execution

### Reliability / DX
- [ ] Errors surfaced via Notice with actionable message
- [ ] Functions are testable (pure transform functions exported)
- [ ] No new heavy deps without justification
- [ ] Types are strict; no excessive any casts

### Performance
- [ ] Transform is linear-ish; no pathological regex backtracking
- [ ] Avoid repeated parsing passes if possible

### UX
- [ ] Notices are clear
- [ ] Settings are minimal and explained
- [ ] Output formatting is stable on paste target

### Docs
- [ ] README updated (how to install + commands + settings)
- [ ] CHANGELOG updated
