# Planner TEST

Permanent QA staging of the Energy Planner. Origin: jousille/inamora branch fix/planner-habits-energy (2026-11-24).

**Test site:** https://jousille.github.io/planner-test/ — enable **Settings → Pages → Deploy from a branch → main → / (root)** if not already enabled.

## Safety
- No Supabase endpoints, no production login, no device rebinding.
- Test authentication uses the fixed SANDBOX identity; real codes are not requested.
- All app data is stored under `planer_test_SANDBOX_*` instead of the production prefix.
- Import accepts planner backups v1 and v3. It copies only recognized keys into the sandbox.
- All data remains local to the browser; **never commit real backup JSON to GitHub**.
- The PWA service worker only controls the `/planner-test/` scope and deletes only its own caches.
- Contains demonstration habits and task scores on the first visit.

Run automated regression tests with `node --test tests/db.test.cjs`.
