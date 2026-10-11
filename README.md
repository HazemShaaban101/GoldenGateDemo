# Golden Gate · IoT Platform

> **Current build:** runs on its own equipment data (no gateway or Galaxy needed) behind a local sign-in
> (`administrator` / `000000`, see `src/gateway/auth.ts`). The **Integration** system (`src/screens/integration`,
> `src/model/integration.ts`) shows the hand-off to the CRM: feed status, delivery KPIs and a KPI
> dashboard for each use case. The sections below describe the earlier gateway-backed build, which this version replaces.
>
> Run: `npm install`, `npm run dev` (port 5180) or `npm run build && npm run preview` (port 5181).


The operations platform for the Golden Gate mall: one screen for every system on site (fire, electric,
metering, plumbing, HVAC, security, community and maintenance), with a 3D campus that drills down
from the whole project to a building, a floor, and a single piece of equipment.

It is a React app, separate from the gateway's own dashboard. It talks to the AVEVA Galaxy only through
the OPC UA gateway's HTTP API, with the same Galaxy sign-in.

| | |
|---|---|
| Stack | React 19, TypeScript, Vite, Tailwind v4, framer-motion, react-three-fiber, zustand |
| Screen | A fixed 1920×1080 stage, scaled to fit any display (16:9, letterboxed otherwise) |
| Live from the Galaxy | FAHU-01 (HVAC › AHU and the 3D equipment view) and the FCUs on the floor plan, including writes |
| Simulated | Everything else. Values follow realistic daily profiles and are deterministic: every screen and every viewer sees the same numbers at the same moment |

---

## Run it

Double-click **`run-golden-gate.bat`** in the repository root. It builds the web app, starts the OPC
UA gateway (from source, in its own window) serving the platform on http://localhost:5000, and opens
it in Chrome. Sign in with a Galaxy user. Close the "Golden Gate - OPC gateway" window to stop it.

- The Galaxy's OPC UA server address is `OPC_URL` at the top of the batch file (it overrides
  `OpcUa:EndpointUrl` in `src/OpcGateway/appsettings.json`).
- Needs the .NET 10 SDK, Node.js 20+ and Chrome (it falls back to the default browser).
- Running it again while the platform is up just opens it. `--no-browser` skips the browser.

## Develop it

The gateway must be running (see the root [README](../README.md)); `/api` is proxied to it.

```bash
npm install
npm run dev            # http://localhost:5180
```

- The gateway address defaults to `http://localhost:5000`. Change it with `VITE_GATEWAY_URL` in
  `.env` (see `.env.example`).
- `http://localhost:5180/?preview` opens the platform **without** signing in, for layout work.
  Simulated screens work; live Galaxy widgets show "connecting". This exists only in development
  builds.
- `npm run build` type-checks and builds to `dist/`. `npm run preview` serves that build on
  :5181, with the same `/api` proxy, to check a build before shipping it.
- `npm run lint` runs oxlint.

## Ship it

The gateway serves one web UI next to its API. Golden Gate is built so that UI can be Golden Gate. Same
origin means the Galaxy login cookie just works, and nothing else needs installing on the client.

**Option 1: publish the gateway with Golden Gate inside (recommended).** Point the gateway's
publish at this folder instead of `dashboard/`:

```bash
dotnet publish src/OpcGateway -p:PublishProfile=win-x64 "-p:DashboardRoot=C:\path\to\NewOPCToAPIGateway\golden-gate\\"
```

`DashboardRoot` must be an absolute path ending in a backslash. The output is the usual
`OpcGateway.exe` + `appsettings.json` + `wwwroot/`, with Golden Gate in `wwwroot/`. Deploy it exactly
as the root README describes. Set `OpcUa:EndpointUrl` in `appsettings.json` to the Galaxy's OPC UA
server.

**Option 2: an existing gateway install.** Run `npm run build`, then either copy `dist/*` into the
`wwwroot/` folder next to `OpcGateway.exe`, or point the gateway at the build with
`Hosting:UiPath` (e.g. the environment variable `Hosting__UiPath=D:\golden-gate\dist`). Restart the
gateway.

