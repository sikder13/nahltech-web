# nahltech-web — Project Instructions

Official website of Nahl Technologies Inc. This repo is ALSO a portfolio
piece: prospects will read this code. Quality bar is "flagship work sample."

## Stack (locked — do not substitute)
Next.js 15 App Router · TypeScript strict · Tailwind · Framer Motion ·
Supabase (Postgres + Edge Functions) · Resend · Anthropic API (chat) ·
Upstash Redis (rate limits) · MDX in content/blog/ · Vercel.

## Hard rules
1. NO credentials in code, ever. Env vars only. `.env*` is gitignored.
2. NO file over 5MB committed. No videos, no APKs, no raw images.
3. The Supabase service role key is server-only. Any file importing
   lib/supabase/server.ts must have `import 'server-only'` at the top.
4. anon role: INSERT-only on chat/subscribe tables. NEVER add an anon
   SELECT policy to any table. Reads happen server-side.
5. Every public API route is rate-limited (lib/rate-limit.ts) and
   zod-validated server-side before any external call.
6. Lead-loss is unacceptable: if a lead insert fails, log it, fire the
   fallback email, and still show the user a success state.
7. Every anchor href resolves to a real element. No dead #fragments.
8. All animation respects prefers-reduced-motion.
9. Accessibility is not optional: keyboard nav, focus management,
   WCAG AA contrast, semantic HTML, alt text.
10. Schema changes ONLY via numbered files in supabase/migrations/.

## Conventions
- Conventional commits (feat:, fix:, chore:, docs:).
- Small PRs per phase; CI (lint + typecheck + build) must be green.
- Components: layout/ conversion/ blocks/ seo/ ui/ per ARCH-1 §3.
- All UI strings come from lib/i18n/dictionaries/ — no hardcoded copy
  in components, even though only `en` ships at launch.
- English routes are UNPREFIXED; /ar and /bn return 404 until content
  exists. Never machine-translate locale content.
- Metadata via generateMetadata; OG images via file convention
  (opengraph-image.tsx), never a static /og-image.png path.

## Definition of done, every task
npm run lint ✓ · npx tsc --noEmit ✓ · npm run build ✓ ·
acceptance criteria in the task prompt verified and stated back.

## Reference
Full architecture: ARCH-1 (docs/ARCH-1-system-architecture.md once added).
When a decision isn't covered there or here, choose the boring,
verifiable option and note the decision in the PR description.
11. Commit messages: conventional commits, written as the project author.
    NEVER include AI attribution of any kind — no "Generated with",
    no Co-Authored-By trailers, no mention of Claude, Claude Code,
    Cursor, or any AI tool in commits, PR titles, PR descriptions,
    code comments, or file headers.
12. Page copy: build structure with [PLACEHOLDER: description] markers.
    NEVER invent product facts, statistics, client claims, or pricing.
    Real copy is provided by the founder after explicit approval —
    if copy for a section hasn't been provided, it stays a placeholder.
