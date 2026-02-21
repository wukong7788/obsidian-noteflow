# NoteFlow 🚀

Format once, publish anywhere.

**NoteFlow** is an Obsidian plugin that converts notes into platform-ready formats for WeChat and Xiaohongshu with a single command.

## ✨ Features

- **Copy as WeChat HTML** – inline-styled HTML safe for WeChat editor
- **Copy as XHS text** – plain text with bracket/emoji markers for Xiaohongshu

## 🚀 Usage

### 1. The Ribbon Icon (Preview & Copy)
1. Open a note in Obsidian.
2. Click the **Paper Plane icon** in the left sidebar (Ribbon).
3. A preview window will open showing you exactly what the output looks like.
4. Select your target (WeChat or XHS) from the dropdown.
5. Click **Copy & Close**.

### 2. Command Palette (Fast Copy)
Open the Command Palette (`Cmd/Ctrl + P`) and run:
- **NoteFlow: Copy as WeChat HTML**
- **NoteFlow: Copy as XHS text**


## ⚙️ Settings

Go to **Settings → NoteFlow**:

| Setting | Default | Description |
|---|---|---|
| Map H1 → H2 | On | Shifts headings down for WeChat articles |
| XHS emphasis style | `「」` | How `**bold**` renders: `「bold」` or `【bold】` |
| XHS heading style | Brackets | `【标题】` vs emoji `✨标题✨` |
| XHS max line length | 60 | Soft-wrap limit (0 = off) |

## 📦 Supported Markdown

**WeChat HTML**: headings, bold/italic, inline code, fenced code, blockquotes, lists, tables, internal links (→ text), images (→ placeholder)

**XHS text**: H1→`【标题】`, H2→`▎小标题`, bold→`「bold」`, bullets→`•`, blockquotes→`❝❞`, code→`▌▌`

## 🛠️ Development

```bash
bun install
bun run build    # → main.js
bun run dev      # watch mode
bun test         # vitest unit tests
bun run typecheck # tsc --noEmit
bun run lint     # eslint src/
```

### Installation with script (Recommended)
You can deploy the plugin directly to your Obsidian vault using the provided script. On Mac, it defaults to `~/Documents/Obsidian Vault`:

```bash
bun run deploy
```

To specify a different vault:
```bash
bun run deploy "/path/to/your/custom/vault"
```

**Manual installation**: Copy `main.js` + `manifest.json` into `<vault>/.obsidian/plugins/noteflow/`, then enable in Settings → Community plugins.

## 🗺️ Roadmap (Phase 2+)

- [ ] Image upload to cloud storage
- [ ] WeChat Official Account draft publishing
- [ ] More platform support

---

Made with ❤️ by [wukong](https://github.com/wukong7788)
