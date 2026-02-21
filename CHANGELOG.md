# Changelog

All notable changes to NoteFlow will be documented in this file.

## [0.2.1] - 2026-02-22
### Added
- **Auto Image Upload**: Local images detected in notes are automatically uploaded to WeChat on sync.
- **Image URL Replacement**: Local image paths in the HTML are replaced with permanent WeChat CDN URLs.
- **Smart Cover Selection**: First image in the note is auto-selected and uploaded as the article cover.
- **Default Cover Setting**: A fallback `media_id` can be configured for text-only notes.

### Fixed
- **Preview now shows local images**: Preview modal correctly resolves Obsidian vault image paths.
- **URL-encoded paths**: Image filenames containing spaces (e.g. `截图%202026.png`) are now correctly decoded and resolved.
- **Permanent materials API**: Cover images are uploaded via `add_material` (10MB limit) instead of temporary thumb API (64KB limit), resolving the `invalid media_id` error.
- **WikiLink aliases**: Images with aliases like `![[image.png|100]]` are now correctly processed.

## [0.2.0] - 2026-02-21
### Added
- **Direct WeChat Sync**: Establish API bridge via VPS/Cloud Hosting Proxy.
- **Frontmatter Parsing**: Extract Title, Author, and Digest from Obsidian metadata.

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
