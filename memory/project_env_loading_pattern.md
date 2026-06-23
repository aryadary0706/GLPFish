---
name: project-env-loading-pattern
description: GLPFish backend uses ESM with dotenv loaded at server.js body — modules that read process.env at module-load time must call dotenv.config themselves
metadata:
  type: project
---

In the GLPFish backend, `server.js` calls `dotenv.config({ path: '.env.local' })` in its body, AFTER all `import` statements. Because Node ESM evaluates imported modules' top-level code BEFORE the importer's body runs, any backend lib that does `const X = process.env.FOO` at module scope will see `undefined` unless it calls `dotenv.config()` itself first.

**Why:** Found via "Predict Error: 503" bug where `backend/src/lib/model.js` read `FISH_MODEL_API_URL` at module load → undefined → fetch fell over → checkModelHealth returned false → controller threw 503. `backend/src/lib/supabase.js` works because it calls `dotenv.config({ path: '.env.local' })` itself at top.

**How to apply:** When adding a new backend lib that reads env vars, either (a) call `dotenv.config({ path: '.env.local' })` at the top of the file like `supabase.js` does, or (b) read env vars lazily inside functions (preferred for testability). Don't rely on `server.js`'s dotenv call. The fix in `model.js` did both: load dotenv at top + a `getModelUrl()` helper that reads at call time.
