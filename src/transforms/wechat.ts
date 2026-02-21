import { THEMES, ThemeStyles } from "../styles/themes";

export interface WechatOptions {
    /** Map H1 → H2, H2 → H3 (default: true) */
    mapH1toH2: boolean;
    /** Theme name (default: "default") */
    theme: string;
}

const DEFAULT_OPTIONS: WechatOptions = {
    mapH1toH2: true,
    theme: "default",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Process inline markup within a text segment (bold, em, inline code, links). */
function processInline(text: string, styles: ThemeStyles): string {
    // Inline code  `code`
    text = text.replace(/`([^`]+)`/g, (_m, code: string) => {
        return `<code style="${styles.code}">${escapeHtml(code)}</code>`;
    });

    // Bold+italic  ***text***
    text = text.replace(/\*{3}(.+?)\*{3}/g, (_m, t: string) => `<strong><em>${t}</em></strong>`);
    // Bold  **text**  or  __text__
    text = text.replace(/\*{2}(.+?)\*{2}/g, (_m, t: string) => `<strong>${t}</strong>`);
    text = text.replace(/_{2}(.+?)_{2}/g, (_m, t: string) => `<strong>${t}</strong>`);
    // Italic  *text*  or  _text_
    text = text.replace(/\*(.+?)\*/g, (_m, t: string) => `<em>${t}</em>`);
    text = text.replace(/_(.+?)_/g, (_m, t: string) => `<em>${t}</em>`);

    // Strikethrough  ~~text~~
    text = text.replace(/~~(.+?)~~/g, (_m, t: string) => `<del>${t}</del>`);

    // Internal links  [[note|alias]]  or  [[note]]
    text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, _note: string, alias?: string) => {
        return escapeHtml(alias ?? _note);
    });

    // Images  ![alt](url)  → placeholder
    text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt: string) => {
        return `<em style="color:#888;">[Image: ${escapeHtml(alt || "图片")}]</em>`;
    });

    // Markdown links  [text](url)  → text only (no external links in WeChat)
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, (_m, linkText: string) => linkText);

    return text;
}

// ---------------------------------------------------------------------------
// Block parsers
// ---------------------------------------------------------------------------



function renderFencedCode(lines: string[], styles: ThemeStyles): { html: string; consumed: number } | null {
    if (!/^```/.test(lines[0])) return null;
    const lang = lines[0].slice(3).trim();
    const endIdx = lines.findIndex((l, i) => i > 0 && /^```/.test(l));
    const codeLines = endIdx === -1 ? lines.slice(1) : lines.slice(1, endIdx);
    const consumed = endIdx === -1 ? lines.length : endIdx + 1;
    const code = escapeHtml(codeLines.join("\n"));
    const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : "";
    const html = `<pre${langAttr} style="${styles.pre}"><code style="font-family:monospace;font-size:0.9em">${code}</code></pre>`;
    return { html, consumed };
}

function renderTable(block: string[], styles: ThemeStyles): string | null {
    // Must have at least header + separator
    if (block.length < 2) return null;
    const sepLine = block[1];
    if (!/^\|?[\s\-|:]+\|?$/.test(sepLine)) return null;

    const parseRow = (line: string): string[] =>
        line
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());

    const headers = parseRow(block[0]);
    const rows = block.slice(2).map(parseRow);

    const thCells = headers
        .map((h) => `<th style="${styles.th}">${processInline(h, styles)}</th>`)
        .join("");
    const trHead = `<tr>${thCells}</tr>`;

    const trBody = rows
        .map((cells) => {
            const tds = cells
                .map((c) => `<td style="${styles.td}">${processInline(c, styles)}</td>`)
                .join("");
            return `<tr>${tds}</tr>`;
        })
        .join("");

    return `<table style="${styles.table}"><thead>${trHead}</thead><tbody>${trBody}</tbody></table>`;
}

function headingLevel(line: string, mapH1toH2: boolean): { level: number; text: string } | null {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (!m) return null;
    let level = m[1].length;
    if (mapH1toH2) {
        level = Math.min(level + 1, 6);
    }
    return { level, text: m[2] };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function markdownToWechat(markdown: string, options: Partial<WechatOptions> = {}): string {
    const opts: WechatOptions = { ...DEFAULT_OPTIONS, ...options };
    const styles = THEMES[opts.theme] || THEMES.default;

    const lines = markdown.split("\n");
    const htmlParts: string[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // Blank line
        if (line.trim() === "") {
            i++;
            continue;
        }

        // Fenced code block
        if (/^```/.test(line)) {
            const result = renderFencedCode(lines.slice(i), styles);
            if (result) {
                htmlParts.push(result.html);
                i += result.consumed;
                continue;
            }
        }

        // Heading
        const heading = headingLevel(line, opts.mapH1toH2);
        if (heading) {
            const tag = `h${heading.level}`;
            const headerStyle = heading.level === 2 ? styles.h2 : styles.h3;
            htmlParts.push(
                `<${tag} style="${headerStyle}">${processInline(heading.text, styles)}</${tag}>`
            );
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
            const inner = quoteLines.map((l) => processInline(l, styles)).join("<br>");
            htmlParts.push(
                `<blockquote style="${styles.blockquote}">${inner}</blockquote>`
            );
            continue;
        }

        // Unordered list
        if (/^[-*+]\s/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*+]\s/, ""));
                i++;
            }
            const lis = items.map((it) => `<li style="${styles.li}">${processInline(it, styles)}</li>`).join("");
            htmlParts.push(`<ul style="padding-left:1.5em;margin:8px 0">${lis}</ul>`);
            continue;
        }

        // Ordered list
        if (/^\d+\.\s/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s/, ""));
                i++;
            }
            const lis = items.map((it) => `<li style="${styles.li}">${processInline(it, styles)}</li>`).join("");
            htmlParts.push(`<ol style="padding-left:1.5em;margin:8px 0">${lis}</ol>`);
            continue;
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
            htmlParts.push(`<hr style="${styles.hr}">`);
            i++;
            continue;
        }

        // Table – gather all table lines
        if (/^\|/.test(line) || (lines[i + 1] && /^\|?[\s\-|:]+\|/.test(lines[i + 1]))) {
            const tableLines: string[] = [];
            while (i < lines.length && /^\|/.test(lines[i])) {
                tableLines.push(lines[i]);
                i++;
            }
            const tableHtml = renderTable(tableLines, styles);
            if (tableHtml) {
                htmlParts.push(tableHtml);
            } else {
                // Degrade: render as paragraphs
                tableLines.forEach((tl) => htmlParts.push(`<p style="${styles.p}">${processInline(tl, styles)}</p>`));
            }
            continue;
        }

        // Paragraph (accumulate consecutive non-empty non-special lines)
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
            const text = paraLines.map((l) => processInline(l, styles)).join("<br>");
            htmlParts.push(`<p style="${styles.p}">${text}</p>`);
        }
    }

    const finalHtml = htmlParts.join("\n");
    return `<div style="${styles.container}">${finalHtml}</div>`;
}
