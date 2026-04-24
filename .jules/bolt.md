## 2026-04-24 - [Database Optimization: Concurrent Queries]
**Learning:** Found sequential Prisma database queries that could be run concurrently using `Promise.all`. Additionally, a `.count()` query in `/api/jobs/route.ts` was executing without applying the same `where` filter as its corresponding `findMany()` query, throwing off the pagination logic entirely.
**Action:** Always verify that `.count()` methods use the identical filtering criteria as the data fetching queries they complement, and look for opportunities to parallelize independent data fetching operations to save I/O wait time.
