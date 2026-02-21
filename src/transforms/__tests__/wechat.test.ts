import { describe, it, expect } from "vitest";
import { markdownToWechat } from "../wechat";

describe("markdownToWechat", () => {
    // ── Headings ──────────────────────────────────────────────────────────────
    it("converts H1 to H2 when mapH1toH2=true (default)", () => {
        const html = markdownToWechat("# Hello");
        expect(html).toContain("<h2");
        expect(html).toContain("Hello");
    });

    it("keeps H1 as H1 when mapH1toH2=false", () => {
        const html = markdownToWechat("# Hello", { mapH1toH2: false });
        expect(html).toContain("<h1");
    });

    it("converts H2 to H3 when mapH1toH2=true", () => {
        const html = markdownToWechat("## Section");
        expect(html).toContain("<h3");
    });

    // ── Inline formatting ─────────────────────────────────────────────────────
    it("renders bold with <strong>", () => {
        expect(markdownToWechat("**bold text**")).toContain("<strong>bold text</strong>");
    });

    it("renders italic with <em>", () => {
        expect(markdownToWechat("*italic*")).toContain("<em>italic</em>");
    });

    it("renders inline code with monospace style", () => {
        const html = markdownToWechat("Run `npm install` now");
        expect(html).toContain("<code");
        expect(html).toContain("npm install");
        expect(html).toContain("monospace");
    });

    it("renders strikethrough with <del>", () => {
        expect(markdownToWechat("~~removed~~")).toContain("<del>removed</del>");
    });

    // ── Fenced code block ─────────────────────────────────────────────────────
    it("wraps fenced code in <pre><code>", () => {
        const md = "```js\nconsole.log('hi');\n```";
        const html = markdownToWechat(md);
        expect(html).toContain("<pre");
        expect(html).toContain("<code");
        expect(html).toContain("console.log");
    });

    it("escapes HTML inside code blocks", () => {
        const md = "```\n<script>alert(1)</script>\n```";
        const html = markdownToWechat(md);
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });

    // ── Blockquote ────────────────────────────────────────────────────────────
    it("renders blockquote with border-left style", () => {
        const html = markdownToWechat("> important note");
        expect(html).toContain("<blockquote");
        expect(html).toContain("border-left");
        expect(html).toContain("important note");
    });

    // ── Lists ─────────────────────────────────────────────────────────────────
    it("renders unordered list", () => {
        const md = "- Alpha\n- Beta\n- Gamma";
        const html = markdownToWechat(md);
        expect(html).toContain("<ul");
        expect(html).toContain("<li");
        expect(html).toContain("Alpha");
        expect(html).toContain("Gamma");
    });

    it("renders ordered list", () => {
        const md = "1. First\n2. Second";
        const html = markdownToWechat(md);
        expect(html).toContain("<ol");
        expect(html).toContain("First");
        expect(html).toContain("Second");
    });

    // ── Table ─────────────────────────────────────────────────────────────────
    it("renders a markdown table as HTML table", () => {
        const md = "| Name | Age |\n|------|-----|\n| Ron  | 30  |";
        const html = markdownToWechat(md);
        expect(html).toContain("<table");
        expect(html).toContain("<th");
        expect(html).toContain("Name");
        expect(html).toContain("Ron");
    });

    // ── Internal links ────────────────────────────────────────────────────────
    it("converts [[note]] to plain text", () => {
        const html = markdownToWechat("See [[My Note]]");
        expect(html).toContain("My Note");
        expect(html).not.toContain("[[");
    });

    it("uses alias for [[note|alias]]", () => {
        const html = markdownToWechat("See [[My Note|Click here]]");
        expect(html).toContain("Click here");
        expect(html).not.toContain("My Note");
    });

    // ── Images ────────────────────────────────────────────────────────────────
    it("converts images to placeholder text", () => {
        const html = markdownToWechat("![sunset](img/sunset.png)");
        expect(html).toContain("[Image: sunset]");
        expect(html).not.toContain("<img");
    });

    // ── Paragraph ─────────────────────────────────────────────────────────────
    it("wraps plain text in <p>", () => {
        const html = markdownToWechat("Hello world");
        expect(html).toContain("<p");
        expect(html).toContain("Hello world");
    });

    // ── Safety ────────────────────────────────────────────────────────────────
    it("does not include <script> tags", () => {
        const html = markdownToWechat("Hello **world**");
        expect(html).not.toContain("<script");
    });

    it("handles empty input gracefully", () => {
        expect(() => markdownToWechat("")).not.toThrow();
    });
});
