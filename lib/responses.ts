import type { ChatMessage, ComparisonRow } from './types';

// Scripted answers for Sample mode, matched by keyword (see matchResponseKey). They are labeled
// "Sample AI response" in the UI. Every figure below comes from the bundled synthetic triangles,
// which are the same values sql/setup.sql loads, so they agree with the views in Live mode.
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
  highlightCells?: ChatMessage['highlightCells'];
  comparisonData?: ComparisonRow[];
}

export const AGENT_RESPONSES: Record<ResponseKey, AgentResponse> = {
  generate_collision_triangle: {
    embeddedTriangleId: 'collision-overall',
    text: `Here is the **Collision (overall) paid loss triangle** as of 12/31/2024, in $M. What stands out:

**AY 2020: low start, fast catch-up**
Paid at 12 months was $109.7M, against $143.8M to $168.4M for the other accident years. The 12-to-24 month link ratio then jumped to **1.556**, versus a period mean of 1.395, which the anomaly rule flags at 2.2 standard deviations.

**AY 2024: high leverage**
With only 12 months of development ($162.4M paid), AY 2024 carries a CDF of **1.673**, for an ultimate of $271.6M and IBNR of $109.2M. Small changes in early emergence move its ultimate the most.

I'd review AY 2020 before selecting the 12→24 and 24→36 factors.`,
    highlightCells: [
      { ayIdx: 3, devIdx: 0, type: 'anomaly' },
      { ayIdx: 3, devIdx: 1, type: 'anomaly' },
      { ayIdx: 7, devIdx: 0, type: 'highlight' },
    ],
  },

  how_should_i_segment: {
    text: `This data set has two segment views you can compare: **coverage** (collision, comprehensive, liability) and, for collision, **vehicle value tier** (Tier 1 high-value, Tier 2 economy).

---

**1. Vehicle value tier** *(the clearest split in this data)*
Tier 1's selected 12→24 LDF is **1.423** versus **1.318** for Tier 2, and its tail factor is 1.020 versus 1.016. The blended collision triangle uses 1.364, which sits between the two. Tier 1 carries $115.2M of IBNR on $1,123.2M reported; Tier 2 carries $65.2M on $801.3M.

**2. Coverage**
Liability develops slowest (12→24 LDF 1.592, tail 1.042) and comprehensive fastest (1.216, tail 1.010), so they need separate triangles in any case.

---

**Next step:** open **Segment Analysis** to see the tier triangles side by side and generate insights. Whether a split is credible for your own book depends on volumes this synthetic data set doesn't include.`,
    highlightCells: [],
  },

  apply_consistent_selections: {
    text: `Using the **selected LDFs and tail factors loaded in the example**, here is each triangle's chain-ladder ultimate against the prior carried ultimate:

| Segment | Prior Ultimate | Current Ultimate | Change | Δ% |
|---|---|---|---|---|
| Collision — Overall | $2,037.6M | $2,100.6M | +$63.0M | +3.1% |
| Collision — Tier 1 | $1,201.3M | $1,238.4M | +$37.1M | +3.1% |
| Collision — Tier 2 | $840.5M | $866.5M | +$26.0M | +3.1% |
| Comprehensive | $847.0M | $873.1M | +$26.1M | +3.1% |
| Liability | $707.0M | $728.8M | +$21.8M | +3.1% |

The portfolio total uses the three overall triangles only (Tier 1 and Tier 2 split collision overall): **$3,591.6M prior to $3,702.5M current, +$110.9M (+3.1%)**. The uniform +3.1% is by construction: the synthetic prior ultimates were set at 97% of current.

To apply your own rules (averaging method by period, tail factor), use the **Consistency Test** screen, which recalculates every triangle with the same rules.

**Note:** illustrative only. Reserve selections need review and sign-off by a qualified actuary.`,
    comparisonData: [
      { segment: 'Collision — Overall', priorUltimate: 2037.6, currentUltimate: 2100.6, change: 63.0, changePct: 3.1 },
      { segment: 'Collision — Tier 1', priorUltimate: 1201.3, currentUltimate: 1238.4, change: 37.1, changePct: 3.1 },
      { segment: 'Collision — Tier 2', priorUltimate: 840.5, currentUltimate: 866.5, change: 26.0, changePct: 3.1 },
      { segment: 'Comprehensive', priorUltimate: 847.0, currentUltimate: 873.1, change: 26.1, changePct: 3.1 },
      { segment: 'Liability', priorUltimate: 707.0, currentUltimate: 728.8, change: 21.8, changePct: 3.1 },
    ],
  },

  flag_anomalies: {
    embeddedTriangleId: 'collision-overall',
    text: `The anomaly rule flags link ratios more than **1.5 standard deviations** from the mean of their development period. It flags **16 link ratios** across the five triangles. The largest on the overall triangles:

---

🔴 **Collision, AY 2020, 12→24 months (1.556 vs. 1.395 mean, 2.2σ)**
The low 12-month paid for AY 2020 followed by a sharp catch-up. Including it in a simple average pulls the selected factor up for later years.

🔴 **Liability, AY 2020, 12→24 months (1.646 vs. 1.592 mean, 2.2σ)**
Same accident year, same period, on a different coverage.

🔴 **Comprehensive, AY 2020, 12→24 months (1.244 vs. 1.221 mean, 2.2σ)**
Smaller in absolute terms, but still outside the band.

🟡 **Collision, AY 2020, 24→36 months (1.171 vs. 1.130 mean, 1.8σ)**
The catch-up continues into the next period.

---

**What they share:** 15 of the 16 flags are AY 2020; the other is Collision Tier 1, AY 2022, 24→36 months (1.64σ). Consider excluding AY 2020 from the early-period averages, and confirm the cause with claims data this example doesn't include.`,
    highlightCells: [
      { ayIdx: 3, devIdx: 0, type: 'anomaly' },
      { ayIdx: 3, devIdx: 1, type: 'anomaly' },
      { ayIdx: 3, devIdx: 2, type: 'anomaly' },
    ],
  },

  what_is_2020_ay: {
    text: `**AY 2020** behaves differently from every other accident year in this data set:

**1. Low early emergence**
Collision paid at 12 months was **$109.7M**, versus $143.8M to $168.4M for the other years.

**2. Catch-up in the next periods**
The 12→24 link ratio was **1.556** against a 1.395 mean, and 24→36 was 1.171 against 1.130. Both are flagged by the anomaly rule, and AY 2020 is flagged on all three overall triangles.

**3. It ends up in line**
At 72 months AY 2020 has $214.5M paid and a $219.7M ultimate, so the effect looks like timing rather than a lasting change in losses.

**Implication:** keeping AY 2020 in early-period averages can distort the factors applied to immature years. Trimmed or ex-2020 averages are common alternatives; the **Consistency Test** screen lets you compare averaging methods.`,
    highlightCells: [
      { ayIdx: 3, devIdx: 0, type: 'anomaly' },
      { ayIdx: 3, devIdx: 1, type: 'anomaly' },
      { ayIdx: 3, devIdx: 5, type: 'highlight' },
    ],
  },

  compare_segments: {
    text: `Comparing the **Tier 1** and **Tier 2** collision triangles:

| Metric | Tier 1 (High-Value) | Tier 2 (Economy) |
|---|---|---|
| Selected 12→24 LDF | 1.423 | 1.318 |
| Selected 24→36 LDF | 1.133 | 1.112 |
| Tail factor | 1.020 | 1.016 |
| AY 2024 CDF | 1.772 | 1.591 |
| Reported (all AYs) | $1,123.2M | $801.3M |
| IBNR (all AYs) | $115.2M | $65.2M |
| Ultimate (all AYs) | $1,238.4M | $866.5M |

**Reading it:** Tier 1 develops more at every early age, so it carries proportionally more IBNR (10.3% of reported versus 8.1%). The blended collision triangle (12→24 LDF 1.364) applies a factor between the two, which would understate Tier 1 and overstate Tier 2 if used for both.

The synthetic data doesn't include claim counts, severities, or vehicle mix, so the *cause* of the difference is something to confirm with your own data.`,
  },

  explain_tail_factor: {
    text: `The **tail factor** covers development beyond the last column of the triangle, here 96 months (8 years).

**Selected tails in this example:**
- Collision overall: **1.018** (Tier 1: 1.020, Tier 2: 1.016)
- Comprehensive: **1.010**
- Liability: **1.042**

Liability's tail is largest because its late-period link ratios are still well above 1.000 (84→96 selected at 1.010), while comprehensive is close to fully developed.

**Why it matters:** the tail applies to every accident year, so for mature years (AY 2017-2019) it's nearly all the remaining IBNR. In practice actuaries derive tails from curve fits to late link ratios, older internal data, or benchmarks; this example simply loads fixed values in \`tail_factors\`, which you can change in the **Consistency Test** screen.`,
  },

  free_form: {
    text: `I can help with loss triangle analysis for this synthetic auto insurance portfolio. For example:

- **Show triangles** for any coverage and segment
- **Compare segments**, such as Tier 1 versus Tier 2 collision
- **Explain anomalies** that the 1.5σ link-ratio rule flags
- **Summarize reserves**: reported, IBNR, and ultimate versus prior
- **Explain** a development pattern, link ratio, or tail factor

Try one of the prompts below, or ask your own question.`,
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
    label: 'Show the collision triangle',
    description: 'Paid loss development for all accident years',
    icon: 'table',
  },
  {
    key: 'compare_segments',
    label: 'Compare Tier 1 vs Tier 2',
    description: 'Development factors, IBNR, and ultimates by vehicle tier',
    icon: 'layers',
  },
  {
    key: 'apply_consistent_selections',
    label: 'Ultimates vs prior',
    description: 'Current chain-ladder ultimates against prior carried, by segment',
    icon: 'check-square',
  },
  {
    key: 'flag_anomalies',
    label: 'Flag anomalies',
    description: 'Link ratios more than 1.5 standard deviations from the mean',
    icon: 'alert-triangle',
  },
];

// Map user-typed text to a response key (Sample mode only)
export function matchResponseKey(text: string): ResponseKey {
  const lower = text.toLowerCase();
  if (lower.includes('anomal') || lower.includes('flag') || lower.includes('unusual') || lower.includes('weird')) return 'flag_anomalies';
  if (lower.includes('tier') || lower.includes('compare')) return 'compare_segments';
  if (lower.includes('segment') || lower.includes('split') || lower.includes('break')) return 'how_should_i_segment';
  if (lower.includes('consist') || lower.includes('apply') || lower.includes('selection') || lower.includes('prior') || lower.includes('ultimate')) return 'apply_consistent_selections';
  if (lower.includes('2020') || lower.includes('covid')) return 'what_is_2020_ay';
  if (lower.includes('tail')) return 'explain_tail_factor';
  if (lower.includes('collision') || lower.includes('triangle') || lower.includes('generate') || lower.includes('show')) return 'generate_collision_triangle';
  return 'free_form';
}
