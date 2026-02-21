# AGENTS.md

## Project
Obsidian plugin: Phase 1 "Publish helpers"
Goal: Convert current note Markdown into
1) WeChat-safe HTML (copy to clipboard)
2) Xiaohongshu-friendly plain text (copy to clipboard)
No server required in Phase 1.

## What to do first (always)
1. Read README + manifest.json
2. Identify entrypoints: main.ts, settings tab, commands
3. Run checks locally (see Commands)
4. Propose a short plan before coding (bullets)
5. Implement smallest change set, keep diffs tight
6. Add/adjust tests if applicable
7. Update docs (REQUIREMENTS / CHANGELOG)

## Non-goals (Phase 1)
- No automatic publish to WeChat Official Account API
- No OAuth / secrets storage
- No image upload pipeline (keep local links as-is or warn)

## Repo conventions
- TypeScript first; avoid any/unsafe casts unless justified
- Prefer pure functions for transforms: markdown -> html/text
- Keep UI minimal: Command Palette + optional ribbon icon
- Avoid heavy dependencies; justify each new dependency in PR description

## Security & privacy
- Never exfiltrate note contents
- No network calls in Phase 1
- No filesystem writes outside Obsidian vault APIs

## Commands (update to match your repo)
- Install: `pnpm i` (or `npm i`)
- Dev build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test` (if exists)

## Output rules (Phase 1)
### WeChat HTML (copy)
- Generate conservative HTML (no external CSS, no scripts)
- Prefer inline styles or minimal tag set (p, strong, em, ul/ol/li, blockquote, pre/code, h2/h3)
- Avoid complex tables; degrade gracefully (simple table -> paragraph lines or keep <table> with minimal style)
- Provide a "Preview HTML" dev helper (log / modal) if needed

### XHS plain text (copy)
- Output plain text with stable formatting
- Convert headings to markers (e.g. 【标题】 / ✅小标题)
- Normalize spacing & line breaks; keep paragraphs short
- Convert **bold** to brackets 「bold」 to keep emphasis in plain text

## Change management
- Each PR includes:
  - What/Why
  - Demo steps
  - Risk notes
  - Screenshots/GIF if UI changed
