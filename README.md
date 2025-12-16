# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/664d4fa2-480f-4f40-bf37-9a89b1686646

**Sattva — Call Analysis Dashboard**

- **Project**: Sattva Call Analysis — call recording ingestion, transcription, AI analysis, and team dashboards.
- **Stack**: Vite + React + TypeScript, Tailwind CSS, shadcn-ui, Supabase (Postgres + Functions).

**Getting Started**
- **Prerequisites**: Node.js (18+ recommended), npm.
- **Install**: `npm ci` or `npm install`.
- **Run (dev)**: `npm run dev` — starts Vite dev server on localhost.
- **Build (prod)**: `npm run build` — produces `dist/` for production.
- **Preview**: `npm run preview` — preview production build locally.

**Environment**
- This app uses Vite env vars with the `VITE_` prefix. Create a `.env` file (not committed) in project root with at least:

	- `VITE_SUPABASE_URL` — your Supabase project URL
	- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key

	Example `.env`:

	```env
	VITE_SUPABASE_URL=https://xyzcompany.supabase.co
	VITE_SUPABASE_ANON_KEY=eyJ...your_key_here
	```

- The Supabase client is configured in [src/lib/supabase.ts](src/lib/supabase.ts) and falls back to an embedded demo URL/key if env vars are not set.

**Database & Serverless**
- Database migrations and SQL helpers are under the `db/` folder and `supabase/migrations/`.
- Edge function and webhook helpers live in `supabase/functions/` (e.g., `webhook-call-capture`, `exotel-proxy`).

**Key Source Paths**
- UI entry: `src/main.tsx` and `src/App.tsx`
- Pages: `src/pages/` (analysis, call details, auth callbacks)
- Dashboards & components: `src/components/` (dashboards, tabs, modals)
- Supabase client & types: [src/lib/supabase.ts](src/lib/supabase.ts)
- Scripts: `scripts/` (utility scripts used in project workflows)

**Scripts**
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run build:dev` — build using development mode
- `npm run preview` — preview built production bundle
- `npm run lint` — run ESLint

**Common Tasks**
- Add or update env vars: create `.env` and restart `npm run dev`.
- Rebuild production assets after source edits: `npm run build`.
- If you change database structure, add migrations under `db/migrations/` and update Supabase functions as needed.

**Notes & Troubleshooting**
- If you see runtime DB errors about column names, confirm your Supabase schema matches the queries. The client expects column names used across `src/` (some legacy/compat fallbacks exist).
- For JSX/TS syntax errors during build, run `npm run dev` and check Vite/terminal output for file and line numbers.

**Deployment**
- This project can be deployed to Vercel, Netlify, or any static host that serves the `dist/` output and provides env var configuration for `VITE_` keys.
- If you use Supabase Edge Functions, deploy them via the Supabase CLI or the Supabase dashboard.

**Contributing**
- Fork or branch, make changes, and open a PR. Follow existing TypeScript and Tailwind conventions.

**License**
- No license file is present in this repo. Add a `LICENSE` if you wish to apply one.

**Contacts**
- Repo maintainer(s): check the repository settings or project owner for contact details.

---

If you'd like, I can also:
- Add a `.env.example` with the Vite env vars,
- Add a short `CONTRIBUTING.md` or `DEVELOPMENT.md` with common debugging steps,
- Run `npm run build` here to verify the codebase builds cleanly.

Tell me which of those you'd like next.
