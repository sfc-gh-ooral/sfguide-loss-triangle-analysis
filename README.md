# Loss Triangle Analysis

Help P&C reserving teams spot unusual loss development before quarter-close. The app shows chain-ladder paid loss
triangles, flags link ratios outside 1.5 standard deviations, answers questions with a Cortex Agent, and drafts
segment insights with AI_COMPLETE.

This is a Snowflake example on **synthetic data**: a Next.js app with a no-account Sample mode and a Live mode backed by
Snowflake views, a Cortex Agent (Cortex Analyst over a semantic view), and `AI_COMPLETE`.

**[Try the hosted example](https://sfc-gh-ooral.github.io/sfguide-loss-triangle-analysis/try/)** · **[Guide](https://sfc-gh-ooral.github.io/sfguide-loss-triangle-analysis/)**

> Synthetic data and illustrative chain-ladder logic only. This is not actuarial, reserving, or regulatory advice.
> AI-generated text needs review by a qualified actuary.

## What it does

| Screen | What you see | Snowflake capability (Live mode) |
| --- | --- | --- |
| Dashboard | Reported, IBNR, and ultimate KPIs, collision paid development by accident year, prior-to-current reserve bridge, anomaly flags | Views `V_PORTFOLIO_KPIS`, `V_RESERVE_WATERFALL`, `V_ANOMALIES` (a SQL rule, not a model) |
| AI Agent | Ask questions about triangles, IBNR, segments, and anomalies; staged progress steps; measured latency on live answers | Cortex Agent `LOSS_TRIANGLE_AGENT` with Cortex Analyst over semantic view `LOSS_TRIANGLE_SV`, running on `LOSS_TRIANGLE_WH` |
| Triangle Explorer | Five 8×8 paid triangles with link ratios, 3- and 5-year averages, selected LDFs, CDFs, ultimates, and IBNR | Tables `PAID_LOSS_TRIANGLES`, `SELECTED_FACTORS`, `TAIL_FACTORS` |
| Segment Analysis | Coverage or vehicle-tier comparison, LDF bar chart, side-by-side triangles, and three AI-drafted insights | `AI_COMPLETE` with bind variables and structured output, on facts read from the views |
| Consistency Test | One set of selection rules applied to every triangle, compared with prior carried ultimates | Chain-ladder recalculation in the browser on triangles loaded from Snowflake; no AI |
| Sample / Live switch | Header switch that shows which mode is on. Sample keeps the bundled data even with a connection; Live with no connection shows setup steps instead of asking for credentials | `/api/mode` reports whether `.env.local` is configured; live calls never fall back to sample data |

### Story on this synthetic data set

On the three overall triangles, reported paid is $3,320.3M, IBNR $382.2M, and ultimate $3,702.5M, up $110.9M (3.1%)
from prior. The anomaly rule flags 16 link ratios across the five triangles; 15 are in AY 2020 (a low first year, then a
fast catch-up). Collision Tier 1 develops more than Tier 2 at every early age (12→24 selected LDF 1.423 vs. 1.318).
Sample mode reproduces these numbers exactly; they are the same values `sql/setup.sql` loads.

## Prerequisites

| | |
| --- | --- |
| Sample mode | Node.js **20.19+ or 22.12+** (required by Tailwind CSS 4) and npm. Nothing else. |
| Live mode: edition | Any edition with Cortex AI. Tested on Enterprise Edition; no Enterprise-only feature is used. |
| Live mode: features | Cortex Agents, Cortex Analyst, semantic views, and `AI_COMPLETE`. The default model for insights is `claude-sonnet-4-5`; if it isn't available in your region, enable [cross-region inference](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cross-region-inference) or set `SNOWFLAKE_COMPLETE_MODEL`. The agent's orchestration model is `auto` (chosen by Snowflake). |
| Live mode: role | `ACCOUNTADMIN` for the short account-level block in `sql/setup.sql` (create the role, grant `SNOWFLAKE.CORTEX_USER`). Objects are created as `SYSADMIN`. The app connects as the read-only `LOSS_TRIANGLE_ROLE`. |
| Preview features | None. |
| Tested | Next.js 16.3, Node 22.23, snowflake-sdk 3.4, on an Enterprise account in AWS US East 1, November 2026 |

## Quick start: no account

```bash
git clone https://github.com/sfc-gh-ooral/sfguide-loss-triangle-analysis.git
cd sfguide-loss-triangle-analysis
npm install
npm run dev
```

Open http://localhost:3000. With no `.env.local`, the app uses the bundled synthetic triangles, and every AI output is
labeled **Sample AI response**. Scripted answers arrive after 4 to 8 seconds with the same progress steps as a live call.

## Live mode: deploy to your account

1. **Run the setup.** In a Snowsight SQL worksheet, paste [`sql/setup.sql`](sql/setup.sql) and run all, then do the same
   with [`sql/cortex-agent.sql`](sql/cortex-agent.sql). No edits or find-and-replace. The second script ends with a test
   question to the agent, run as `LOSS_TRIANGLE_ROLE`.
2. **Create a key pair** for the user that ran setup (setup grants that user `LOSS_TRIANGLE_ROLE`). Keep the key outside
   the repository:

   ```bash
   mkdir -p ~/.snowflake/keys
   openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out ~/.snowflake/keys/loss_triangle_key.p8 -nocrypt
   openssl rsa -in ~/.snowflake/keys/loss_triangle_key.p8 -pubout
   ```

   ```sql
   -- Uses the second key slot so an existing key is not replaced. Check DESC USER first.
   ALTER USER <YOUR_USER> SET RSA_PUBLIC_KEY_2 = '<public key body without header lines>';
   ```

3. **Configure the app.** Copy `.env.example` to `.env.local` (gitignored) and fill in your account identifier
   (`<org>-<account>`), user, and key path. The database, schema, warehouse, role, and agent names are already set.
4. **Run it.** Run `npm run dev`. The header switch defaults to **Live**. AI outputs carry **Powered by … (live)** badges
   with the measured latency. If a live call fails, the screen shows the error; it never substitutes sample data.

The app connects as `LOSS_TRIANGLE_ROLE` and uses bind variables for every user-supplied value.

### Objects created

| Object | Name | Notes |
| --- | --- | --- |
| Role | `LOSS_TRIANGLE_ROLE` | Read-only: USAGE on the warehouse, database, and schema; SELECT on tables, views, and the semantic view; USAGE on the agent; `SNOWFLAKE.CORTEX_USER`. Granted to you and to SYSADMIN. |
| Warehouse | `LOSS_TRIANGLE_WH` | XSMALL, `AUTO_SUSPEND = 60`, `AUTO_RESUME`, starts suspended |
| Database, schema | `LOSS_TRIANGLE_EXAMPLE.LOSS_TRIANGLES` | Owned by SYSADMIN |
| Tables | `PAID_LOSS_TRIANGLES` (204 rows), `SELECTED_FACTORS` (35), `TAIL_FACTORS` (5), `PRIOR_ULTIMATES` (40) | Synthetic, deterministic seed data |
| Views | `V_LINK_RATIOS`, `V_CDFS`, `V_ULTIMATES`, `V_PORTFOLIO_KPIS`, `V_RESERVE_WATERFALL`, `V_ANOMALIES` | The chain-ladder logic, readable as SQL |
| Semantic view | `LOSS_TRIANGLE_SV` | Paid losses, ultimates, and anomaly flags for Cortex Analyst |
| Cortex Agent | `LOSS_TRIANGLE_AGENT` | One tool: Cortex Analyst on `LOSS_TRIANGLE_SV`, executing on `LOSS_TRIANGLE_WH` |

Setup changes nothing that already exists.

**Cleanup:** run [`sql/cleanup.sql`](sql/cleanup.sql). It drops the database (with its tables, views, semantic view, and
agent), the warehouse, and the role. If you registered a key only for this example, also run
`ALTER USER <YOUR_USER> UNSET RSA_PUBLIC_KEY_2;`.

### Expected cost and time

Measured in our test on XSMALL, November 2026. Yours will differ.

- **Setup:** `sql/setup.sql` about 24 s and `sql/cortex-agent.sql` about 8 s (including its test question).
- **Warehouse:** setup run three times plus a session of about 230 queries (all screens, 10 agent questions, several
  insight generations) used **0.32 credits**.
- **Cortex Agent:** 9 agent requests used **0.94 Cortex credits**, about 0.1 per question.
- **AI_COMPLETE:** billed by tokens; each insight call sends a short prompt (well under 1,000 tokens). Check
  `SNOWFLAKE.ACCOUNT_USAGE.CORTEX_FUNCTIONS_USAGE_HISTORY` and `CORTEX_AGENT_USAGE_HISTORY` for your usage; those views
  can lag by a few hours. See the [Service Consumption Table](https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf) for rates.
- **Measured latency** from the app server: data screens 0.2–3.5 s (first call includes connecting), segment insights
  7–9 s, agent answers 25–33 s.

## Known limitations

- **Sample answers are scripted.** In Sample mode, chat answers are matched by keyword to eight scripted answers, so an
  off-script question gets the closest one. They're labeled **Sample AI response**.
- **Small, paid-only data.** Five 8×8 paid triangles (AY 2017–2024, 12–96 months): collision overall, Tier 1, Tier 2,
  comprehensive, and liability. No incurred losses, case reserves, claim counts, exposures, or premium.
- **Chain-ladder only.** Selected LDFs and tail factors are fixed inputs. No Bornhuetter-Ferguson, Cape Cod, Mack, or
  bootstrap methods, and no tail fitting.
- **Totals use the overall triangles.** Tier 1 and Tier 2 split collision overall, so portfolio totals add only the three
  overall triangles. Projected separately, the two tiers sum to $2,104.9M versus $2,100.6M for collision overall.
- **Synthetic prior ultimates.** Prior ultimates were set at 97% of current, so every triangle shows about +3.1% versus prior.
- **The anomaly flag is a simple rule.** `V_ANOMALIES` flags link ratios more than 1.5 sample standard deviations from the
  period mean. It's computed in SQL, not by a Cortex model, and on this data 15 of its 16 flags are AY 2020.
- **The Consistency Test runs in the browser.** It recomputes ultimates from the loaded triangles; it doesn't write back.
- **Live AI answers vary run to run and can be wrong.** In testing, `AI_COMPLETE` once described a higher LDF as faster
  development until the prompt defined the term. Review every AI statement against the triangles.

## Customize with Cortex Code

- "Explain this pack's tables and views, then map them to my claims warehouse's paid and incurred triangles. Propose the
  least-privilege grants and a validation plan before changing any objects."
- "Add an incurred-loss triangle and a Bornhuetter-Ferguson ultimate next to chain-ladder in `sql/setup.sql`, extend
  `LOSS_TRIANGLE_SV` so the agent can compare the two methods, and update the Triangle Explorer."
- "Tune the anomaly rule in `V_ANOMALIES` for my volumes: compare 1.5σ, 2σ, and an ex-high-low rule on my triangles and
  explain the trade-offs in false flags."

## Project layout

```text
app/                  Next.js App Router pages and /api routes (server-side Snowflake calls)
components/           Sidebar, ModeChip (Sample/Live), Reasoning (staged steps), AiBadges, ChatPanel, TriangleTable
lib/data.ts           Bundled synthetic triangles (identical to sql/setup.sql)
lib/responses.ts      Scripted Sample-mode chat answers
lib/anomalies.ts      Same 1.5σ rule as V_ANOMALIES, for Sample mode
lib/mode.ts           Sample/Live choice and live fetch (no fallback)
lib/snowflake.ts      Connection, bind variables, role, agent name validation
sql/                  setup.sql, cortex-agent.sql, cleanup.sql
scripts/              build-hosted-example.mjs, capture-screenshots.mjs, verify-live.mjs
docs/                 GitHub Pages guide, screenshots, catalog cards, and the /try/ static example
```

`npm run build:example` builds the static, no-account example into `docs/try/`. `npm run capture` serves it locally and
captures `docs/images/*.png` (1600×1000) and `docs/catalog/*.jpg` (960×600) with headless Chromium
(`npx playwright install chromium` the first time). `node scripts/verify-live.mjs` clicks through every screen against
`next start -p 3100` in Live mode.

## License and disclaimer

[Apache 2.0](LICENSE). This is an illustrative example provided as is. It is not an official Snowflake product and is not
supported by Snowflake Support. It contains no customer data and is not actuarial, reserving, or regulatory advice.
Review and test before any production use. See also [LEGAL.md](LEGAL.md).

Owner: Oz Oral · Last reviewed: November 2026
