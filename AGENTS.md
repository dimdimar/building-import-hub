<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- SSR is disabled app-wide via `defaultSsr: false` in src/start.ts; the app is client-rendered only.
- Excel import runs in a server function (src/lib/buildings.functions.ts), not a Supabase Edge Function, because TanStack Start apps keep server logic in createServerFn.
- SQL migrations are mirrored in supabase/migrations for reference.
