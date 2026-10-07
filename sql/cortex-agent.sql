-- ============================================================================
-- Cortex Agent — Loss Triangle Actuarial Assistant
-- ============================================================================
-- Prerequisites:
--   1. Run sql/setup.sql first to create tables, views, and seed data
--   2. Cortex Agents must be enabled in your Snowflake account
--   3. A warehouse (XS is sufficient) must be available
--
-- This script creates:
--   1. A Semantic View over the loss triangle tables and views
--   2. A Cortex Agent that uses the Semantic View to answer actuarial questions
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. SEMANTIC VIEW
-- --------------------------------------------------------------------------
-- The Semantic View tells the Cortex Agent how to interpret the data:
-- which tables to query, what dimensions and metrics are available, and
-- how tables relate to each other.

CREATE OR REPLACE SEMANTIC VIEW LOSS_TRIANGLE_SV
  TABLES (
    PAID_LOSSES AS PAID_LOSS_TRIANGLES
      PRIMARY KEY (TRIANGLE_ID, ACCIDENT_YEAR, DEV_MONTH),
    ULTIMATES AS V_ULTIMATES
      PRIMARY KEY (TRIANGLE_ID, ACCIDENT_YEAR)
  )
  RELATIONSHIPS (
    ULT_TO_PAID AS ULTIMATES(TRIANGLE_ID) REFERENCES PAID_LOSSES(TRIANGLE_ID)
  )
  DIMENSIONS (
    PAID_LOSSES.COVERAGE_DIM AS COVERAGE
      COMMENT = 'Coverage type'
      SAMPLE_VALUES ('collision', 'comprehensive', 'liability')
      IS_ENUM,
    PAID_LOSSES.SEGMENT_DIM AS SEGMENT
      COMMENT = 'Segment'
      SAMPLE_VALUES ('overall', 'tier1', 'tier2')
      IS_ENUM,
    PAID_LOSSES.ACCIDENT_YEAR_DIM AS ACCIDENT_YEAR
      COMMENT = 'Accident year 2017-2024',
    PAID_LOSSES.DEV_MONTH_DIM AS DEV_MONTH
      COMMENT = 'Development month 12-96',
    PAID_LOSSES.TRIANGLE_NAME_DIM AS TRIANGLE_NAME
      COMMENT = 'Triangle display name',
    ULTIMATES.LATEST_DEV_DIM AS LATEST_DEV_MONTH
      COMMENT = 'Latest dev month'
  )
  METRICS (
    ULTIMATES.TOTAL_ULTIMATE AS SUM(ULTIMATE_LOSS)
      COMMENT = 'Total projected ultimate in $M',
    ULTIMATES.TOTAL_IBNR AS SUM(IBNR)
      COMMENT = 'Total IBNR in $M',
    ULTIMATES.TOTAL_REPORTED AS SUM(REPORTED_LOSS)
      COMMENT = 'Total reported loss in $M',
    ULTIMATES.AVG_CDF AS AVG(CDF)
      COMMENT = 'Average CDF across AYs'
  )
  COMMENT = 'Auto insurance loss triangle analysis. Values in $M.';

-- --------------------------------------------------------------------------
-- 2. CORTEX AGENT
-- --------------------------------------------------------------------------
-- The agent uses the Semantic View to translate natural-language questions
-- into SQL queries. It runs against a warehouse you specify below.
--
-- IMPORTANT: Update the warehouse name if yours differs from COMPUTE_WH.

CREATE OR REPLACE AGENT LOSS_TRIANGLE_AGENT
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
      semantic_view: LOSS_TRIANGLE_SV
      execution_environment:
        type: warehouse
        warehouse: COMPUTE_WH
  $$
  COMMENT = 'Actuarial assistant for loss triangle analysis';

-- --------------------------------------------------------------------------
-- 3. VERIFICATION
-- --------------------------------------------------------------------------
-- Test the agent with a sample question. The response is JSON; extract the
-- text content with LATERAL FLATTEN.

SELECT f.value:text::STRING AS agent_response
FROM (
  SELECT TRY_PARSE_JSON(
    SNOWFLAKE.CORTEX.DATA_AGENT_RUN(
      'LOSS_TRIANGLE_AGENT',
      '{"messages":[{"role":"user","content":[{"type":"text","text":"What is the total IBNR estimate for the portfolio?"}]}]}',
      TRUE
    )
  ) AS resp
) r,
LATERAL FLATTEN(input => r.resp:content) f
WHERE f.value:type::STRING = 'text'
LIMIT 1;
