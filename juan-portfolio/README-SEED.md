# Seed & test instructions

1. Ensure `.env` has `DATABASE_URI` pointing to your MongoDB for dev/test.

2. Create unique index for users slug (recommended):

```bash
pnpm run create-index
```

This creates a unique partial index on `users.slug` where `slug` exists.

3. Seed pages (idempotent):

```bash
pnpm run seed
```

This will insert `home`, `blog`, `case-studies` and a sample case-study if they don't exist.

4. Run tests (integration/unit):

```bash
pnpm run test:int -- --run
```

Notes:

- Tests assume a database reachable from `DATABASE_URI`. It's recommended to use a dedicated test DB to avoid collisions with production/dev data.
- The code contains a robust slug hook for `users` to avoid accidental duplicate slugs; it's still recommended to create the unique index for full protection.
