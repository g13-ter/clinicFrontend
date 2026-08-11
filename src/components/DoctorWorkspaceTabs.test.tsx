import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import DoctorWorkspaceTabs from "./DoctorWorkspaceTabs";

describe("DoctorWorkspaceTabs", () => {
  it("shows a linked Notifications tab with its unread count", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DoctorWorkspaceTabs active="notifications" unreadCount={3} />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/dashboard?tab=notifications"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Notifications");
    expect(html).toContain(">3<");
  });

  it("can render without a dashboard unread-count callback", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DoctorWorkspaceTabs active="consultation" />
      </MemoryRouter>,
    );

    expect(html).toContain("Notifications");
    expect(html).not.toContain(">0<");
  });
});
