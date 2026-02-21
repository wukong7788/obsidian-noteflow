/**
 * xhs.ts
 * Pure transform: Markdown string → XHS-friendly plain text.
 * No Obsidian dependency – fully unit-testable.
 */

export type EmphasisStyle = "「」" | "【】";
export type HeadingStyle = "brackets" | "emoji";

export interface XhsOptions {
    emphasisStyle: EmphasisStyle;
    headingStyle: HeadingStyle;
    maxLineLength: number; // soft wrap; 0 = disabled
}

const DEFAULT_OPTIONS: XhsOptions = {
    emphasisStyle: "「」",
    headingStyle: "brackets",
    maxLineLength: 60,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripInlineMarkdown(text: string, opts: XhsOptions): string {
    // Inline code  `code`
    text = text.replace(/`([^`]+)`/g, (_m, code: string) => code);

    // Bold+italic  ***text***
    text = text.replace(/\*{3}(.+?)\*{3}/g, (_m, t: string) => applyEmphasis(t, opts));
    // Bold  **text** or __text__
    text = text.replace(/\*{2}(.+?)\*{2}/g, (_m, t: string) => applyEmphasis(t, opts));
    text = text.replace(/_{2}(.+?)_{2}/g, (_m, t: string) => applyEmphasis(t, opts));
    // Italic  *text* or _text_
    text = text.replace(/\*(.+?)\*/g, (_m, t: string) => t);
    text = text.replace(/_(.+?)_/g, (_m, t: string) => t);

    // Strikethrough
    text = text.replace(/~~(.+?)~~/g, (_m, t: string) => t);

    // Internal links  [[note|alias]]
    text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, note: string, alias?: string) => alias ?? note);

    // Images  ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt: string) => `[图片: ${alt || "图片"}]`);

    // Markdown links  [text](url)
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, (_m, linkText: string) => linkText);

    return text;
}

function applyEmphasis(text: string, opts: XhsOptions): string {
    if (opts.emphasisStyle === "【】") return `【${text}】`;
    return `「${text}」`;
}

function formatH1(text: string, opts: XhsOptions): string {
    if (opts.headingStyle === "emoji") return `✨ ${text} ✨`;
    return `【${text}】`;
}

function formatH2(text: string, opts: XhsOptions): string {
    if (opts.headingStyle === "emoji") return `✅ ${text}`;
    return `▎${text}`;
}

function formatH3(text: string, _opts: XhsOptions): string {
    return `· ${text}`;
}

function softWrap(text: string, maxLen: number): string {
    if (maxLen <= 0 || text.length <= maxLen) return text;
    const words = text.split(" ");
    const result: string[] = [];
    let current = "";
    for (const word of words) {
        if ((current + (current ? " " : "") + word).length > maxLen && current) {
            result.push(current);
            current = word;
        } else {
            current += (current ? " " : "") + word;
        }
    }
    if (current) result.push(current);
    return result.join("\n");
}

function collapseBlankLines(text: string): string {
    return text.replace(/\n{3,}/g, "\n\n");
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function markdownToXhs(markdown: string, options: Partial<XhsOptions> = {}): string {
    const opts: XhsOptions = { ...DEFAULT_OPTIONS, ...options };
    const lines = markdown.split("\n");
    const out: string[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // Blank line
        if (line.trim() === "") {
            out.push("");
            i++;
            continue;
        }

        // Fenced code block
        if (/^```/.test(line)) {
            const lang = line.slice(3).trim();
            const marker = lang ? `▌ ${lang} ▌` : "▌ code ▌";
            out.push(marker);
            i++;
            while (i < lines.length && !/^```/.test(lines[i])) {
                out.push(lines[i]);
                i++;
            }
            out.push("▌ end ▌");
            i++; // consume closing ```
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = stripInlineMarkdown(headingMatch[2], opts);
            out.push(""); // blank before heading
            if (level === 1) out.push(formatH1(text, opts));
            else if (level === 2) out.push(formatH2(text, opts));
            else out.push(formatH3(text, opts));
            out.push(""); // blank after heading
            i++;
            continue;
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
            out.push("—".repeat(20));
            i++;
            continue;
        }

        // Blockquote
        if (/^>\s?/.test(line)) {
            const quoteLines: string[] = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^>\s?/, ""));
                i++;
            }
            out.push("❝");
            quoteLines.forEach((ql) => out.push(stripInlineMarkdown(ql, opts)));
            out.push("❞");
            continue;
        }

        // Unordered list
        if (/^[-*+]\s/.test(line)) {
            while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
                const item = stripInlineMarkdown(lines[i].replace(/^[-*+]\s/, ""), opts);
                out.push(`• ${item}`);
                i++;
            }
            continue;
        }

        // Ordered list
        if (/^\d+\.\s/.test(line)) {
            let num = 1;
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                const item = stripInlineMarkdown(lines[i].replace(/^\d+\.\s/, ""), opts);
                out.push(`${num}. ${item}`);
                num++;
                i++;
            }
            continue;
        }

        // Table – degrade to plain lines
        if (/^\|/.test(line)) {
            while (i < lines.length && /^\|/.test(lines[i])) {
                const tableRow = lines[i];
                // Skip separator rows
                if (/^\|?[\s\-|:]+\|?$/.test(tableRow)) {
                    i++;
                    continue;
                }
                const cells = tableRow
                    .replace(/^\|/, "")
                    .replace(/\|$/, "")
                    .split("|")
                    .map((c) => c.trim())
                    .filter(Boolean);
                out.push(cells.map((c) => stripInlineMarkdown(c, opts)).join(" | "));
                i++;
            }
            continue;
        }

        // Paragraph
        const paraLines: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !/^#{1,6}\s/.test(lines[i]) &&
            !/^[-*+]\s/.test(lines[i]) &&
            !/^\d+\.\s/.test(lines[i]) &&
            !/^>\s?/.test(lines[i]) &&
            !/^```/.test(lines[i]) &&
            !/^\|/.test(lines[i]) &&
            !/^---+$/.test(lines[i].trim())
        ) {
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length > 0) {
            const text = paraLines.map((l) => stripInlineMarkdown(l, opts)).join(" ");
            const wrapped = softWrap(text, opts.maxLineLength);
            out.push(wrapped);
        }
    }

    return collapseBlankLines(out.join("\n")).trim();
}
