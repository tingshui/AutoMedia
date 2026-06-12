# AutoMedia M0 Validation

## 1. User Request

Build and complete M0 from the AutoMedia MVP plan, using the independent validation agent workflow.

M0 scope from the plan: make the static demo runnable through a local app shell without changing the intended UX, and add a test harness that verifies the main view states.

## 2. Scope

Included:

- Define the local app shell command.
- Preserve the current demo visual design and navigation states.
- Add deterministic route/view handling for Home, Editor, Publishing, and Style Manager.
- Add a lightweight test harness for M0.
- Run user-level browser validation from the main thread.
- Have a validation agent independently review the plan before implementation and inspect the final artifacts after implementation.

Excluded:

- No database.
- No media import/probing.
- No AI editing logic.
- No real publish.
- No PRD scope expansion beyond M0.

## 3. Risks

- False pass by checking only static text instead of real view state.
- Home can accidentally show the editor sidebar or editor-only buttons.
- Editor navigation can break when route/reload behavior is added.
- Publishing or Style Manager can become unreachable.
- Test harness can pass while the browser UI is broken.

## 4. Main-Agent Plan Before Implementation

1. Add a project-level runnable app shell using local static serving.
2. Add documented scripts for serving and M0 verification.
3. Add URL hash routes for stable view state:
   - `#/home`
   - `#/editor`
   - `#/publishing`
   - `#/styles`
4. Define reload behavior: reload preserves the current hash route; no hash defaults to Home.
5. Add accessible state markers on the shell so automated checks can inspect active view without relying on visual text alone.
6. Add a M0 verifier that starts the local server, launches real headless Chrome through DevTools Protocol, executes JavaScript, clicks UI controls, and checks post-script DOM state.
7. Run browser validation in Chrome from the main thread because subagent browser routing may be limited in this environment.

## 5. Expected Outcome Matrix Before Implementation

