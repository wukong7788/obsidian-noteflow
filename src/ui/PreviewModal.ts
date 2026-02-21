import { App, Modal, Notice, TFile } from "obsidian";
import type NoteFlowPlugin from "../main";
import { markdownToWechat } from "../transforms/wechat";
import { markdownToXhs } from "../transforms/xhs";
import { THEMES } from "../styles/themes";
import { WeChatAPI, parseFrontmatter } from "../api/wechat";

type TargetPlatform = "wechat" | "xhs";

export class PreviewModal extends Modal {
    plugin: NoteFlowPlugin;
    rawMarkdown: string;
    target: TargetPlatform;
    selectedTheme: string;

    private previewContainerEl: HTMLDivElement | null = null;
    private themeSettingGroup: HTMLDivElement | null = null;
    private syncBtn: HTMLButtonElement | null = null;
    private isSyncing = false;

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

        // Sync Button (v0.2.0)
        this.syncBtn = actionButtons.createEl("button", { text: "Sync to WeChat", cls: "noteflow-sync-btn" });
        this.syncBtn.style.display = this.target === "wechat" ? "block" : "none";
        this.syncBtn.onclick = () => this.handleSync();

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
        if (this.syncBtn) {
            this.syncBtn.style.display = this.target === "wechat" ? "block" : "none";
        }
    }

    async handleSync() {
        if (this.isSyncing) return;

        const { wechatWorkerUrl, wechatWorkerSecret } = this.plugin.settings;
        if (!wechatWorkerUrl || !wechatWorkerSecret) {
            new Notice("Please configure WeChat API settings first!");
            // @ts-ignore - Internal Obsidian API
            this.app.setting.open();
            // @ts-ignore - Internal Obsidian API
            this.app.setting.openTabById("noteflow");
            return;
        }

        this.isSyncing = true;
        if (this.syncBtn) {
            this.syncBtn.innerText = "Syncing...";
            this.syncBtn.disabled = true;
        }

        try {
            // 1. Extract Metadata
            const { data, content } = parseFrontmatter(this.rawMarkdown);

            // 2. Transform Content
            let html = markdownToWechat(content, {
                mapH1toH2: this.plugin.settings.wechatMapH1toH2,
                theme: this.selectedTheme,
            });

            // 3. Process Images (Upload & Replace)
            const api = new WeChatAPI(this.plugin.settings);
            const { updatedHtml, thumbMediaId } = await this.processImages(content, html, api);

            // 4. Prepare Article
            const activeFile = this.app.workspace.getActiveFile();
            const title = data.title || (activeFile ? activeFile.basename : "Untitled");

            const article = {
                title,
                author: data.author || "",
                digest: data.digest || "",
                content: updatedHtml,
                thumb_media_id: thumbMediaId || this.plugin.settings.wechatDefaultCoverId,
            };

            if (!article.thumb_media_id) {
                new Notice("Error: WeChat requires a cover image. Add an image to your note or set a 'Default Cover Media ID' in settings.");
                throw new Error("Missing cover image (thumb_media_id)");
            }

            // 5. Send to Worker
            const result = await api.createDraft(article);

            if (result.media_id) {
                new Notice("Successfully synced to WeChat DraftBox! ✓");
            } else if (result.errcode) {
                new Notice(`WeChat Error: ${result.errmsg}`);
                console.error("WeChat API error:", result);
            } else {
                throw new Error("Unknown response from proxy");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("NoteFlow sync error:", err);
            new Notice(`Sync failed: ${message}`);
        } finally {
            this.isSyncing = false;
            if (this.syncBtn) {
                this.syncBtn.innerText = "Sync to WeChat";
                this.syncBtn.disabled = false;
            }
        }
    }

    /**
     * Scans for local images, uploads them to WeChat, and replaces links in HTML.
     */
    private async processImages(markdown: string, html: string, api: WeChatAPI): Promise<{ updatedHtml: string, thumbMediaId: string | null }> {
        let updatedHtml = html;
        let thumbMediaId: string | null = null;

        // Regex for ![[image.png]] and ![](image.png)
        const wikiRegex = /!\[\[(.*?)\]\]/g;
        const mdRegex = /!\[.*?\]\((.*?)\)/g;

        const allMatches = [
            ...Array.from(markdown.matchAll(wikiRegex)),
            ...Array.from(markdown.matchAll(mdRegex))
        ];

        if (allMatches.length === 0) {
            return { updatedHtml, thumbMediaId: null };
        }

        new Notice(`Found ${allMatches.length} images. Uploading...`);

        const processedImages = new Set<string>();

        for (const match of allMatches) {
            let linkPath = decodeURIComponent(match[1]);
            // Handle WikiLink aliases like "image.png|100"
            if (linkPath.includes("|")) {
                linkPath = linkPath.split("|")[0];
            }

            // Ignore external URLs
            if (linkPath.startsWith("http")) continue;

            if (processedImages.has(linkPath)) continue;
            processedImages.add(linkPath);

            const file = this.app.metadataCache.getFirstLinkpathDest(linkPath, "");
            if (file instanceof TFile && ["png", "jpg", "jpeg", "gif", "webp"].includes(file.extension.toLowerCase())) {
                try {
                    console.log(`NoteFlow: Processing image ${file.name}...`);
                    const arrayBuffer = await this.app.vault.readBinary(file);

                    // Upload for content (permanent URL)
                    const imgRes = await api.uploadImage(arrayBuffer, file.name);
                    if (imgRes.url) {
                        console.log(`NoteFlow: Uploaded ${file.name} -> ${imgRes.url}`);
                        // Target src="..." specifically
                        updatedHtml = updatedHtml.split(`src="${linkPath}"`).join(`src="${imgRes.url}"`);
                    }

                    // If it's the first image, upload as cover too
                    if (!thumbMediaId) {
                        console.log(`NoteFlow: Uploading ${file.name} as cover...`);
                        const coverRes = await api.uploadCover(arrayBuffer, file.name);
                        // WeChat permanent materials API returns media_id
                        thumbMediaId = coverRes.media_id || null;
                        if (thumbMediaId) {
                            console.log(`NoteFlow: Cover thumb_media_id: ${thumbMediaId}`);
                        }
                    }
                } catch (e: any) {
                    console.error(`NoteFlow: Failed to process image: ${linkPath}`, e);
                    throw new Error(`Failed to upload ${file.name}: ${e.message || e}`);
                }
            } else {
                console.warn(`NoteFlow: Could not find image or unsupported type: ${linkPath}`);
            }
        }

        return { updatedHtml, thumbMediaId };
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

            // Resolve local images for preview visibility
            const imgs = wrapper.querySelectorAll("img");
            imgs.forEach(img => {
                const src = img.getAttribute("src");
                if (src && !src.startsWith("http") && !src.startsWith("app://") && !src.startsWith("data:")) {
                    const decodedSrc = decodeURIComponent(src);
                    const file = this.app.metadataCache.getFirstLinkpathDest(decodedSrc, "");
                    if (file instanceof TFile) {
                        img.src = this.app.vault.getResourcePath(file);
                    }
                }
            });

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
