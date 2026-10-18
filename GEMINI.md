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