| Case | Input / Action | Field Or Surface | Expected Before Test | Actual Observed | Verdict |
|---|---|---|---|---|---|
| C1 | Open `/` with no hash | Active view marker | `.app-shell` has `data-active-view="home"` | CDP verifier observed `home`; route normalized to `#/home` | PASS |
| C1 | same | Active view | `#homeView` is active and `#editorView`, `#publishingView`, `#styleManagerView` are inactive | CDP verifier observed only Home active | PASS |
| C1 | same | Sidebar | Sidebar computed display is `none` in Home mode | CDP verifier observed sidebar hidden | PASS |
| C1 | same | Topbar editor-only actions | Undo, redo, start auto-edit, export, save have computed display `none` | CDP verifier observed all `.topbar .editor-only` hidden | PASS |
| C1 | same | Page title | `AutoMedia 工作台` is shown in the title input | CDP verifier observed exact title value | PASS |
| C1 | same | Home modules | Recent videos, new video, style management, platform analytics, and comments sections are present | CDP verifier observed all five `data-testid` modules | PASS |
| C2 | Open `/#/editor` | Active view marker | `.app-shell` has `data-active-view="editor"` | CDP verifier observed `editor` | PASS |
| C2 | same | Active view | Editor view is active | CDP verifier observed only Editor active | PASS |
| C2 | same | Sidebar | Sidebar is visible | CDP verifier observed sidebar visible | PASS |
| C2 | same | Editor-only actions | Undo, redo, start auto-edit, export, save are visible | CDP verifier observed all editor-only actions visible | PASS |
| C2 | same | Edit step dropdown | Video editing step dropdown is open and `aria-expanded="true"` | CDP verifier observed `aria-expanded="true"` | PASS |
| C2 | same | Editor tabs | Add Video, Effects, Audio Effects, Subtitles, Background Music, Text, Stickers, and Transitions tabs are present | CDP verifier observed all eight tab labels | PASS |
| C3 | From Editor, click Home in sidebar | Active view | Home view becomes active | CDP verifier clicked Home and observed Home active | PASS |
| C3 | same | Sidebar | Sidebar disappears after returning Home | CDP verifier observed sidebar hidden | PASS |
| C3 | same | URL route | Route becomes `#/home` | CDP verifier observed `#/home` | PASS |
| C4 | From Editor, click Video Publishing | Active view | Publishing view becomes active | CDP verifier clicked Publishing and observed Publishing active | PASS |
| C4 | same | URL route | Route becomes `#/publishing` | CDP verifier observed `#/publishing` | PASS |
| C4 | same | Publishing tabs | Title, cover, platform, and scheduling tabs are present | CDP verifier observed all four publishing tab labels | PASS |
| C4 | same | Sidebar | Sidebar remains visible in Publishing view | CDP verifier observed sidebar visible | PASS |
| C4 | same | Topbar editor-only actions | Undo, redo, start auto-edit, export, save are hidden | CDP verifier observed all editor-only actions hidden | PASS |
| C5 | Open `/#/styles` | Route mapping | `#/styles` maps to Style Manager view | CDP verifier observed Style Manager active | PASS |
| C5 | same | Active view marker | `.app-shell` has `data-active-view="styles"` | CDP verifier observed `styles` | PASS |
| C5 | same | Sidebar options | Only Home navigation is visible; Video Editing and Video Publishing nav buttons are hidden | CDP verifier observed Home nav visible and Editor/Publishing nav hidden | PASS |
| C5 | same | Style memory card | Style Memory card is hidden | CDP verifier observed Style Memory hidden | PASS |
| C5 | same | Topbar editor-only actions | Undo, redo, start auto-edit, export, save are hidden | CDP verifier observed all editor-only actions hidden | PASS |
| C6 | Open unknown hash `/#/unknown` | Fallback behavior | Route normalizes to `#/home` and Home view is active | CDP verifier observed `#/home` and Home active | PASS |
| C7 | Reload `/` | Reload behavior | Home view remains/defaults active | CDP verifier reloaded `/` and observed Home active | PASS |
| C7 | Reload `/#/editor` | Reload behavior | Editor view, sidebar, editor actions, and edit-step dropdown are preserved | CDP verifier observed all preserved after reload | PASS |
| C7 | Reload `/#/publishing` | Reload behavior | Publishing view remains active and editor-only actions remain hidden | CDP verifier observed Publishing active and editor-only hidden | PASS |
| C7 | Reload `/#/styles` | Reload behavior | Style Manager remains active with simplified sidebar | CDP verifier observed Style Manager active with simplified sidebar | PASS |
| C8 | From Home, click recent video card | User path | Editor view becomes active and route becomes `#/editor` | CDP verifier clicked first recent card and observed Editor + `#/editor` | PASS |
| C9 | From Home, open New Video modal and confirm | User path | Modal closes, Editor view becomes active, route becomes `#/editor`, success toast appears | CDP verifier observed modal open, then Editor + `#/editor` + success toast | PASS |
| C10 | From Home, click Style Manager entry | User path | Style Manager view becomes active and route becomes `#/styles` | CDP verifier clicked entry and observed Style Manager + `#/styles` | PASS |
| C11 | From Style Manager, click Home nav | User path | Home view becomes active, route becomes `#/home`, sidebar disappears | CDP verifier clicked Home and observed Home + `#/home` + hidden sidebar | PASS |
| C12 | Run `npm run serve` | Serve command | Starts static server on documented default `127.0.0.1:4173` and serves `index.html` | Command printed `AutoMedia demo running at http://127.0.0.1:4173`; server was then stopped | PASS |
| C13 | Run `npm run verify:m0` | Browser verifier | Starts/stops its own server, launches Chrome, executes JS, clicks controls, exits 0 only if all DOM checks pass | Command exited 0 with `AutoMedia M0 browser verification passed.` | PASS |

## 6. Validator Plan Critique

Verdict: `needs_plan_changes`.

The M0 plan is directionally aligned with the MVP plan, but the current expected outcome matrix can still false-pass. Required changes before implementation:

1. Replace the C7 HTTP/scaffolding verifier with a browser-executed verifier. Hash routes are client-side state; `GET /#/editor` returns the same static HTML as `/`, so an HTTP-only verifier cannot prove active view, hidden sidebar state, `aria-expanded`, or route preservation. The M0 verifier must run JavaScript in a real browser engine or equivalent DOM runtime and assert the post-script DOM state for each route.
2. Add exact script/command expectations. The plan says local app shell and documented scripts, but does not name the commands, ports, or success criteria. The matrix should specify the expected serve command, verify command, and whether the verifier starts/stops its own server.
3. Add direct user-entry paths, not only direct hashes:
   - Click a recent video card from Home enters Editor and updates the route to `#/editor`.
   - Open New Video modal, confirm, enters Editor and updates the route to `#/editor`.
   - Click Style Manager entry from Home enters Style Manager and updates the route to `#/styles`.
   - From Style Manager, click Home returns to sidebar-free Home and route `#/home`.
