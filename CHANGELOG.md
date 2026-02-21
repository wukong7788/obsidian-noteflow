# Changelog

All notable changes to NoteFlow will be documented in this file.

## [0.1.1] – 2026-02-21

### Added
- **Preview Modal**: Multi-platform live preview before copying.
- **Support for 10 Layout Themes**: Switch between Modern, Elegant, Minimalist, etc.
- **Ribbon Icon**: Launch preview modal instantly from the sidebar.

### Improved & Fixed
- **Paste Logic**: WeChat clipboard now properly handles rich HTML for direct pasting.
- **Spacing Optimization**: Refined blank line handling and CSS margins for tighter, professional layouts.
- **UI Alignment**: Cleaned up the preview header and control buttons.
- **Infrastructure**: Switched to `bun` for faster builds and deployments.

## [0.1.0] – 2026-02-21

### Added
- **Command: Copy as WeChat HTML** – converts active note Markdown to inline-styled WeChat-safe HTML and copies to clipboard
- **Command: Copy as XHS text** – converts active note Markdown to XHS-friendly plain text with bracket/emoji heading markers
- **Settings tab** with four options:
  - WeChat: Map H1 → H2 (default on)
  - XHS: Emphasis style `「」` vs `【】`
  - XHS: Heading style brackets vs emoji
  - XHS: Max line length (soft wrap, default 60)
- Pure transform functions (`wechat.ts`, `xhs.ts`) with unit tests (Vitest)
- Graceful handling of: images, internal links, tables, code blocks, edge cases
