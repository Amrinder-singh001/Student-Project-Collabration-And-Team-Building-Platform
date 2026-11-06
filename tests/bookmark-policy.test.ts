import { describe, expect, it } from "bun:test";
import { bookmarkUpsertOptions } from "../src/lib/bookmark-policy";

describe("project bookmark duplicate prevention", () => {
  it("ignores repeat saves for the same user and project", () => {
    expect(bookmarkUpsertOptions()).toEqual({
      onConflict: "user_id,project_id",
      ignoreDuplicates: true,
    });
  });
});