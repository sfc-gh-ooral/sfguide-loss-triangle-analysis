import type { ChatMessage, ComparisonRow } from './types';

// Pre-scripted Cortex Agent responses keyed by prompt type
export type ResponseKey = 
  | 'generate_collision_triangle'
  | 'how_should_i_segment'
  | 'apply_consistent_selections'
  | 'flag_anomalies'
  | 'what_is_2020_ay'
  | 'compare_segments'
  | 'explain_tail_factor'
  | 'free_form';

interface AgentResponse {
  text: string;
  embeddedTriangleId?: string;
  highlightCells?: Array<{ ayIdx: number; devIdx: number; type: 'highlight' | 'anomaly' }>;
  comparisonData?: ComparisonRow[];
  thinkingMs: number; // simulated thinking delay
}

export const AGENT_RESPONSES: Record<ResponseKey, AgentResponse> = {
  generate_collision_triangle: {
    thinkingMs: 1800,
    embeddedTriangleId: 'collision-overall',
    text: `I've queried the claims data warehouse and generated the **Collision Paid Loss Development Triangle** as of 12/31/2024. Here's what I observe:

**2020 Accident Year — COVID Impact**
At 12 months, cumulative paid losses were $109.7M — significantly below the prior-year trend of ~$154M at the same maturity. This reflects the dramatic reduction in vehicle miles traveled during COVID-19 lockdowns (VMT fell approximately 38% in Q2 2020). However, the 12-to-24 month link ratio rebounded sharply to 1.555, well above the 5-year weighted average of 1.364, as deferred claims resolved during 2021.

**2022 Accident Year — Inflation Signal**
The 24-to-36 month link ratio is 1.152 — approximately 2.1 standard deviations above the 5-year mean of 1.086. This is consistent with peak used vehicle price inflation (CPI for used cars peaked at +43.2% year-over-year in early 2022), which elevated both repair costs and total-loss replacement values on claims still open at 24 months.

**2024 Accident Year — High Leverage**
With only 12 months of development ($162.4M paid), this year carries a CDF of approximately 1.614. Small movements in early emergence translate to large ultimate swings — every $5M change at 12 months implies ~$8M at ultimate given the current CDF.

The triangle is displayed above. I recommend reviewing the 2020 and 2022 accident years carefully when selecting development factors for periods 12→24 and 24→36 months.`,
    highlightCells: [
      { ayIdx: 3, devIdx: 0, type: 'anomaly' },  // 2020, 12mo
      { ayIdx: 3, devIdx: 1, type: 'anomaly' },  // 2020, 24mo
      { ayIdx: 5, devIdx: 1, type: 'anomaly' },  // 2022, 24mo
      { ayIdx: 5, devIdx: 2, type: 'anomaly' },  // 2022, 36mo
      { ayIdx: 7, devIdx: 0, type: 'highlight' }, // 2024, 12mo
    ],
  },

  how_should_i_segment: {
    thinkingMs: 2200,
    text: `Analyzing portfolio heterogeneity across key dimensions for the Collision line...

I recommend evaluating **three segmentation approaches**:

---

**1. Vehicle Value Tier** *(Recommended — implement now)*
High-value vehicles (replacement cost >$35,000) show a 12-to-24 month development factor of 1.423 vs. 1.318 for economy vehicles — a statistically significant 7.9% difference. The root cause is that economy vehicles reach total-loss thresholds faster, closing claims earlier. Tier 1 vehicles require longer repair cycles (supply chain for luxury/EV parts) and generate more coverage disputes.

Both tiers have sufficient volume: Tier 1 averages 8,400 exposures per accident year, Tier 2 averages 11,200. Credibility is not a concern at this segmentation level.

**Action:** Break the collision triangle into Tier 1 and Tier 2 segments effective AY 2019 (prior years have insufficient tier coding).

---

**2. State/Region** *(Secondary — exploratory)*
Midwest states (IL, IN, OH, MI, WI) show materially different development from coastal states. Average time-to-close for complex collision claims is 14 months in the Midwest vs. 19 months in coastal markets, driven by repair shop capacity and litigation climate. However, geographic segmentation fragments the data significantly — most state-level subsets fall below credibility thresholds for AYs prior to 2021.

**Action:** Flag for future review; monitor as the book grows.

---

**3. Policy Vintage** *(Exploratory — premature)*
Policies written under the 2023 revised underwriting guidelines reflect tighter risk selection and may have different loss patterns than the legacy book. However, with only 12-24 months of development on these vintages, the data is insufficient to draw conclusions.

**Action:** Revisit at the 12/31/2026 evaluation when 36 months of experience will be available.

---

**Summary:** Vehicle Value Tier segmentation is the single highest-value change you can make to this triangle set. I've prepared the Tier 1 and Tier 2 split triangles — navigate to the **Segment Analysis** tab to compare them side-by-side.`,
    highlightCells: [],
  },

  apply_consistent_selections: {
    thinkingMs: 2600,
    text: `Applying consistent selection rules across all segments...

**Rules Applied:**
- **12→24, 24→36 months:** 3-year volume-weighted average (excludes 2020 COVID outlier from 12→24)
- **36→48, 48→60 months:** 5-year volume-weighted average
- **60→72, 72→84, 84→96 months:** 5-year simple average (limited data at these ages)
- **Tail Factor:** 1.018 (revised from prior 1.012 based on 5-year observed tail study)

---

**Impact vs. Prior Carried Reserves:**

| Segment | Prior Ultimate | Current Ultimate | Change | Δ% |
|---|---|---|---|---|
| Collision — Overall | $1,739.4M | $1,847.3M | +$107.9M | +6.2% |
| Collision — Tier 1 | $872.3M | $923.8M | +$51.5M | +5.9% |
| Collision — Tier 2 | $867.1M | $923.5M | +$56.4M | +6.5% |
| Comprehensive | $501.2M | $518.8M | +$17.6M | +3.5% |
| Liability | $371.9M | $347.9M | −$24.0M | −6.5% |
| **Total Portfolio** | **$2,612.5M** | **$2,714.0M** | **+$101.5M** | **+3.9%** |

---

**Key Drivers:**
1. **2022 AY continued development (+$63.4M):** The 36-to-48 month factor on collision-2022 continues to emerge above expectation. The 2022 AY remains the single largest source of reserve uncertainty.
2. **2024 AY leverage effect (+$31.2M):** The highly immature 2024 year amplifies the effect of the tail revision.
3. **Tail factor revision (+$13.3M):** Updated to 1.018 from 1.012 based on the 2024 tail study.
4. **Liability improvement (−$24.0M):** The 2020 and 2021 liability years are developing more favorably than expected, driven by lower-than-projected medical cost inflation.

---

**Note:** Per actuarial policy, these calculations are provided for consistency testing and scenario analysis only. Final reserve selections require review and sign-off by the appointed actuary.`,
    comparisonData: [
      { segment: 'Collision — Overall', priorUltimate: 1739.4, currentUltimate: 1847.3, change: 107.9, changePct: 6.2 },
      { segment: 'Collision — Tier 1', priorUltimate: 872.3, currentUltimate: 923.8, change: 51.5, changePct: 5.9 },
      { segment: 'Collision — Tier 2', priorUltimate: 867.1, currentUltimate: 923.5, change: 56.4, changePct: 6.5 },
      { segment: 'Comprehensive', priorUltimate: 501.2, currentUltimate: 518.8, change: 17.6, changePct: 3.5 },
      { segment: 'Liability', priorUltimate: 371.9, currentUltimate: 347.9, change: -24.0, changePct: -6.5 },
    ],
  },

  flag_anomalies: {
    thinkingMs: 2000,
    embeddedTriangleId: 'collision-overall',
    text: `Running statistical anomaly detection (±1.5σ threshold)...

I've identified **4 development anomalies** that warrant actuary attention:

---

🔴 **HIGH — 2022 AY, 24→36 months (factor: 1.152)**
This factor is **2.1 standard deviations** above the 5-year mean of 1.086 (σ = 0.031). The root cause is peak used-vehicle price inflation: the average replacement cost for total-loss vehicles was up 43% from pre-COVID levels at the peak in early 2023, directly inflating losses on claims open at 24 months. Recommend: (1) consider an explicit inflation loading for the 2023-2024 AY ultimates; (2) exclude 2022 from the 24→36 average when selecting factors for future years.

---

🔴 **HIGH — 2020 AY, 12→24 months (factor: 1.555)**
The COVID-driven catch-up produced an abnormally high factor, **1.9 standard deviations** above the 5-year mean of 1.364. Including 2020 in weighted averages for this development period depresses the selected factor and could understate reserves for the 2024 AY. Recommend: exclude AY 2020 from the 12→24 month factor selection. Doing so raises the selected factor from 1.364 to 1.389, adding approximately $14.7M to the 2024 AY ultimate.

---

🟡 **MODERATE — 2024 AY, 12-month paid ($162.4M)**
The 12-month paid loss is **9.3% above the trended expected value** of $148.6M. This could reflect: (1) adverse frequency in H2 2024, (2) accelerated claim closings skewing paid development higher, or (3) statistical variation. The 2024 AY represents the highest-leverage point in the triangle — the CDF is 1.614, so this emergence translates to a $24.3M above-expected ultimate. Monitor at the 18-month evaluation (6/30/2025).

---

🟢 **LOW — 2021 AY, 48→60 months (factor: 1.024)**
Slightly elevated vs. expected 1.016, but within statistical bounds. Worth monitoring given the already-elevated 2021 ultimate — any persistent development above expectation on this year would add further pressure to reserves.`,
    highlightCells: [
      { ayIdx: 5, devIdx: 1, type: 'anomaly' }, // 2022, 24mo
      { ayIdx: 5, devIdx: 2, type: 'anomaly' }, // 2022, 36mo
      { ayIdx: 3, devIdx: 0, type: 'anomaly' }, // 2020, 12mo
      { ayIdx: 3, devIdx: 1, type: 'anomaly' }, // 2020, 24mo
      { ayIdx: 7, devIdx: 0, type: 'highlight' }, // 2024, 12mo
      { ayIdx: 4, devIdx: 3, type: 'highlight' }, // 2021, 48mo
    ],
  },

  what_is_2020_ay: {
    thinkingMs: 1200,
    text: `The **2020 Accident Year** is anomalous for two distinct reasons:

**1. COVID-19 Frequency Effect (12-month development)**
Vehicle miles traveled fell approximately 38% in Q2 2020 due to lockdowns and remote work adoption. Fewer miles driven = fewer accidents. The collision book shows $109.7M paid at 12 months — roughly 29% below the trend line. This isn't an underreporting issue; the claims volume genuinely dropped.

**2. Deferred Claims Resolution (12→24 month factor)**
Many minor collision claims that occurred in late 2020 were deferred — body shops were backed up, adjusters worked remotely, and customers delayed non-urgent repairs. These claims resolved rapidly in 2021, producing an unusually high 12-to-24 month link ratio of **1.555** vs. the 5-year average of **1.364**.

**Actuarial Implications:**
When using historical development factors to project the 2024 AY forward, including AY 2020 in the 12→24 month average **suppresses** the selected factor, potentially understating reserves. The recommended practice is to exclude 2020 from factor selections for the 12→24 month period, or to use a trimmed average that removes the outlier observation.

The 2020 AY is essentially fully developed now at 60 months ($212.3M paid), with an ultimate estimate of ~$215M — confirming that the COVID effect was primarily a timing phenomenon, not a permanent reduction in loss frequency.`,
    highlightCells: [
      { ayIdx: 3, devIdx: 0, type: 'anomaly' },
      { ayIdx: 3, devIdx: 1, type: 'anomaly' },
      { ayIdx: 3, devIdx: 4, type: 'highlight' },
    ],
  },

  compare_segments: {
    thinkingMs: 1500,
    text: `Comparing the Tier 1 and Tier 2 collision segments...

**Key Differences in Development Pattern:**

| Metric | Tier 1 (High-Value) | Tier 2 (Economy) | Difference |
|---|---|---|---|
| 12→24 link ratio (5yr VWA) | 1.423 | 1.318 | +7.9% faster on Tier 1 |
| 24→36 link ratio (5yr VWA) | 1.133 | 1.112 | +1.9% |
| CDF at 12 months | 1.688 | 1.551 | Tier 1 more leveraged |
| Avg severity (2023 AY) | $8,420 | $4,180 | 2.0× higher on Tier 1 |
| Total-loss rate | 18.3% | 31.7% | Tier 2 resolves faster |

**Why Tier 2 develops faster:**
Economy vehicles reach total-loss thresholds at lower damage levels — the cost of repairing a $14,000 vehicle quickly exceeds its ACV. Total-loss claims close in 30-45 days on average. Tier 1 vehicles (luxury/EV/ADAS-equipped) require specialized parts and certified repair facilities, averaging 75-90 days for complex repairs.

**Implication for loss reserves:**
Using a blended triangle that combines Tier 1 and Tier 2 development patterns understates reserves for Tier 1 (applies too fast a factor) and overstates them for Tier 2. The combined bias depends on the current mix: as the EV and premium vehicle mix grows, the blended triangle will systematically understate the time-value of open claims.

**Recommendation:** Maintain separate triangles by value tier indefinitely. As EV penetration increases (projecting ~28% of new policies by 2027), the Tier 1 development pattern will become increasingly important to track separately.`,
  },

  explain_tail_factor: {
    thinkingMs: 1000,
    text: `The **tail factor** represents development beyond the end of the explicit triangle — in this case, beyond 96 months (8 years) of development.

**Why we need a tail:**
Even at 96 months, a small percentage of claims remain open: complex litigation, medical monitoring claims, and subrogation recoveries can persist for 8-12 years. For the collision book, approximately 0.8-1.2% of ultimate losses are expected to emerge after 96 months.

**How the 1.018 tail factor was derived:**
The tail was estimated using two methods:
1. **Curve-fitting:** Fitting an exponential decay curve to observed link ratios from periods 48-96 months and integrating to infinity suggests a tail of 1.015-1.019.
2. **Industry benchmarks:** ISO and NCCI industry studies for private passenger auto collision indicate tails of 1.012-1.025 depending on state mix and coverage type.
3. **Observed internal data (2015-2017 AYs):** These years now have 96+ months of development in internal records, showing actual tail development of 1.016-1.021.

The selected 1.018 reflects the midpoint of these estimates.

**Sensitivity:**
A ±0.005 change in the tail factor translates to approximately ±$13M in portfolio-level reserves. While this seems small relative to $2.7B in estimated ultimates, it is material relative to the IBNR on mature years.

**Note:** The tail factor is applied to all accident years, but the dollar impact is concentrated in near-fully-developed years (2017-2019) where the tail factor is the only remaining development applied to a large reported loss base.`,
  },

  free_form: {
    thinkingMs: 800,
    text: `I can help you with loss triangle analysis for your auto insurance portfolio. Here are some things I can do:

- **Generate triangles** — Pull paid loss development triangles for any coverage and segment combination
- **Identify segments** — Analyze your portfolio to recommend meaningful breakdowns that reveal heterogeneous development patterns
- **Consistency testing** — Apply a uniform set of selection rules across all segments and quantify the impact vs. current carried reserves
- **Anomaly detection** — Flag statistically unusual development periods that warrant actuary review
- **Factor education** — Explain any development pattern, link ratio, or selection methodology in plain language

Try one of the prompts below, or ask me anything about the loss triangles.`,
  },
};

