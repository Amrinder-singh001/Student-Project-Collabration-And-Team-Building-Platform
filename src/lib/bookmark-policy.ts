export function bookmarkUpsertOptions() {
  return { onConflict: "user_id,project_id", ignoreDuplicates: true } as const;
}