**Option 3: behind a reverse proxy** (IIS, nginx) that serves `dist/` and forwards `/api/` to the
gateway on the same host name. Two requirements:

- Unknown paths must fall back to `index.html` (client-side routes such as `/site/a02/gf`).
- Response buffering must be off for `/api/.../stream`, which is Server-Sent Events. In nginx use
  `proxy_buffering off;`.

Don't host the app on a different site from the gateway. The login cookie is `SameSite=Strict`, so a
page on another domain can't use the Galaxy session (`VITE_API_BASE_URL` and `Hosting:CorsOrigins`
only help between origins of the same site).

Caching: files under `assets/` are content-hashed and can be cached forever. `index.html` must
always be revalidated. The gateway already does both.

### Things to know about the gateway

- **One sign-in at a time.** The gateway holds a single Galaxy session. Signing in from a second
  browser replaces the first one, which returns to the login portal.
- **Local only by default.** The gateway listens on `localhost`. A wall display on another machine
  needs its own gateway, or `Hosting:ListenOnAllInterfaces`. Read the root README's warning first.
- **Writes** (FCU on/off, fan speed, fan mode, setpoint) require `Write:Enabled=true` on the gateway
  and write permission for the signed-in Galaxy user. The controls send the **command** attributes
  and show the commanded value. The equipment's own feedback (`*_Status`) is shown separately, with a
  note while the two differ.

## Connecting more Galaxy equipment

All Galaxy knowledge lives in [`src/model/galaxyBindings.ts`](src/model/galaxyBindings.ts); screens
never contain attribute names.

| To | Change |
|---|---|
| Add an AHU built from the same template | One more entry in `AHU_UNITS` (`galaxy` = the Galaxy object name, plus its building and floor) |
| An AHU template with other attribute names | A new `Record<AhuRole, string>` like `FAHU_TEMPLATE`, used by that unit's `attrs` |
| FCU attribute names | `FCU_TEMPLATE` |
| FCU fan-mode labels | `FCU_FAN_MODES` (currently 0 = Cooling, 1 = Heating, 2 = Auto) |
| Galaxy area name of each floor | `FLOOR_AREAS`. The floor plan binds a floor's FCU markers to the FCUs in that area, in order, and cycles if there are more markers than FCUs |

FCU markers on the plan are listed in `PLAN_DEVICES` in [`src/model/site.ts`](src/model/site.ts).

## How it is organised

```
src/
  app/          routes, the page chrome and page transitions
  auth/         login portal and the gate that keeps the platform behind the Galaxy sign-in
  gateway/      API client, SSE, live Galaxy objects, attribute search and writes
  model/        navigation (systems and subsystems), the site (buildings, floors, devices), Galaxy bindings
  sim/          deterministic signals, the shared clock, event streams, scenarios (fire drill), KPI scope
  components/   the design system: panels, gauges, charts, controls, icons, tables, map, camera tiles
  widgets/      panel bodies bound to a data source (simulated signal, Galaxy point, or fixed value)
  screens/      one file per system; screens/registry.tsx maps each route to its screen
  equipment/    the procedural 3D FAHU and its data binding
  stage/        the fixed 1920×1080 stage
```

**Adding a screen.** Add the subsystem to `SYSTEMS` in `model/navigation.ts` (this creates its tab),
write the screen from `Panel` + widgets using the grid helpers `row()` / `stack()` in
`screens/layout.ts`, and register it in `screens/registry.tsx`. Unregistered subsystems show a
"coming soon" page instead of breaking.

**Simulated data.** Signals are declared once in `sim/catalog.ts` (unit, low/high, daily profile,
noise). Screens read them with `useSignal` or a widget `source={{ sim: 'id' }}`. Extensive values
(energy, water, people) are split across buildings when the KPI scope is a single building. Logs and
feeds (access swipes, plate reads, tickets, social posts) come from `sim/events.ts`: the same slot
always produces the same event, so the history doesn't change on reload.

**KPI scope.** From the home page every vertical shows the whole project. Entering a building scopes
every vertical to that building until you go home or choose another scope in the bar under the
header. The current scope is always named on screen.
