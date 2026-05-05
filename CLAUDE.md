# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (watch mode)
npm run start:dev

# Build
npm run build

# Run tests
npm run test

# Run a single test file
npm run test -- --testPathPattern=<filename>

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Environment Variables

The app loads `.env.development` (or `.env.<NODE_ENV>`) then falls back to `.env`. Required variables:

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection |
| `POSTGRES_SSL` | Set to `"true"` to enable SSL for the DB connection |
| `JWT_ACCESS_SECRET` | Signs short-lived access tokens (15 min expiry) |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (7 day expiry) |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_AUTH_API` | IGDB OAuth via Twitch |
| `IGDB_API` | IGDB base API URL |
| `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_KEY` | Supabase Storage for avatar uploads |

## Architecture

This is a NestJS REST API for a game-tracking social app. TypeORM is used with PostgreSQL (`synchronize: true` — schema changes apply on startup).

### Modules

- **AuthModule** — Register/login/refresh. Issues a JWT access token (15 min) and refresh token (7 days). Depends on `UsersModule` and `SecurityModule`.
- **SecurityModule** — Houses `JwtModule`, `AuthGuard`, and `PasswordService`. Exported so other modules can use JWT and the guard. `AuthGuard` is applied globally and checks for `@IsPublic()` decorator to skip auth.
- **UsersModule** — CRUD for the `User` entity, password changes, and avatar uploads (via Supabase Storage). Each user gets a unique `friendCode` generated on registration.
- **GamesModule** — Per-user game library. Games have a status enum (`playing`, `completed`, `wishlist`, `paused`) and an optional `gameTitleId` linking to IGDB.
- **FriendsModule** — Friend request flow (send by friend code → accept/reject) and friendship management. The `Friendship` table enforces `user1Id < user2Id` via DB CHECK constraints to prevent duplicate pairs.
- **IgdbModule** — Searches the IGDB API for game titles. Manages a cached Twitch OAuth token (auto-refreshed 5s before expiry).

### Auth flow

All routes are protected by `AuthGuard` (registered globally in `SecurityModule`). Mark public routes with `@IsPublic()`. The guard sets `req.user = { id }` from the JWT payload. Use `@CurrentUser()` decorator to extract the user id in controllers.

> Note: `AuthMiddleware` (`src/middlewares/AuthMiddleware.ts`) is an older middleware approach and is no longer wired up — `AuthGuard` is the active auth mechanism.

### Key patterns

- `password` column uses `{ select: false }` — must use `addSelect("user.password")` in QueryBuilder to load it.
- Mutations to the user's game list (create, delete, update) always return the full updated game list.
- Friendship operations normalize `[userAId, userBId].sort()` before writing to satisfy the `user1Id < user2Id` constraint.
