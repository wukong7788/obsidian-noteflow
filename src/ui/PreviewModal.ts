import { App, Modal, Notice, Setting } from "obsidian";
import type NoteFlowPlugin from "../main";
import { markdownToWechat } from "../transforms/wechat";
import { markdownToXhs } from "../transforms/xhs";

type TargetPlatform = "wechat" | "xhs";

export class PreviewModal extends Modal {
    plugin: NoteFlowPlugin;
    rawMarkdown: string;
    target: TargetPlatform;

    private previewContainerEl: HTMLDivElement | null = null;
    private currentHtml: string = "";
    private currentText: string = "";

    constructor(app: App, plugin: NoteFlowPlugin, markdown: string) {
        super(app);
        this.plugin = plugin;
        this.rawMarkdown = markdown;
        this.target = "wechat"; // Default to WeChat
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("noteflow-preview-modal");

        // Pre-calculate to save time
        this.currentHtml = markdownToWechat(this.rawMarkdown, {
            mapH1toH2: this.plugin.settings.wechatMapH1toH2,
        });
        this.currentText = markdownToXhs(this.rawMarkdown, {
            emphasisStyle: this.plugin.settings.xhsEmphasisStyle,
            headingStyle: this.plugin.settings.xhsHeadingStyle,
            maxLineLength: this.plugin.settings.xhsMaxLineLength,
        });

        // Top Bar (Controls)
        const headerEl = contentEl.createDiv({ cls: "noteflow-preview-header" });
        headerEl.style.display = "flex";
        headerEl.style.justifyContent = "space-between";
        headerEl.style.alignItems = "center";
        headerEl.style.marginBottom = "16px";
        headerEl.style.borderBottom = "1px solid var(--background-modifier-border)";
        headerEl.style.paddingBottom = "8px";

        const titleEl = headerEl.createEl("h2", { text: "NoteFlow Preview", cls: "noteflow-preview-title" });
        titleEl.style.margin = "0";

        const controlsEl = headerEl.createDiv({ cls: "noteflow-preview-controls" });
        controlsEl.style.display = "flex";
        controlsEl.style.gap = "12px";
        controlsEl.style.alignItems = "center";

        // Format Selector
        new Setting(controlsEl)
            .setName("Platform:")
            .addDropdown((drop) => {
                drop.addOption("wechat", "WeChat HTML");
                drop.addOption("xhs", "Xiaohongshu Text");
                drop.setValue(this.target);
                drop.onChange((value: string) => {
                    this.target = value as TargetPlatform;
                    this.renderPreview();
                });
            });

        // Copy Button
        const copyBtn = controlsEl.createEl("button", { text: "Copy & Close", cls: "mod-cta" });
        copyBtn.onclick = async () => {
            await this.handleCopy();
            this.close();
        };

        // Preview Area
        this.previewContainerEl = contentEl.createDiv({ cls: "noteflow-preview-content" });
        this.previewContainerEl.style.maxHeight = "60vh";
        this.previewContainerEl.style.overflowY = "auto";
        this.previewContainerEl.style.padding = "16px";
        this.previewContainerEl.style.backgroundColor = "var(--background-secondary)";
        this.previewContainerEl.style.borderRadius = "8px";
        this.previewContainerEl.style.border = "1px solid var(--background-modifier-border)";
        this.previewContainerEl.style.color = "var(--text-normal)";

        this.renderPreview();
    }

    renderPreview() {
        if (!this.previewContainerEl) return;
        this.previewContainerEl.empty();

        if (this.target === "wechat") {
            // WeChat render (HTML)
            const wrapper = this.previewContainerEl.createDiv();
            wrapper.innerHTML = this.currentHtml;

            // We force a white background and common text color for the WeChat preview 
            // so it looks like an actual article regardless of Obsidian theme.
            wrapper.style.backgroundColor = "#ffffff";
            wrapper.style.color = "#333333";
            wrapper.style.padding = "20px";
            wrapper.style.borderRadius = "4px";
            wrapper.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        } else {
            // XHS render (Plain Text)
            const pre = this.previewContainerEl.createEl("pre", { text: this.currentText });
            pre.style.whiteSpace = "pre-wrap";
            pre.style.wordWrap = "break-word";
            pre.style.fontFamily = "var(--font-monospace)";
            pre.style.margin = "0";
        }
    }

    async handleCopy() {
        try {
            if (this.target === "wechat") {
                const clipboardItem = new ClipboardItem({
                    "text/html": new Blob([this.currentHtml], { type: "text/html" }),
                    "text/plain": new Blob([this.currentHtml], { type: "text/plain" }),
                });
                await navigator.clipboard.write([clipboardItem]);
                new Notice("Copied WeChat HTML ✓");
            } else {
                await navigator.clipboard.writeText(this.currentText);
                new Notice("Copied XHS text ✓");
            }
        } catch (err) {
            console.error("NoteFlow clipboard error:", err);
            new Notice("Clipboard error! See console.");
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
