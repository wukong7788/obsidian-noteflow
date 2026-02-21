import { requestUrl } from "obsidian";
import type { NoteFlowSettings } from "../settings";

export interface WeChatArticle {
    title: string;
    author?: string;
    digest?: string;
    content: string;
    content_source_url?: string;
    thumb_media_id: string; // Required by WeChat, we'll use a placeholder if empty
    need_open_comment?: number;
    only_fans_can_comment?: number;
}

export interface WeChatDraftResponse {
    item_id?: string;
    error?: string;
    media_id?: string;
    errcode?: number;
    errmsg?: string;
}

export class WeChatAPI {
    private settings: NoteFlowSettings;

    constructor(settings: NoteFlowSettings) {
        this.settings = settings;
    }

    /**
     * Create a draft in the WeChat Official Account DraftBox
     */
    async createDraft(article: WeChatArticle): Promise<WeChatDraftResponse> {
        const { wechatWorkerUrl, wechatWorkerSecret } = this.settings;

        if (!wechatWorkerUrl || !wechatWorkerSecret) {
            throw new Error("WeChat API not configured. Please check NoteFlow settings.");
        }

        const cleanUrl = wechatWorkerUrl.replace(/\/$/, "");
        const url = `${cleanUrl}/wechat/draft/add`;

        console.log(`NoteFlow: Syncing to ${url}...`);

        try {
            const response = await requestUrl({
                url: url,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-NoteFlow-Secret": wechatWorkerSecret
                },
                body: JSON.stringify({
                    articles: [article]
                })
            });

            const result = response.json as WeChatDraftResponse;
            console.log("NoteFlow: Proxy response:", result);
            return result;
        } catch (err: any) {
            console.error("NoteFlow: Request failed", err);
            throw new Error(`Sync failed: ${err.message || "Network error"}. Check console for details.`);
        }
    }

    /**
     * Upload an image to WeChat (permanent URL for content)
     */
    async uploadImage(fileData: ArrayBuffer, fileName: string): Promise<{ url: string }> {
        return this.uploadMultipart("/wechat/media/uploadimg", fileData, fileName);
    }

    /**
     * Upload a cover image using permanent materials API (returns media_id)
     * Use media_id as thumb_media_id in the draft article.
     */
    async uploadCover(fileData: ArrayBuffer, fileName: string): Promise<{ media_id: string }> {
        return this.uploadMultipart("/wechat/media/upload", fileData, fileName);
    }

    private async uploadMultipart(endpoint: string, fileData: ArrayBuffer, fileName: string): Promise<any> {
        const { wechatWorkerUrl, wechatWorkerSecret } = this.settings;
        const url = `${wechatWorkerUrl.replace(/\/$/, "")}${endpoint}`;

        const boundary = `----ObsidianNoteFlow${Math.random().toString(36).substring(2)}`;
        const ext = fileName.toLowerCase().split(".").pop();
        const contentTypeMap: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
        };
        const contentType = contentTypeMap[ext ?? ""] ?? "image/png";

        const header = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`;
        const footer = `\r\n--${boundary}--\r\n`;

        // Combine parts into a single ArrayBuffer
        const headerBuffer = new TextEncoder().encode(header);
        const footerBuffer = new TextEncoder().encode(footer);
        const body = new Uint8Array(headerBuffer.length + fileData.byteLength + footerBuffer.length);

        body.set(headerBuffer, 0);
        body.set(new Uint8Array(fileData), headerBuffer.length);
        body.set(footerBuffer, headerBuffer.length + fileData.byteLength);

        console.log(`NoteFlow: Uploading to ${url} (${body.byteLength} bytes)...`);

        try {
            const response = await requestUrl({
                url: url,
                method: "POST",
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${boundary}`,
                    "X-NoteFlow-Secret": wechatWorkerSecret
                },
                body: body.buffer
            });

            return response.json;
        } catch (err: any) {
            console.error(`NoteFlow: Upload to ${endpoint} failed`, err);
            throw new Error(`Upload failed: ${err.message || "Network error"}`);
        }
    }
}

/**
 * Simple parser for Obsidian frontmatter (YAML)
 */
export function parseFrontmatter(markdown: string): { data: Record<string, string>, content: string } {
    // Normalize line endings and allow optional trailing newline after closing ---
    const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
    const match = normalized.match(frontmatterRegex);

    if (!match) {
        return { data: {}, content: normalized };
    }

    const yamlStr = match[1];
    const content = match[2];
    const data: Record<string, string> = {};

    yamlStr.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split(":");
        if (key && valueParts.length > 0) {
            data[key.trim()] = valueParts.join(":").trim();
        }
    });

    return { data, content };
}
