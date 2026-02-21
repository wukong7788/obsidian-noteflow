# NoteFlow 🚀

Format once, publish anywhere.

**NoteFlow** is an Obsidian plugin that converts notes into platform-ready formats for WeChat and Xiaohongshu with a single command.

## ✨ Features

- **Copy as WeChat HTML** – inline-styled HTML safe for WeChat editor, with 10 themes
- **Copy as XHS text** – plain text with bracket/emoji markers for Xiaohongshu
- **Sync to WeChat Draft** – one-click publish directly to your WeChat Official Account DraftBox
- **Auto Image Upload** – local images are automatically uploaded to WeChat and replaced with permanent URLs
- **Smart Cover Selection** – first image in the note is automatically used as the article cover

## 🚀 Usage

### 1. The Ribbon Icon (Preview & Copy)
1. Open a note in Obsidian.
2. Click the **Paper Plane icon** in the left sidebar (Ribbon).
3. A preview window will open showing you exactly what the output looks like.
4. Select your target (WeChat or XHS) and theme from the dropdowns.
5. Click **Copy & Close** to copy, or **Sync to WeChat** to publish directly to your DraftBox.

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
| Proxy Server URL | – | URL of your VPS proxy (e.g. `http://IP:3000`) |
| Proxy Secret | – | `NOTEFLOW_SECRET` from your server's `.env` file |
| Default Cover Media ID | – | Fallback cover `media_id` for notes without images |

## 📦 Supported Markdown

**WeChat HTML**: headings, bold/italic, inline code, fenced code, blockquotes, lists, tables, images (`<img>` tags with auto-upload on sync)

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

## 🗺️ Roadmap

- [x] WeChat HTML preview with themes
- [x] One-click sync to WeChat DraftBox
- [x] Auto image upload & cover selection
- [ ] Multi-platform image CDN support
- [ ] XHS image support

---

Made with ❤️ by [wukong](https://github.com/wukong7788)
