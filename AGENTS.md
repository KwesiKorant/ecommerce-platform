<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mandatory Engineering Principles & Operational Standards

1. **Zero Performance Cost Implementations:**
   - All interactive micro-interactions and transitions must run strictly on the compositor (`transform`, `opacity`) at 60/120 FPS.
   - Absolutely zero layout thrashing, unbatched DOM reads, or animating box-model geometry (`width`, `height`, `margin`, `padding`, `box-shadow`).
   - Use CSS containment (`contain: layout style`) and RAF drivers where applicable.

2. **No Loose Ends & Defect Prevention:**
   - Every implementation must be end-to-end complete: no stubbed handlers, dangling types, mock placeholders, or unhandled promise rejections.
   - All database mutations must be transactionally atomic and verified against the automated test suite.

3. **Preservation of Unrelated Components & Boundaries:**
   - Absolute surgical precision: maintain complete integrity of existing styles, routes, configurations, and schemas unrelated to the task.
   - No scope creep or arbitrary refactoring of stable code.

4. **Latency Vigilance & Proactive Architecture Flagging:**
   - Proactively evaluate and flag any potential latency injection (e.g., N+1 query patterns, unindexed database scans, waterfall fetches, unmemoized expensive calculations).
   - Whenever latency risks arise, recommend and execute professional, non-generic alternatives (e.g., composite indexes, atomic transactions, optimistic UI with rollback, bounded concurrency).

