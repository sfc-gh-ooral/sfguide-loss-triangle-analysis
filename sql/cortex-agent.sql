-- ============================================================================
-- Cortex Agent — Loss Triangle Actuarial Assistant
-- ============================================================================
-- Part 2 of 2. Run after sql/setup.sql, top to bottom, with no edits.
-- Requires Cortex Agents and Cortex Analyst in your region (or cross-region
-- inference enabled).
--
-- This script creates:
--   1. A Semantic View over the loss triangle tables and views
--   2. A Cortex Agent that uses the Semantic View to answer actuarial questions
--   3. Read grants on both for LOSS_TRIANGLE_ROLE
-- ============================================================================

USE ROLE SYSADMIN;
USE WAREHOUSE LOSS_TRIANGLE_WH;
USE SCHEMA LOSS_TRIANGLE_EXAMPLE.LOSS_TRIANGLES;

-- --------------------------------------------------------------------------
-- 1. SEMANTIC VIEW
-- --------------------------------------------------------------------------
-- The Semantic View tells the Cortex Agent how to interpret the data:
-- which tables to query, what dimensions and metrics are available, and
-- how tables relate to each other.

CREATE OR REPLACE SEMANTIC VIEW LOSS_TRIANGLE_SV
  TABLES (
    PAID_LOSSES AS PAID_LOSS_TRIANGLES
      PRIMARY KEY (TRIANGLE_ID, ACCIDENT_YEAR, DEV_MONTH)
      COMMENT = 'Cumulative paid losses ($M) by triangle, accident year, and development month',
    ULTIMATES AS V_ULTIMATES
      PRIMARY KEY (TRIANGLE_ID, ACCIDENT_YEAR)
      COMMENT = 'Chain-ladder reported, CDF, ultimate, and IBNR ($M) by triangle and accident year',
    ANOMALIES AS V_ANOMALIES
      PRIMARY KEY (TRIANGLE_ID, DEV_FROM, ACCIDENT_YEAR)
      COMMENT = 'Age-to-age link ratios with period mean, standard deviation, and an anomaly flag (more than 1.5 standard deviations from the mean)'
  )
  DIMENSIONS (
    PAID_LOSSES.TRIANGLE_ID_DIM AS TRIANGLE_ID
      COMMENT = 'Triangle id'
      SAMPLE_VALUES ('collision-overall', 'collision-tier1', 'collision-tier2', 'comprehensive-overall', 'liability-overall')
      IS_ENUM,
    PAID_LOSSES.COVERAGE_DIM AS COVERAGE
      COMMENT = 'Coverage type'
      SAMPLE_VALUES ('collision', 'comprehensive', 'liability')
      IS_ENUM,
    PAID_LOSSES.SEGMENT_DIM AS SEGMENT
      COMMENT = 'Segment: overall, tier1 (high-value vehicles), tier2 (economy vehicles). Tier 1 and Tier 2 split collision overall.'
      SAMPLE_VALUES ('overall', 'tier1', 'tier2')
      IS_ENUM,
    PAID_LOSSES.ACCIDENT_YEAR_DIM AS ACCIDENT_YEAR
      COMMENT = 'Accident year 2017-2024',
    PAID_LOSSES.DEV_MONTH_DIM AS DEV_MONTH
      COMMENT = 'Development month 12-96',
    PAID_LOSSES.TRIANGLE_NAME_DIM AS TRIANGLE_NAME
      COMMENT = 'Triangle display name',
    ULTIMATES.ULT_TRIANGLE_ID AS TRIANGLE_ID
      COMMENT = 'Triangle id. The portfolio total is the sum of the three -overall triangles; the collision tier triangles split collision-overall, so do not add them to the total.'
      SAMPLE_VALUES ('collision-overall', 'collision-tier1', 'collision-tier2', 'comprehensive-overall', 'liability-overall')
      IS_ENUM,
    ULTIMATES.ULT_ACCIDENT_YEAR AS ACCIDENT_YEAR
      COMMENT = 'Accident year 2017-2024',
    ULTIMATES.LATEST_DEV_DIM AS LATEST_DEV_MONTH
      COMMENT = 'Latest development month on the diagonal',
    ANOMALIES.ANOM_TRIANGLE_ID AS TRIANGLE_ID
      COMMENT = 'Triangle id'
      SAMPLE_VALUES ('collision-overall', 'collision-tier1', 'collision-tier2', 'comprehensive-overall', 'liability-overall')
      IS_ENUM,
    ANOMALIES.ANOM_ACCIDENT_YEAR AS ACCIDENT_YEAR
      COMMENT = 'Accident year of the link ratio',
    ANOMALIES.DEV_FROM_DIM AS DEV_FROM
      COMMENT = 'Starting development month of the link ratio (12 means 12-to-24 months)',
    ANOMALIES.IS_ANOMALOUS_DIM AS IS_ANOMALOUS
      COMMENT = 'TRUE when the link ratio is more than 1.5 standard deviations from the period mean'
  )
  METRICS (
    PAID_LOSSES.TOTAL_PAID AS SUM(CUMULATIVE_PAID)
      COMMENT = 'Sum of cumulative paid in $M',
    ULTIMATES.TOTAL_ULTIMATE AS SUM(ULTIMATE_LOSS)
      COMMENT = 'Total projected ultimate in $M',
    ULTIMATES.TOTAL_IBNR AS SUM(IBNR)
      COMMENT = 'Total IBNR in $M',
    ULTIMATES.TOTAL_REPORTED AS SUM(REPORTED_LOSS)
      COMMENT = 'Total reported (latest paid diagonal) in $M',
    ULTIMATES.AVG_CDF AS AVG(CDF)
      COMMENT = 'Average CDF across accident years',
    ANOMALIES.AVG_LINK_RATIO AS AVG(LINK_RATIO)
      COMMENT = 'Average age-to-age link ratio',
    ANOMALIES.ANOMALY_COUNT AS COUNT_IF(IS_ANOMALOUS)
      COMMENT = 'Number of link ratios flagged as anomalous'
  )
  COMMENT = 'Synthetic auto insurance loss triangles. Values in $M.';

