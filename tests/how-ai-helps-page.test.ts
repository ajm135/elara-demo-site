import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HowAiHelpsPage from "../src/app/how-ai-helps/page";

describe("how-ai-helps page", () => {
  it("renders the story in a main with a single heading and an image", () => {
    const html = renderToStaticMarkup(createElement(HowAiHelpsPage));
    expect(html).toContain("<main id=\"main-content\">");
    expect(html).toContain("<h1>");
    expect(html).toContain("<img");
  });

  it("tells the story in terms of AI", () => {
    const html = renderToStaticMarkup(createElement(HowAiHelpsPage));
    expect(html).toContain("AI");
  });

  it("shows the medicine illustration that ships under public/", () => {
    const html = renderToStaticMarkup(createElement(HowAiHelpsPage));
    expect(html).toContain('src="/images/ai-in-medicine.svg"');
    expect(existsSync("public/images/ai-in-medicine.svg")).toBe(true);
  });
});