4. Add negative checks for each non-editor view:
   - Home, Publishing, and Style Manager must not expose editor-only topbar actions.
   - Home must not leave editor sidebar DOM visible.
   - Style Manager must hide Video Editing, Video Publishing, and the Style Memory card, while keeping only Home navigation visible.
5. Clarify route contract and naming. The planned route is `#/styles`, while the existing view key is `styleManager`. The expected matrix should explicitly map `#/styles` to Style Manager and define fallback behavior for unknown hashes, preferably Home plus `#/home` normalization or documented no-normalization.
6. Add reload coverage for all stateful routes, not only Publishing:
   - Reload `/#/editor` preserves Editor, sidebar, editor actions, and expanded edit-step dropdown.
   - Reload `/#/styles` preserves Style Manager with simplified sidebar.
   - Reload `/` defaults to Home.
7. Define the accessible state markers precisely. The plan says accessible markers will be added, but the validator needs exact expected markers such as `data-active-view="home|editor|publishing|styles"` on the app shell, or equivalent ARIA/current-state attributes. Vague marker language leaves too much room for post-hoc acceptance.
8. Add no-UX-regression checks for current demo affordances inside M0 scope:
   - Editor retains the eight tool tabs.
   - Publishing retains the four required tabs.
   - Home retains the five visible modules from the PRD: recent videos, new video, style management, platform analytics, comments.
9. Split smoke and acceptance. A static smoke check can verify files/scripts exist, but M0 completion must require browser-level assertions for route/view state. The matrix should label static checks as supporting evidence only.

## 7. Agreed Plan

Revised after validator critique:

1. Add `package.json` scripts:
   - `npm run serve`
   - `npm run verify:m0`
2. Add `scripts/serve.mjs`, a dependency-free static server on `127.0.0.1:4173` by default.
3. Add `scripts/verify-m0.mjs`, a dependency-free browser verifier that:
   - starts the static server,
   - launches Chrome headless,
   - controls Chrome through DevTools Protocol,
   - opens and reloads all M0 routes,
   - clicks the user-facing navigation paths,
   - checks real computed DOM state after app JavaScript runs.
4. Add route contract:
   - no hash or `#/home` -> Home,
   - `#/editor` -> Editor,
   - `#/publishing` -> Publishing,
   - `#/styles` -> Style Manager,
   - unknown hash -> normalize to `#/home`.
5. Add `.app-shell[data-active-view="home|editor|publishing|styles"]` as the primary state marker.
6. Keep M0 visual/UX behavior intact; no database/media/AI work.

## 8. Implementation Summary

Changed artifacts:

- `package.json`: added `npm run serve` and `npm run verify:m0`.
- `scripts/serve.mjs`: dependency-free static app server on `127.0.0.1:4173`.
- `scripts/verify-m0.mjs`: dependency-free M0 browser verifier using headless Chrome and DevTools Protocol.
- `index.html`: added stable `data-active-view` and `data-testid` markers for M0 verification.
- `src/app.js`: added hash route contract, reload preservation, unknown-route fallback, and app-ready marker.
- `README.md`: documented local serve and M0 verification commands.
- `docs/validation/automedia_m0_validation.md`: shared validation artifact for plan, implementation, and results.

No database, media, AI, or publishing integration was added.

## 9. Final Validation Transcript

Main-thread validation commands:

```bash
npm run verify:m0
```

Result:

```text
AutoMedia M0 browser verification passed.
```

The command required elevated/local execution because it binds a localhost port and launches headless Chrome. Initial sandbox execution failed with `listen EPERM: operation not permitted 127.0.0.1:4173`; elevated execution passed.

Serve command:

```bash
npm run serve
```

Observed:

```text
AutoMedia demo running at http://127.0.0.1:4173
```

The server process was stopped after the check. `lsof -nP -iTCP:4173 -sTCP:LISTEN` returned no listener afterward.

## 10. Open Issues

None known for M0.

Final validator noted one non-blocking verifier hardening issue: the verifier checked editor-only action visibility but did not assert the exact count of five editor-only actions. The main agent fixed this by asserting `state.editorOnlyVisible.length === 5` in Home, Editor, Publishing, and Style Manager expectations, then reran `node --check scripts/verify-m0.mjs` and `npm run verify:m0`; both passed.

## 11. Final Verdict

Main agent verdict: PASS.

Validator verdict: PASS.

M0 is complete. Browser-level validation was performed with the project CDP verifier using real headless Chrome. The validator independently inspected artifacts and also ran `npm run verify:m0`, `npm run serve`, and `curl -s -I http://127.0.0.1:4173/`.
