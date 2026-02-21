import { Notice, Plugin } from "obsidian";
import { markdownToWechat } from "./transforms/wechat";
import { markdownToXhs } from "./transforms/xhs";
import { NoteFlowSettingTab, DEFAULT_SETTINGS } from "./settings";
import { PreviewModal } from "./ui/PreviewModal";
import type { NoteFlowSettings } from "./settings";

export default class NoteFlowPlugin extends Plugin {
    settings!: NoteFlowSettings;

    async onload(): Promise<void> {
        await this.loadSettings();

        // ── Ribbon Icon ────────────────────────────────────────────────────────
        this.addRibbonIcon("paper-plane", "NoteFlow Preview", async () => {
            const markdown = await this.readActiveNote();
            if (markdown === null) return;
            new PreviewModal(this.app, this, markdown).open();
        });

        // ── Command: Copy as WeChat HTML ────────────────────────────────────────
        this.addCommand({
            id: "copy-wechat",
            name: "Copy as WeChat HTML",
            callback: async () => {
                const markdown = await this.readActiveNote();
                if (markdown === null) return;

                const html = markdownToWechat(markdown, {
                    mapH1toH2: this.settings.wechatMapH1toH2,
                });

                const clipboardItem = new ClipboardItem({
                    "text/html": new Blob([html], { type: "text/html" }),
                    "text/plain": new Blob([html], { type: "text/plain" }),
                });
                await navigator.clipboard.write([clipboardItem]);

                new Notice("Copied WeChat HTML ✓");
            },
        });

        // ── Command: Copy as XHS text ───────────────────────────────────────────
        this.addCommand({
            id: "copy-xhs",
            name: "Copy as XHS text",
            callback: async () => {
                const markdown = await this.readActiveNote();
                if (markdown === null) return;

                const text = markdownToXhs(markdown, {
                    emphasisStyle: this.settings.xhsEmphasisStyle,
                    headingStyle: this.settings.xhsHeadingStyle,
                    maxLineLength: this.settings.xhsMaxLineLength,
                });

                await navigator.clipboard.writeText(text);
                new Notice("Copied XHS text ✓");
            },
        });

        // ── Settings tab ────────────────────────────────────────────────────────
        this.addSettingTab(new NoteFlowSettingTab(this.app, this));
    }

    onunload(): void {
        // nothing to clean up in Phase 1
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    /**
     * Read the raw Markdown content of the currently active note.
     * Returns null (with a Notice) if no file is open.
     */
    private async readActiveNote(): Promise<string | null> {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice("No active note");
            return null;
        }
        return await this.app.vault.read(file);
    }
}
