import { App, PluginSettingTab, Setting } from "obsidian";
import type NoteFlowPlugin from "./main";
import type { EmphasisStyle, HeadingStyle } from "./transforms/xhs";

export interface NoteFlowSettings {
    /** XHS: bold emphasis style  「」 or 【】 */
    xhsEmphasisStyle: EmphasisStyle;
    /** XHS: heading marker style  brackets or emoji */
    xhsHeadingStyle: HeadingStyle;
    /** WeChat: map H1 → H2 (shift all headings down one level) */
    wechatMapH1toH2: boolean;
    /** XHS: soft-wrap max chars per line (0 = disabled) */
    xhsMaxLineLength: number;
    /** API: Cloudflare Worker URL for WeChat API proxy */
    wechatWorkerUrl: string;
    /** API: Secret key for verifying NoteFlow -> CF Worker requests */
    wechatWorkerSecret: string;
    /** WeChat: default cover image ID */
    wechatDefaultCoverId: string;
}

export const DEFAULT_SETTINGS: NoteFlowSettings = {
    xhsEmphasisStyle: "「」",
    xhsHeadingStyle: "brackets",
    wechatMapH1toH2: true,
    xhsMaxLineLength: 60,
    wechatWorkerUrl: "",
    wechatWorkerSecret: "",
    wechatDefaultCoverId: "",
};

export class NoteFlowSettingTab extends PluginSettingTab {
    plugin: NoteFlowPlugin;

    constructor(app: App, plugin: NoteFlowPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "NoteFlow Settings" });

        // ── WeChat ─────────────────────────────────────────────────────────────
        containerEl.createEl("h3", { text: "WeChat HTML" });

        new Setting(containerEl)
            .setName("Map H1 → H2")
            .setDesc("Shift headings down one level so H1 becomes H2 (recommended for WeChat articles).")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.wechatMapH1toH2).onChange(async (value) => {
                    this.plugin.settings.wechatMapH1toH2 = value;
                    await this.plugin.saveSettings();
                })
            );

        // ── XHS ────────────────────────────────────────────────────────────────
        containerEl.createEl("h3", { text: "XHS plain text" });

        new Setting(containerEl)
            .setName("Emphasis style")
            .setDesc("How to render **bold** text in XHS output.")
            .addDropdown((drop) =>
                drop
                    .addOption("「」", "「bold」")
                    .addOption("【】", "【bold】")
                    .setValue(this.plugin.settings.xhsEmphasisStyle)
                    .onChange(async (value) => {
                        this.plugin.settings.xhsEmphasisStyle = value as EmphasisStyle;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Heading marker style")
            .setDesc("How to format headings in XHS output.")
            .addDropdown((drop) =>
                drop
                    .addOption("brackets", "【标题】 / ▎小标题")
                    .addOption("emoji", "✨标题✨ / ✅小标题")
                    .setValue(this.plugin.settings.xhsHeadingStyle)
                    .onChange(async (value) => {
                        this.plugin.settings.xhsHeadingStyle = value as HeadingStyle;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Max line length")
            .setDesc("Soft-wrap XHS text at this many characters. Set to 0 to disable.")
            .addText((text) =>
                text
                    .setPlaceholder("60")
                    .setValue(String(this.plugin.settings.xhsMaxLineLength))
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num >= 0) {
                            this.plugin.settings.xhsMaxLineLength = num;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        // ── API Integration (v0.2.1) ──────────────────────────────────────────
        containerEl.createEl("h3", { text: "Proxy Server Settings (VPS/Cloud)" });
        containerEl.createEl("p", {
            text: "Connect to your self-hosted VPS or WeChat Cloud Hosting proxy to sync content and images.",
            cls: "setting-item-description"
        });

        new Setting(containerEl)
            .setName("Proxy Server URL")
            .setDesc("The public URL of your proxy server (e.g., http://your-vps-ip:3000).")
            .addText((text) =>
                text
                    .setPlaceholder("http://1.2.3.4:3000")
                    .setValue(this.plugin.settings.wechatWorkerUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.wechatWorkerUrl = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Proxy Secret")
            .setDesc("The NOTEFLOW_SECRET defined in your server's .env file.")
            .addText((text) =>
                text
                    .setPlaceholder("Enter secret key...")
                    .setValue(this.plugin.settings.wechatWorkerSecret)
                    .onChange(async (value) => {
                        this.plugin.settings.wechatWorkerSecret = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Default Cover Media ID")
            .setDesc("The media_id of the default cover image to use when no images are present in the note.")
            .addText((text) =>
                text
                    .setPlaceholder("Optional")
                    .setValue(this.plugin.settings.wechatDefaultCoverId)
                    .onChange(async (value) => {
                        this.plugin.settings.wechatDefaultCoverId = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
