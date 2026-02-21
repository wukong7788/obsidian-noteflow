# REQUIREMENTS (Phase 1) - Obsidian Publish Helpers

## Objective
From an open note in Obsidian, provide two commands:
1) Copy as WeChat HTML
2) Copy as XHS plain text

## User stories
- As a creator, I can run a command to copy my note into WeChat editor with safe formatting.
- As a creator, I can run a command to copy a XHS-ready text version with stable line breaks and emphasis markers.

## Functional requirements
### FR1: Command - Copy as WeChat HTML
- Available in Command Palette
- Takes current active Markdown file content
- Transforms to WeChat-safe HTML
- Copies to clipboard
- Shows a Notice: "Copied WeChat HTML"

### FR2: Command - Copy as XHS text
- Available in Command Palette
- Takes current active Markdown file content
- Transforms to XHS-friendly plain text
- Copies to clipboard
- Shows a Notice: "Copied XHS text"

### FR3: Settings (minimal)
- Toggle: XHS emphasis style: 「 」 vs 【 】
- Toggle: XHS heading markers: 【】 vs emoji prefixes
- Toggle: WeChat heading levels: map H1->H2 (default on)
- Optional: Max line length for XHS (default 60 chars) - soft wrap

## Non-functional requirements
- No network calls
- Fast on 20k+ char notes (<200ms typical transform)
- Works on macOS/Windows/Linux Obsidian desktop
- No data persistence besides user settings

## Edge cases / graceful degradation
- Images: leave markdown image alt text + link, or convert to plain text placeholder like [Image: filename]
- Tables: either keep minimal HTML table OR convert to lines; must not crash
- Code blocks: preserve content; keep monospace styling for WeChat; use fenced block markers for XHS
- Internal links [[note]]: convert to plain text "note" in XHS; WeChat HTML: plain text anchor without href or keep text only

## Definition of done (DoD)
- Both commands work in sample vault
- Clipboard content is correct (manual paste test)
- Lint + typecheck pass
- README updated with usage
- CHANGELOG entry added
