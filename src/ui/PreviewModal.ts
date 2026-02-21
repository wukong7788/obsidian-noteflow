import { App, Modal, Notice } from "obsidian";
import type NoteFlowPlugin from "../main";
import { markdownToWechat } from "../transforms/wechat";
import { markdownToXhs } from "../transforms/xhs";
import { THEMES } from "../styles/themes";

type TargetPlatform = "wechat" | "xhs";

export class PreviewModal extends Modal {
    plugin: NoteFlowPlugin;
    rawMarkdown: string;
    target: TargetPlatform;
    selectedTheme: string;

    private previewContainerEl: HTMLDivElement | null = null;
    private themeSettingGroup: HTMLDivElement | null = null;

    constructor(app: App, plugin: NoteFlowPlugin, markdown: string) {
        super(app);
        this.plugin = plugin;
        this.rawMarkdown = markdown;
        this.target = "wechat";
        this.selectedTheme = "default";
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("noteflow-preview-modal");

        // Top Bar (Controls)
        const headerEl = contentEl.createDiv({ cls: "noteflow-preview-header" });
        headerEl.style.display = "flex";
        headerEl.style.flexDirection = "column";
        headerEl.style.gap = "12px";
        headerEl.style.marginBottom = "16px";
        headerEl.style.borderBottom = "1px solid var(--background-modifier-border)";
        headerEl.style.paddingBottom = "12px";

        const topRow = headerEl.createDiv();
        topRow.style.display = "flex";
        topRow.style.justifyContent = "space-between";
        topRow.style.alignItems = "center";

        const titleEl = topRow.createEl("h2", { text: "NoteFlow Preview", cls: "noteflow-preview-title" });
        titleEl.style.margin = "0";

        const actionButtons = topRow.createDiv();
        actionButtons.style.display = "flex";
        actionButtons.style.gap = "8px";

        // Copy Button
        const copyBtn = actionButtons.createEl("button", { text: "Copy & Close", cls: "mod-cta" });
        copyBtn.onclick = async () => {
            await this.handleCopy();
            this.close();
        };

        // Controls Row (Custom Flex for alignment)
        const controlsRow = headerEl.createDiv({ cls: "noteflow-preview-controls" });
        controlsRow.style.display = "flex";
        controlsRow.style.alignItems = "center";
        controlsRow.style.gap = "24px";
        controlsRow.style.flexWrap = "wrap";

        // Platform Selector
        const platformGroup = controlsRow.createDiv();
        platformGroup.style.display = "flex";
        platformGroup.style.alignItems = "center";
        platformGroup.style.gap = "8px";
        platformGroup.createSpan({ text: "Platform:", cls: "noteflow-label" });

        const platformDrop = platformGroup.createEl("select", { cls: "dropdown" });
        platformDrop.createEl("option", { text: "WeChat HTML", value: "wechat" });
        platformDrop.createEl("option", { text: "Xiaohongshu Text", value: "xhs" });
        platformDrop.value = this.target;
        platformDrop.onchange = () => {
            this.target = platformDrop.value as TargetPlatform;
            this.updateControlsVisibility();
            this.renderPreview();
        };

        // Theme Selector Group
        this.themeSettingGroup = controlsRow.createDiv();
        this.themeSettingGroup.style.display = "flex";
        this.themeSettingGroup.style.alignItems = "center";
        this.themeSettingGroup.style.gap = "8px";
        this.themeSettingGroup.createSpan({ text: "Style Theme:", cls: "noteflow-label" });

        const themeDrop = this.themeSettingGroup.createEl("select", { cls: "dropdown" });
        Object.keys(THEMES).forEach(id => {
            themeDrop.createEl("option", { text: THEMES[id].name, value: id });
        });
        themeDrop.value = this.selectedTheme;
        themeDrop.onchange = () => {
            this.selectedTheme = themeDrop.value;
            this.renderPreview();
        };

        // Preview Area
        this.previewContainerEl = contentEl.createDiv({ cls: "noteflow-preview-content" });
        this.previewContainerEl.style.maxHeight = "65vh";
        this.previewContainerEl.style.overflowY = "auto";
        this.previewContainerEl.style.padding = "16px";
        this.previewContainerEl.style.backgroundColor = "var(--background-secondary)";
        this.previewContainerEl.style.borderRadius = "8px";
        this.previewContainerEl.style.border = "1px solid var(--background-modifier-border)";

        this.updateControlsVisibility();
        this.renderPreview();
    }

    updateControlsVisibility() {
        if (this.themeSettingGroup) {
            this.themeSettingGroup.style.display = this.target === "wechat" ? "flex" : "none";
        }
    }

    renderPreview() {
        if (!this.previewContainerEl) return;
        this.previewContainerEl.empty();

        if (this.target === "wechat") {
            const html = markdownToWechat(this.rawMarkdown, {
                mapH1toH2: this.plugin.settings.wechatMapH1toH2,
                theme: this.selectedTheme,
            });

            const wrapper = this.previewContainerEl.createDiv();
            wrapper.innerHTML = html;
            wrapper.style.backgroundColor = "#fff"; // Ensure visibility
            wrapper.style.borderRadius = "4px";
            wrapper.style.overflow = "hidden";
        } else {
            const text = markdownToXhs(this.rawMarkdown, {
                emphasisStyle: this.plugin.settings.xhsEmphasisStyle,
                headingStyle: this.plugin.settings.xhsHeadingStyle,
                maxLineLength: this.plugin.settings.xhsMaxLineLength,
            });

            const pre = this.previewContainerEl.createEl("pre", { text });
            pre.style.whiteSpace = "pre-wrap";
            pre.style.wordWrap = "break-word";
            pre.style.fontFamily = "var(--font-monospace)";
            pre.style.margin = "0";
            pre.style.color = "var(--text-normal)";
        }
    }

    async handleCopy() {
        try {
            if (this.target === "wechat") {
                const html = markdownToWechat(this.rawMarkdown, {
                    mapH1toH2: this.plugin.settings.wechatMapH1toH2,
                    theme: this.selectedTheme,
                });
                const clipboardItem = new ClipboardItem({
                    "text/html": new Blob([html], { type: "text/html" }),
                    "text/plain": new Blob([html], { type: "text/plain" }),
                });
                await navigator.clipboard.write([clipboardItem]);
                new Notice(`Copied WeChat HTML (${THEMES[this.selectedTheme].name}) ✓`);
            } else {
                const text = markdownToXhs(this.rawMarkdown, {
                    emphasisStyle: this.plugin.settings.xhsEmphasisStyle,
                    headingStyle: this.plugin.settings.xhsHeadingStyle,
                    maxLineLength: this.plugin.settings.xhsMaxLineLength,
                });
                await navigator.clipboard.writeText(text);
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
