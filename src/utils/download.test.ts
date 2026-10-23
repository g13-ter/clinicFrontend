import { afterEach, describe, expect, it, vi } from "vitest";
import { reportFilename, saveBlobDownload } from "./download";

describe("report downloads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("uses the server filename and supports encoded filenames", () => {
    expect(
      reportFilename('attachment; filename="Clinic_Report.docx"', "fallback.docx"),
    ).toBe("Clinic_Report.docx");
    expect(
      reportFilename("attachment; filename*=UTF-8''Clinic%20Report.csv", "fallback.csv"),
    ).toBe("Clinic Report.csv");
  });

  it("attaches the link before clicking and revokes the URL after a delay", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const timeout = vi.spyOn(window, "setTimeout").mockImplementation((callback) => {
      expect(document.querySelector("a")).toBeNull();
      if (typeof callback === "function") callback();
      return 1;
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(document.body.contains(this)).toBe(true);
        expect(this.download).toBe("Clinic_Report.docx");
      });

    saveBlobDownload(new Blob(["report"]), "Clinic_Report.docx");

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(timeout).toHaveBeenCalledWith(expect.any(Function), 1_000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });
});
