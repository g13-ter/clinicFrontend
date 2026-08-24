import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SuperAdminDashboardPage from "./SuperAdminDashboardPage";

vi.mock("../layout/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("SuperAdminDashboardPage", () => {
  it("shows loading placeholders instead of misleading zero account totals", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SuperAdminDashboardPage />
      </MemoryRouter>,
    );

    expect(html).toContain('aria-label="Loading account summary"');
    expect(html).not.toContain("Total Accounts");
    expect(html).not.toContain("No privileged activity recorded");
  });
});
