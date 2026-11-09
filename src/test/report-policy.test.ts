import { describe, it, expect } from "vitest";
import { validateReport, REPORT_REASONS } from "@/lib/admin";
describe("project reports", () => {
  it("offers exactly the five reasons", () => {
    expect([...REPORT_REASONS]).toEqual(["Spam", "Fake project", "Inappropriate content", "Duplicate project", "Other"]);
  });
  it("requires a known reason", () => expect(validateReport("", "")).not.toBeNull());
  it("requires details for Other", () => expect(validateReport("Other", " ")).not.toBeNull());
  it("accepts Spam without details", () => expect(validateReport("Spam", "")).toBeNull());
});
