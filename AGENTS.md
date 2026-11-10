<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->
- Profile photo selection opens the client-side AvatarEditor using react-easy-crop and exports the confirmed square crop before the existing storage upload; this preserves the current profile design and prevents unconfirmed photo changes.
- Dashboard and Profile use the shared ProfilePhotoViewer with the existing Modal primitive; this keeps photo viewing accessible and separate from the camera editing action.
- Persisted notifications are created by database triggers for domain events and are readable or markable only by their recipient, keeping event capture reliable and user-scoped.
- Theme context, hook, and provider live in separate modules so component refreshes cannot replace the context identity; the provider persists the mode and pages use existing semantic tokens.
- AuthProvider owns the single auth subscription and ordered query-cache teardown on logout; shared navigation reads session state to avoid stale login controls.
- Admin moderation uses has_role-gated RLS policies plus a separate user_blocks table checked by is_blocked() in restrictive insert policies; blocks can't be self-cleared via profile edits.
- New accounts get their profile and student role from the handle_new_user trigger on auth.users, so sign-up works even when email confirmation leaves no client session.
- Seeded demo projects are flagged with projects.is_sample so they can be found or removed later without touching student-created projects.
- Glass surfaces come from tokens and `glass`/`glass-strong`/`glass-ink` utilities in src/styles.css, applied centrally in the shadcn primitives; this keeps the look consistent and themeable without per-page colour classes.
