import { describe, it, expect } from "vitest";
import { markdownToXhs } from "../xhs";

describe("markdownToXhs", () => {
    // ── Headings (brackets style, default) ────────────────────────────────────
    it("converts H1 to 【title】 (brackets style)", () => {
        const text = markdownToXhs("# My Title");
        expect(text).toContain("【My Title】");
    });

    it("converts H2 to ▎subtitle (brackets style)", () => {
        const text = markdownToXhs("## Section");
        expect(text).toContain("▎Section");
    });

    it("converts H3 to · subtitle", () => {
        const text = markdownToXhs("### Subsection");
        expect(text).toContain("· Subsection");
    });

    // ── Headings (emoji style) ────────────────────────────────────────────────
    it("converts H1 with emoji style", () => {
        const text = markdownToXhs("# Title", { headingStyle: "emoji" });
        expect(text).toContain("✨ Title ✨");
    });

    it("converts H2 with emoji style", () => {
        const text = markdownToXhs("## Sec", { headingStyle: "emoji" });
        expect(text).toContain("✅ Sec");
    });

    // ── Emphasis ──────────────────────────────────────────────────────────────
    it("converts **bold** to 「bold」 (default)", () => {
        const text = markdownToXhs("**important**");
        expect(text).toContain("「important」");
    });

    it("converts **bold** to 【bold】 with emphasisStyle 【】", () => {
        const text = markdownToXhs("**important**", { emphasisStyle: "【】" });
        expect(text).toContain("【important】");
    });

    it("strips *italic* markers", () => {
        const text = markdownToXhs("*italic text*");
        expect(text).toContain("italic text");
        expect(text).not.toContain("*italic");
    });

    // ── Lists ─────────────────────────────────────────────────────────────────
    it("converts unordered list items to • bullet", () => {
        const text = markdownToXhs("- Apple\n- Banana");
        expect(text).toContain("• Apple");
        expect(text).toContain("• Banana");
    });

    it("converts ordered list items with numbers", () => {
        const text = markdownToXhs("1. First\n2. Second");
        expect(text).toContain("1. First");
        expect(text).toContain("2. Second");
    });

    // ── Blockquote ────────────────────────────────────────────────────────────
    it("wraps blockquotes with ❝ ❞ markers", () => {
        const text = markdownToXhs("> some quote");
        expect(text).toContain("❝");
        expect(text).toContain("some quote");
        expect(text).toContain("❞");
    });

    // ── Code block ────────────────────────────────────────────────────────────
    it("wraps fenced code with ▌ markers", () => {
        const md = "```python\nprint('hi')\n```";
        const text = markdownToXhs(md);
        expect(text).toContain("▌ python ▌");
        expect(text).toContain("print('hi')");
        expect(text).toContain("▌ end ▌");
    });

    // ── Internal links ────────────────────────────────────────────────────────
    it("converts [[note]] to plain text", () => {
        const text = markdownToXhs("See [[My Note]]");
        expect(text).toContain("My Note");
        expect(text).not.toContain("[[");
    });

    // ── Images ────────────────────────────────────────────────────────────────
    it("converts images to [图片: alt]", () => {
        const text = markdownToXhs("![sunset](img/a.png)");
        expect(text).toContain("[图片: sunset]");
    });

    // ── Table ─────────────────────────────────────────────────────────────────
    it("degrades table to pipe-separated plain text", () => {
        const md = "| Name | Age |\n|------|-----|\n| Ron  | 30  |";
        const text = markdownToXhs(md);
        expect(text).toContain("Name");
        expect(text).toContain("Ron");
        expect(text).not.toContain("<table");
    });

    // ── Soft wrap ─────────────────────────────────────────────────────────────
    it("does not wrap short text", () => {
        const text = markdownToXhs("Short line", { maxLineLength: 60 });
        expect(text).toBe("Short line");
    });

    it("wraps long text at maxLineLength", () => {
        const long = "word ".repeat(20).trim(); // ~99 chars
        const text = markdownToXhs(long, { maxLineLength: 30 });
        const lines = text.split("\n");
        lines.forEach((line) => expect(line.length).toBeLessThanOrEqual(35)); // some tolerance
    });

    it("disables wrap when maxLineLength=0", () => {
        const long = "word ".repeat(20).trim();
        const text = markdownToXhs(long, { maxLineLength: 0 });
        expect(text.split("\n").length).toBe(1);
    });

    // ── Edge cases ────────────────────────────────────────────────────────────
    it("handles empty input gracefully", () => {
        expect(() => markdownToXhs("")).not.toThrow();
    });

    it("collapses more than 2 consecutive blank lines", () => {
        const md = "Para 1\n\n\n\n\nPara 2";
        const text = markdownToXhs(md);
        expect(text).not.toMatch(/\n{3,}/);
    });

    it("strips **bold from headings too", () => {
        const text = markdownToXhs("# **Bold Title**");
        expect(text).toContain("「Bold Title」");
    });
});