-- --------------------------------------------------------------------------
-- 2. CORTEX AGENT
-- --------------------------------------------------------------------------
-- The agent uses the Semantic View to translate natural-language questions
-- into SQL queries with Cortex Analyst, which runs on LOSS_TRIANGLE_WH.
-- The orchestration model is chosen automatically by Snowflake (auto).

CREATE OR REPLACE AGENT LOSS_TRIANGLE_AGENT
  COMMENT = 'Actuarial assistant for loss triangle analysis (synthetic data)'
  FROM SPECIFICATION $$
  models:
    orchestration: auto
  orchestration:
    budget:
      seconds: 60
      tokens: 16000
  instructions:
    response: |
      You are an actuarial assistant specializing in property-casualty loss
      triangle analysis for an auto insurance portfolio. Always query the data
      before answering. Express dollar amounts in $M with one decimal place.
      Portfolio totals use only the three -overall triangles; the collision
      Tier 1 and Tier 2 triangles split collision-overall, so never add them in.
      Flag COVID-impacted AY 2020 when relevant. Note social inflation trends
      in liability development. Remind users that results require actuary review.
    orchestration: |
      Use the Analyst tool for all data questions about loss triangles,
      development factors, CDFs, ultimates, IBNR, anomalies, and reserve estimates.
    sample_questions:
      - question: "What is the total IBNR estimate for the portfolio?"
      - question: "Show me the collision overall triangle development"
      - question: "Which link ratios are flagged as anomalous?"
      - question: "Compare Tier 1 vs Tier 2 collision ultimates"
  tools:
    - tool_spec:
        type: cortex_analyst_text_to_sql
        name: LossTriangleAnalyst
        description: >-
          Queries loss triangle data including paid losses, development factors,
          CDFs, ultimate projections, IBNR estimates, and anomaly flags
  tool_resources:
    LossTriangleAnalyst:
      semantic_view: LOSS_TRIANGLE_EXAMPLE.LOSS_TRIANGLES.LOSS_TRIANGLE_SV
      execution_environment:
        type: warehouse
        warehouse: LOSS_TRIANGLE_WH
  $$;

-- --------------------------------------------------------------------------
-- 3. GRANTS for the read-only app role
-- --------------------------------------------------------------------------
GRANT SELECT ON SEMANTIC VIEW LOSS_TRIANGLE_SV TO ROLE LOSS_TRIANGLE_ROLE;
GRANT USAGE ON AGENT LOSS_TRIANGLE_AGENT TO ROLE LOSS_TRIANGLE_ROLE;

-- --------------------------------------------------------------------------
-- 4. VERIFICATION (as the app role)
-- --------------------------------------------------------------------------
-- Test the agent with a sample question. The response is JSON; extract the
-- text content with LATERAL FLATTEN.
USE ROLE LOSS_TRIANGLE_ROLE;

SELECT f.value:text::STRING AS agent_response
FROM (
  SELECT TRY_PARSE_JSON(
    SNOWFLAKE.CORTEX.DATA_AGENT_RUN(
      'LOSS_TRIANGLE_EXAMPLE.LOSS_TRIANGLES.LOSS_TRIANGLE_AGENT',
      '{"messages":[{"role":"user","content":[{"type":"text","text":"What is the total IBNR estimate for the portfolio?"}]}]}',
      TRUE
    )
  ) AS resp
) r,
LATERAL FLATTEN(input => r.resp:content) f
WHERE f.value:type::STRING = 'text'
LIMIT 1;
