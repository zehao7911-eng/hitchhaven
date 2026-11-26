# HITCHHAVEN

A miniature trailer-parking road trip. Hold down on the circular driving pad to reverse, up to drive, and drag sideways to steer. Releasing applies the brakes. Park the **trailer**, facing the indicated direction, inside the glowing bay and let it stop. The connected trailer has independent wheel bodies and a real pivot hitch; reversing can fold it, so drive forward to straighten it. Arrow keys / WASD and Space also work. Escape pauses.

Six finite sites: an original welcoming practice yard, a supermarket, parking deck, marina slipway, high street and campsite. Later sites use tighter bays, pillars, kerbs, a long boat trailer and caravan. Complete a stop for one star, avoid vehicle bumps for another, and finish within the site's generous par time for the third. Reading the opening scene does not consume par time. Improve your saved best instead of farming repeated currency. Six stars unlock Sunset paint, twelve unlock Gold. There is no paywall, purchase, real currency or required social interaction.

Short site-reveal cinematics, a moving wheel/steering rig, actual tow coupling, roof basket and strapped luggage, rear/brake/head lamps, curved trailer guide, tipped cones, shoved parked cars with hazard lamps, a cafe facade, softly lit miniature scenery, local synthesized music/engine/parking sounds and a confetti finish are included. Models are procedural meshes; no generated images or commercial models are downloaded. The setting and added presentation are an adaptation, not an exact reproduction of Rezona artwork. Vehicles and map foundations derive from the source below.

## Actual complete game source

Adapted directly from **Hitch & Park** by Krisztian Somoracz / NewKrok, in `docs/demos/hitch-park.js` at commit `76ab342568c24fbd37f12086775ed4bb2025337d`:

https://github.com/NewKrok/nape-js/blob/76ab342568c24fbd37f12086775ed4bb2025337d/docs/demos/hitch-park.js

It supplies the complete multi-body driving model, Ackermann front-wheel steering constraints, pivot hitch, trailer path prediction, collision listeners, goal checks, scoring, five source locations and Three.js mesh renderers. This is a substantive source adaptation, not merely a dependency reference. Nape runtime is the official `@newkrok/nape-js@3.43.5` npm distribution, with registry SHA512 integrity verified during preparation. Three.js is version 0.170.0. Full notices are retained in `licenses/NAPE-LICENSE.txt` (MIT plus original Nape BSD) and `licenses/THREE-LICENSE.txt` (MIT).

Rezona **Wreck & Rally** was actually played for miniature vehicle/site and physical-feedback reference: https://rezona.ai/game/pgcserver/pv/jhXPWpeh/v10/dist/index.html . Its demolition loop, media and source are not copied; trailer reverse parking comes from the separately licensed complete source game. The official Hitch & Park was also manually reversed/braked before selection. Neither reference was claimed fully completed.

## Running, offline package and rebuilding

`index.html` and `standalone.html` are identical, self-contained builds containing JavaScript, CSS, WebGL engine and icon. Open either in a current WebGL browser or upload the root directory to static hosting. No CDN, font, audio, login or SDK fetch is required. The ZIP contains a root `index.html`, the standalone entry, editable source, runtime vendors and license notices. `game.js` is the intermediate bundle, not a runtime network requirement.

For source development, serve this directory and open `index-source.html`. Rebuild with Python 3 and esbuild 0.25.0. Set `ESBUILD` to the path of the official esbuild executable, then run `python build.py`. Alternatively bundle `app.mjs` with esbuild using `--bundle --format=iife --target=es2022 --minify --legal-comments=inline` and use the Python packaging step. Run `node core-tests.mjs` and `node sdk-tests.mjs` for solver/progression and SDK mock coverage. The prepared executable is intentionally not distributed as part of the game.

## Own save and GameWave

Only `hitchhaven.profile.v1` is read/written locally. Best stars/scores, selected site, guide, sound, paint, one-time cosmetic claim flags and the current attempt are owned by this game. A checkpoint includes the actual chassis, four wheels, trailer, two trailer wheels, parked cars and cone poses. Reload settles the rig with zero velocity instead of resuming a dangerous acceleration. It resumes the same attempt; the next real driving input starts the new host session.

GameWave uses the raw JavaScript object envelope `{game:'hitchhaven',v:1,profile:...}`. Best results merge by maximum; local active progress and settings survive a late cloud load. Unknown/foreign cloud envelopes are not overwritten. Game start is emitted on the first actual throttle input and completion once on a true parked result. Pausing neither ends nor restarts the attempt. Explicit restart/site change closes a committed abandoned attempt and prepares a new one. Standalone startup does not await SDK discovery or registration. Registration failures, missing/partial/late methods, errors, timeouts and stale listeners are guarded.

Optional host rewards: a confirmed positive direct `onLike` callback unlocks Gold; a successful direct `onComment` callback, including empty image-only content, unlocks Sunset. Unlike gives nothing. Fields are read directly, with string `project_id`; `count` is not identity. Explicit flags prevent repeat rewards in the saved scope. Normal stars unlock both paints without host interactions. Local-only claims are device/browser scoped; cloud behavior depends on a supported host. The menu only advertises host rewards after successful registration. Cleanup unsubscribes even when registration settles late. Official November 24 SDK document was rechecked November 26.

## Verification scope

Actual browser native-touch completion of the first two stops, pause/reload continuation, earned paint selection and phone-sized layouts were checked. Node tests exercise the real Nape solver, all six goal fixtures and checkpoint constraints. Goal fixtures are simulated arrangements, not a claim to have manually driven every route. SDK tests and a browser-host fixture are mocks, not the supported GameWave App. Physical Android/iPhone performance and actual GameWave import/callback operation require testing in those environments; no claim of that certification is made. No unrelated legacy game is migrated by this delivery.
