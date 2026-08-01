import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("renders the hero heading and primary call to action", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain("Care that feels calm, clear, and connected.");
    expect(html).toContain("Explore the platform");
  });
});