// ─── SUGGESTED PROMPTS ───────────────────────────────────────────────────────
export interface PromptSuggestion {
  key: ResponseKey;
  label: string;
  description: string;
  icon: string;
}

export const SUGGESTED_PROMPTS: PromptSuggestion[] = [
  {
    key: 'generate_collision_triangle',
    label: 'Generate collision triangle',
    description: 'Show the paid loss development triangle for all accident years',
    icon: 'table',
  },
  {
    key: 'how_should_i_segment',
    label: 'How should I segment this?',
    description: 'Recommend segmentation approaches based on development patterns',
    icon: 'layers',
  },
  {
    key: 'apply_consistent_selections',
    label: 'Apply consistent selections',
    description: 'Apply uniform LDF rules across all segments and show reserve impact',
    icon: 'check-square',
  },
  {
    key: 'flag_anomalies',
    label: 'Flag anomalies',
    description: 'Identify statistically unusual development patterns',
    icon: 'alert-triangle',
  },
];

// Map user-typed text to a response key
export function matchResponseKey(text: string): ResponseKey {
  const lower = text.toLowerCase();
  if (lower.includes('segment') || lower.includes('split') || lower.includes('break')) return 'how_should_i_segment';
  if (lower.includes('consist') || lower.includes('apply') || lower.includes('selection')) return 'apply_consistent_selections';
  if (lower.includes('anomal') || lower.includes('flag') || lower.includes('unusual') || lower.includes('weird')) return 'flag_anomalies';
  if (lower.includes('collision') || lower.includes('triangle') || lower.includes('generate') || lower.includes('show')) return 'generate_collision_triangle';
  if (lower.includes('2020') || lower.includes('covid')) return 'what_is_2020_ay';
  if (lower.includes('compare') || lower.includes('tier')) return 'compare_segments';
  if (lower.includes('tail')) return 'explain_tail_factor';
  return 'free_form';
}
