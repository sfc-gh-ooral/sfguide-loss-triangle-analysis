# Snowflake Loss Triangle Analysis

AI-powered actuarial loss triangle analysis built with [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents). A five-screen Next.js application for property-casualty reserve analysis: portfolio dashboard, AI-powered Q&A, triangle explorer, segment comparison, and consistency testing.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## Features

| Screen | Description |
|--------|-------------|
| **Dashboard** | Portfolio KPIs, development trend chart, reserve waterfall, anomaly alerts |
| **AI Agent** | Chat with a Cortex Agent — ask it to generate triangles, flag anomalies, recommend segmentation, or explain development patterns |
| **Triangle Explorer** | Interactive heatmap triangles with link ratios, CDFs, and ultimates across 5 triangles |
| **Segment Analysis** | Compare coverage types or vehicle tiers side-by-side with LDF bar charts and AI-generated insights |
| **Consistency Test** | Apply uniform selection rules across all segments and measure reserve impact vs. prior carried values |

## Quick Start (Mock Data)

The app runs immediately with built-in mock data — no Snowflake connection required:

```bash
git clone https://github.com/sfc-gh-ooral/sfguide-loss-triangle-analysis.git
cd sfguide-loss-triangle-analysis
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All five screens work with realistic simulated data.

## Deploy with Live Snowflake Data

### Step 1: Create the database

```sql
CREATE DATABASE IF NOT EXISTS LOSS_TRIANGLE_DEMO;
USE DATABASE LOSS_TRIANGLE_DEMO;
```

### Step 2: Run the setup script

Open a **Snowsight SQL Worksheet**, paste the contents of [`sql/setup.sql`](sql/setup.sql), and execute. This creates:

- **Schema:** `LOSS_TRIANGLES`
- **Tables:** `paid_loss_triangles` (204 rows), `selected_factors` (35), `tail_factors` (5), `prior_ultimates` (40)
- **Views:** `v_link_ratios`, `v_cdfs`, `v_ultimates`, `v_portfolio_kpis`, `v_reserve_waterfall`, `v_anomalies`

### Step 3: Create the Cortex Agent (optional)

Paste the contents of [`sql/cortex-agent.sql`](sql/cortex-agent.sql) into Snowsight and execute. This creates:

- **Semantic View:** `LOSS_TRIANGLE_SV` — tells the agent how to interpret the loss triangle data
- **Cortex Agent:** `LOSS_TRIANGLE_AGENT` — answers actuarial questions using the semantic view

> Requires Cortex Agents to be enabled in your account. If unavailable, the app still works — the chat page falls back to scripted responses.

### Step 4: Set up authentication

Key-pair authentication is recommended:

```bash
# Generate an RSA key pair
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt

# Extract the public key (copy the output without header/footer lines)
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
cat rsa_key.pub
```

Register the public key in Snowflake:

```sql
ALTER USER your_username SET RSA_PUBLIC_KEY='MIIBIjANBg...your_key_here...';
```

### Step 5: Configure and launch

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Snowflake account details:

```bash
SNOWFLAKE_ACCOUNT=your_account_locator       # e.g., xy12345.us-east-1
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_DATABASE=LOSS_TRIANGLE_DEMO
SNOWFLAKE_SCHEMA=LOSS_TRIANGLES
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_PRIVATE_KEY_PATH=/path/to/rsa_key.p8
SNOWFLAKE_AGENT_NAME=LOSS_TRIANGLE_DEMO.LOSS_TRIANGLES.LOSS_TRIANGLE_AGENT
```

```bash
npm install
npm run dev
```

The sidebar indicator shows **Live Data** when connected to Snowflake.

## Connecting Your Own Data

The app expects four tables in the schema specified by `SNOWFLAKE_SCHEMA`. Replace the seed data with your own claims data matching these schemas:

| Table | Key Columns | Description |
|-------|-------------|-------------|
| `paid_loss_triangles` | `triangle_id`, `accident_year`, `dev_month`, `cumulative_paid` | Cumulative paid losses by triangle, accident year, and development month. Also includes `triangle_name`, `coverage`, `segment`, `eval_date`. |
| `selected_factors` | `triangle_id`, `dev_period_from`, `dev_period_to`, `selected_ldf` | Actuarially selected link development factors per development period. |
| `tail_factors` | `triangle_id`, `tail_factor` | Tail factor for extrapolation beyond observed development. |
| `prior_ultimates` | `triangle_id`, `accident_year`, `prior_ultimate` | Prior year's reserve estimates by triangle and accident year (for comparison). |

The six analytical views (`v_link_ratios`, `v_cdfs`, `v_ultimates`, `v_portfolio_kpis`, `v_reserve_waterfall`, `v_anomalies`) are created by `setup.sql` and compute all derived metrics from these base tables.

## Architecture

| Layer | Components |
|-------|------------|
| **Cortex Agent** | Actuarial Q&A agent with Cortex Analyst text-to-SQL via Semantic View |
| **Core Data** | Paid loss tables, computed views (link ratios, CDFs, ultimates), XS warehouse |
| **Application** | Next.js 16, snowflake-sdk (Node.js), Recharts, Framer Motion |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/triangles` | GET | All triangle data with link ratios, CDFs, ultimates |
| `/api/kpis` | GET | Portfolio KPIs (reported, IBNR, ultimate, prior comparison) |
| `/api/waterfall` | GET | Reserve waterfall (prior to current bridge) |
| `/api/link-ratios` | GET | Link ratios for a specific triangle (`?triangleId=...`) |
| `/api/ultimates` | GET | Ultimates for a specific triangle (`?triangleId=...`) |
| `/api/prior-ultimates` | GET | Prior ultimates by triangle (for consistency testing) |
| `/api/chat` | POST | Send a message to the Cortex Agent |

Each route falls back to mock data when Snowflake is not configured.

## Project Structure

```
sfguide-loss-triangle-analysis/
├── app/
│   ├── page.tsx                  # Portfolio dashboard
│   ├── chat/page.tsx             # AI Agent chat
│   ├── triangles/page.tsx        # Triangle explorer
│   ├── segments/page.tsx         # Segment comparison
│   ├── consistency/page.tsx      # Consistency testing
│   └── api/                      # API routes (7 endpoints)
├── components/
│   ├── ChatPanel.tsx             # Chat UI with streaming + embedded tables
│   ├── TriangleTable.tsx         # Interactive triangle heatmap
│   └── Sidebar.tsx               # Navigation sidebar
├── lib/
│   ├── snowflake.ts              # Snowflake connection + query helper
│   ├── data.ts                   # Mock data (fallback when Snowflake not configured)
│   ├── types.ts                  # TypeScript interfaces
│   ├── utils.ts                  # Link ratio computation, formatting
│   └── responses.ts              # Scripted agent responses (fallback)
├── sql/
│   ├── setup.sql                 # Schema, tables, views, seed data
│   └── cortex-agent.sql          # Semantic View + Cortex Agent DDL
├── docs/
│   └── index.html                # Landing page (GitHub Pages)
├── .env.example                  # Environment variable template
├── LICENSE                       # Apache 2.0
└── LEGAL.md                      # Snowflake legal disclaimer
```

## Actuarial Notes

- **Method:** Chain-ladder (volume-weighted) with tail factor extrapolation
- **Data:** Cumulative paid losses in $M, 8x8 triangles (AY 2017-2024, dev months 12-96)
- **Anomaly detection:** Link ratios flagged at >1.5 standard deviations from the period mean
- **COVID impact:** AY 2020 shows depressed 12-month emergence with sharp 12-to-24 catch-up
- **Social inflation:** Liability line shows elevated late-period development in recent AYs

## Tech Stack

- **Frontend:** Next.js 16.3, React 19, Tailwind CSS v4, Recharts, Framer Motion
- **Backend:** Next.js API routes, snowflake-sdk (Node.js driver)
- **AI:** Snowflake Cortex Agents, Cortex Analyst (text-to-SQL via Semantic View)
- **Data:** Snowflake tables and computed views

## Legal

- Licensed under [Apache 2.0](LICENSE)
- See [LEGAL.md](LEGAL.md)
