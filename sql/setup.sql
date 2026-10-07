-- ============================================================================
-- Loss Triangle Actuarial Analysis — Snowflake Setup Script
-- ============================================================================
-- Schema  : LOSS_TRIANGLES
-- Purpose : Creates tables, seed data, and analytical views for paid loss
--           triangle analysis using the chain-ladder (volume-weighted)
--           development method.
--
-- Triangles included:
--   1. collision-overall    (Collision — All tiers)
--   2. collision-tier1      (Collision — Tier 1)
--   3. collision-tier2      (Collision — Tier 2)
--   4. comprehensive-overall (Comprehensive — All tiers)
--   5. liability-overall    (Liability — All tiers)
--
-- Evaluation date : 2024-12-31
-- Accident years  : 2017–2024
-- Dev months      : 12, 24, 36, 48, 60, 72, 84, 96
-- Values in $M (millions)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. SCHEMA
-- --------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS LOSS_TRIANGLES;
USE SCHEMA LOSS_TRIANGLES;

-- --------------------------------------------------------------------------
-- 2. TABLES
-- --------------------------------------------------------------------------

CREATE OR REPLACE TABLE paid_loss_triangles (
    triangle_id     VARCHAR(50)   NOT NULL,
    triangle_name   VARCHAR(100)  NOT NULL,
    coverage        VARCHAR(20)   NOT NULL,   -- collision, comprehensive, liability
    segment         VARCHAR(20)   NOT NULL,   -- overall, tier1, tier2
    eval_date       DATE          NOT NULL,
    accident_year   INT           NOT NULL,
    dev_month       INT           NOT NULL,
    cumulative_paid FLOAT         NOT NULL,
    PRIMARY KEY (triangle_id, accident_year, dev_month)
);

CREATE OR REPLACE TABLE selected_factors (
    triangle_id      VARCHAR(50) NOT NULL,
    dev_period_from  INT         NOT NULL,
    dev_period_to    INT         NOT NULL,
    selected_ldf     FLOAT       NOT NULL,
    PRIMARY KEY (triangle_id, dev_period_from)
);

CREATE OR REPLACE TABLE tail_factors (
    triangle_id  VARCHAR(50) NOT NULL PRIMARY KEY,
    tail_factor  FLOAT       NOT NULL
);

CREATE OR REPLACE TABLE prior_ultimates (
    triangle_id    VARCHAR(50) NOT NULL,
    accident_year  INT         NOT NULL,
    prior_ultimate FLOAT       NOT NULL,
    PRIMARY KEY (triangle_id, accident_year)
);

-- --------------------------------------------------------------------------
-- 3. SEED DATA — Paid Loss Triangles
-- --------------------------------------------------------------------------

-- ----- Collision — Overall -----
INSERT INTO paid_loss_triangles
    (triangle_id, triangle_name, coverage, segment, eval_date, accident_year, dev_month, cumulative_paid)
VALUES
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,12,143.8),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,24,195.1),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,36,217.2),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,48,225.5),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,60,228.8),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,72,230.7),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,84,231.5),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2017,96,232.0),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,12,150.7),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,24,204.1),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,36,228.0),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,48,236.8),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,60,240.1),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,72,241.8),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,84,242.5),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2018,96,243.0),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2019,12,154.4),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2019,24,208.7),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2019,36,233.1),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2019,48,242.0),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2019,60,245.5),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2019,72,247.4),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2019,84,248.2),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2020,12,109.7),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2020,24,170.7),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2020,36,199.9),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2020,48,208.8),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2020,60,212.3),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2020,72,214.5),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2021,12,168.4),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2021,24,232.1),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2021,36,259.7),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2021,48,269.2),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2021,60,272.8),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2022,12,175.5),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2022,24,242.2),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2022,36,279.2),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2022,48,290.1),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2023,12,168.1),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2023,24,233.6),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2023,36,261.5),
    ('collision-overall','Collision - Overall','collision','overall','2024-12-31',2024,12,162.4);

-- ----- Collision — Tier 1 -----
INSERT INTO paid_loss_triangles
    (triangle_id, triangle_name, coverage, segment, eval_date, accident_year, dev_month, cumulative_paid)
VALUES
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,12,83.4),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,24,113.2),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,36,126.0),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,48,130.8),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,60,132.7),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,72,133.8),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,84,134.3),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2017,96,134.6),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,12,87.4),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,24,118.4),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,36,132.2),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,48,137.3),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,60,139.3),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,72,140.2),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,84,140.7),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2018,96,141.0),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2019,12,89.6),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2019,24,121.1),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2019,36,135.2),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2019,48,140.4),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2019,60,142.4),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2019,72,143.5),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2019,84,144.0),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2020,12,65.8),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2020,24,101.4),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2020,36,117.7),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2020,48,122.8),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2020,60,124.9),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2020,72,126.1),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2021,12,97.7),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2021,24,134.6),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2021,36,150.6),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2021,48,156.2),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2021,60,158.4),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2022,12,101.8),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2022,24,140.5),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2022,36,164.8),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2022,48,171.2),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2023,12,97.5),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2023,24,135.5),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2023,36,153.7),
    ('collision-tier1','Collision - Tier 1','collision','tier1','2024-12-31',2024,12,94.2);

-- ----- Collision — Tier 2 -----
INSERT INTO paid_loss_triangles
    (triangle_id, triangle_name, coverage, segment, eval_date, accident_year, dev_month, cumulative_paid)
VALUES
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,12,60.4),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,24,81.9),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,36,91.2),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,48,94.7),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,60,96.1),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,72,96.9),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,84,97.2),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2017,96,97.4),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,12,63.3),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,24,85.7),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,36,95.8),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,48,99.5),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,60,100.8),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,72,101.6),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,84,101.8),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2018,96,102.0),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2019,12,64.8),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2019,24,87.6),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2019,36,97.9),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2019,48,101.6),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2019,60,103.1),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2019,72,103.9),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2019,84,104.2),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2020,12,43.9),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2020,24,69.3),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2020,36,82.2),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2020,48,86.0),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2020,60,87.4),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2020,72,88.4),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2021,12,70.7),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2021,24,97.5),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2021,36,109.1),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2021,48,113.0),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2021,60,114.4),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2022,12,73.7),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2022,24,101.7),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2022,36,114.4),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2022,48,118.9),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2023,12,70.6),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2023,24,98.1),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2023,36,107.8),
    ('collision-tier2','Collision - Tier 2','collision','tier2','2024-12-31',2024,12,68.2);

-- ----- Comprehensive — Overall -----
INSERT INTO paid_loss_triangles
    (triangle_id, triangle_name, coverage, segment, eval_date, accident_year, dev_month, cumulative_paid)
VALUES
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,12,72.5),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,24,88.1),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,36,93.8),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,48,96.1),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,60,97.1),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,72,97.6),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,84,97.9),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2017,96,98.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,12,77.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,24,93.5),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,36,99.8),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,48,102.2),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,60,103.1),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,72,103.5),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,84,103.8),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2018,96,104.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2019,12,80.7),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2019,24,98.2),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2019,36,104.5),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2019,48,107.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2019,60,108.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2019,72,108.5),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2019,84,108.7),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2020,12,63.5),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2020,24,79.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2020,36,85.2),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2020,48,87.4),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2020,60,88.3),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2020,72,88.7),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2021,12,86.2),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2021,24,104.8),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2021,36,112.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2021,48,114.9),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2021,60,116.0),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2022,12,89.1),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2022,24,108.8),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2022,36,116.1),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2022,48,119.2),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2023,12,84.7),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2023,24,103.4),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2023,36,110.2),
    ('comprehensive-overall','Comprehensive - Overall','comprehensive','overall','2024-12-31',2024,12,81.8);

-- ----- Liability — Overall -----
INSERT INTO paid_loss_triangles
    (triangle_id, triangle_name, coverage, segment, eval_date, accident_year, dev_month, cumulative_paid)
VALUES
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,12,32.5),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,24,51.5),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,36,62.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,48,68.6),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,60,72.1),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,72,74.5),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,84,76.0),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2017,96,77.2),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2018,12,35.1),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2018,24,55.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2018,36,67.1),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2018,48,73.8),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2018,60,77.6),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2018,72,80.0),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2018,84,81.6),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2019,12,36.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2019,24,57.4),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2019,36,69.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2019,48,76.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2019,60,80.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2019,72,82.9),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2020,12,27.4),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2020,24,45.1),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2020,36,57.7),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2020,48,64.6),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2020,60,68.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2021,12,38.2),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2021,24,60.8),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2021,36,73.7),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2021,48,81.2),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2022,12,40.8),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2022,24,64.5),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2022,36,79.3),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2023,12,38.9),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2023,24,61.6),
    ('liability-overall','Liability - Overall','liability','overall','2024-12-31',2024,12,37.1);

-- --------------------------------------------------------------------------
-- 4. SEED DATA — Selected Development Factors (LDFs)
-- --------------------------------------------------------------------------
-- 7 transitions: 12→24, 24→36, 36→48, 48→60, 60→72, 72→84, 84→96

INSERT INTO selected_factors (triangle_id, dev_period_from, dev_period_to, selected_ldf) VALUES
    ('collision-overall', 12, 24, 1.364),
    ('collision-overall', 24, 36, 1.122),
    ('collision-overall', 36, 48, 1.040),
    ('collision-overall', 48, 60, 1.017),
    ('collision-overall', 60, 72, 1.009),
    ('collision-overall', 72, 84, 1.004),
    ('collision-overall', 84, 96, 1.002),
    ('collision-tier1', 12, 24, 1.423),
    ('collision-tier1', 24, 36, 1.133),
    ('collision-tier1', 36, 48, 1.042),
    ('collision-tier1', 48, 60, 1.018),
    ('collision-tier1', 60, 72, 1.010),
    ('collision-tier1', 72, 84, 1.004),
    ('collision-tier1', 84, 96, 1.002),
    ('collision-tier2', 12, 24, 1.318),
    ('collision-tier2', 24, 36, 1.112),
    ('collision-tier2', 36, 48, 1.038),
    ('collision-tier2', 48, 60, 1.016),
    ('collision-tier2', 60, 72, 1.008),
    ('collision-tier2', 72, 84, 1.003),
    ('collision-tier2', 84, 96, 1.002),
    ('comprehensive-overall', 12, 24, 1.216),
    ('comprehensive-overall', 24, 36, 1.068),
    ('comprehensive-overall', 36, 48, 1.026),
    ('comprehensive-overall', 48, 60, 1.011),
    ('comprehensive-overall', 60, 72, 1.005),
    ('comprehensive-overall', 72, 84, 1.002),
    ('comprehensive-overall', 84, 96, 1.001),
    ('liability-overall', 12, 24, 1.592),
    ('liability-overall', 24, 36, 1.257),
    ('liability-overall', 36, 48, 1.122),
    ('liability-overall', 48, 60, 1.058),
    ('liability-overall', 60, 72, 1.032),
    ('liability-overall', 72, 84, 1.018),
    ('liability-overall', 84, 96, 1.010);

-- --------------------------------------------------------------------------
-- 5. SEED DATA — Tail Factors
-- --------------------------------------------------------------------------

INSERT INTO tail_factors (triangle_id, tail_factor) VALUES
    ('collision-overall',      1.018),
    ('collision-tier1',        1.020),
    ('collision-tier2',        1.016),
    ('comprehensive-overall',  1.010),
    ('liability-overall',      1.042);

-- --------------------------------------------------------------------------
-- 6. SEED DATA — Prior Ultimates
-- --------------------------------------------------------------------------
-- Computed as: latest_diagonal × CDF_at_latest_dev × 0.97
-- Represents prior-year reserve estimates (~97% of current chain-ladder).

INSERT INTO prior_ultimates (triangle_id, accident_year, prior_ultimate) VALUES
    -- collision-overall
    ('collision-overall', 2017, 229.1),
    ('collision-overall', 2018, 240.0),
    ('collision-overall', 2019, 245.6),
    ('collision-overall', 2020, 213.1),
    ('collision-overall', 2021, 273.4),
    ('collision-overall', 2022, 295.7),
    ('collision-overall', 2023, 277.2),
    ('collision-overall', 2024, 263.5),
    -- collision-tier1
    ('collision-tier1', 2017, 133.2),
    ('collision-tier1', 2018, 139.5),
    ('collision-tier1', 2019, 142.8),
    ('collision-tier1', 2020, 125.5),
    ('collision-tier1', 2021, 159.2),
    ('collision-tier1', 2022, 175.2),
    ('collision-tier1', 2023, 163.9),
    ('collision-tier1', 2024, 162.0),
    -- collision-tier2
    ('collision-tier2', 2017, 96.0),
    ('collision-tier2', 2018, 100.5),
    ('collision-tier2', 2019, 102.9),
    ('collision-tier2', 2020, 87.6),
    ('collision-tier2', 2021, 114.2),
    ('collision-tier2', 2022, 120.6),
    ('collision-tier2', 2023, 113.5),
    ('collision-tier2', 2024, 105.2),
    -- comprehensive-overall
    ('comprehensive-overall', 2017, 96.0),
    ('comprehensive-overall', 2018, 101.9),
    ('comprehensive-overall', 2019, 106.6),
    ('comprehensive-overall', 2020, 87.2),
    ('comprehensive-overall', 2021, 114.6),
    ('comprehensive-overall', 2022, 119.0),
    ('comprehensive-overall', 2023, 112.9),
    ('comprehensive-overall', 2024, 108.8),
    -- liability-overall
    ('liability-overall', 2017, 78.0),
    ('liability-overall', 2018, 83.3),
    ('liability-overall', 2019, 86.2),
    ('liability-overall', 2020, 73.3),
    ('liability-overall', 2021, 92.1),
    ('liability-overall', 2022, 101.0),
    ('liability-overall', 2023, 98.6),
    ('liability-overall', 2024, 94.5);

-- --------------------------------------------------------------------------
-- 7. VIEW — V_LINK_RATIOS  (Age-to-age development factors)
-- --------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_link_ratios AS
WITH pairs AS (
    SELECT
        a.triangle_id,
        a.accident_year,
        a.dev_month                           AS dev_from,
        b.dev_month                           AS dev_to,
        a.cumulative_paid                     AS paid_from,
        b.cumulative_paid                     AS paid_to,
        b.cumulative_paid / NULLIF(a.cumulative_paid, 0) AS link_ratio
    FROM paid_loss_triangles a
    JOIN paid_loss_triangles b
      ON  a.triangle_id  = b.triangle_id
      AND a.accident_year = b.accident_year
      AND b.dev_month     = a.dev_month + 12
),
ranked AS (
    SELECT
        p.*,
        ROW_NUMBER() OVER (
            PARTITION BY p.triangle_id, p.dev_from
            ORDER BY p.accident_year DESC
        ) AS recency_rank
    FROM pairs p
)
SELECT
    r.triangle_id,
    r.dev_from,
    r.dev_to,
    r.accident_year,
    r.link_ratio,
    -- Volume-weighted 3-year average
    SUM(CASE WHEN r.recency_rank <= 3 THEN r.paid_to   END)
        OVER (PARTITION BY r.triangle_id, r.dev_from)
    / NULLIF(
        SUM(CASE WHEN r.recency_rank <= 3 THEN r.paid_from END)
            OVER (PARTITION BY r.triangle_id, r.dev_from), 0
      ) AS volume_weighted_3yr,
    -- Volume-weighted 5-year average
    SUM(CASE WHEN r.recency_rank <= 5 THEN r.paid_to   END)
        OVER (PARTITION BY r.triangle_id, r.dev_from)
    / NULLIF(
        SUM(CASE WHEN r.recency_rank <= 5 THEN r.paid_from END)
            OVER (PARTITION BY r.triangle_id, r.dev_from), 0
      ) AS volume_weighted_5yr,
    -- Simple 3-year average
    AVG(CASE WHEN r.recency_rank <= 3 THEN r.link_ratio END)
        OVER (PARTITION BY r.triangle_id, r.dev_from) AS simple_avg_3yr,
    -- Simple 5-year average
    AVG(CASE WHEN r.recency_rank <= 5 THEN r.link_ratio END)
        OVER (PARTITION BY r.triangle_id, r.dev_from) AS simple_avg_5yr
FROM ranked r;

-- --------------------------------------------------------------------------
-- 8. VIEW — V_CDFS  (Cumulative Development Factors to ultimate)
-- --------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_cdfs AS
WITH dev_periods AS (
    SELECT DISTINCT triangle_id, dev_period_from AS dev_month
    FROM selected_factors
    UNION
    SELECT DISTINCT triangle_id, MAX(dev_period_to)
    FROM selected_factors
    GROUP BY triangle_id
),
max_dev AS (
    SELECT triangle_id, MAX(dev_month) AS max_dev_month
    FROM dev_periods
    GROUP BY triangle_id
),
-- Recursive CDF build: start at the max dev month (CDF = tail),
-- then walk backwards multiplying by each LDF.
cdf_recursive AS (
    -- Base case: CDF at the maximum development month = tail factor
    SELECT
        d.triangle_id,
        d.max_dev_month AS dev_month,
        t.tail_factor   AS cdf_to_ultimate
    FROM max_dev d
    JOIN tail_factors t ON t.triangle_id = d.triangle_id

    UNION ALL

    -- Recursive step: CDF at earlier dev = LDF × CDF at later dev
    SELECT
        c.triangle_id,
        sf.dev_period_from AS dev_month,
        sf.selected_ldf * c.cdf_to_ultimate AS cdf_to_ultimate
    FROM cdf_recursive c
    JOIN selected_factors sf
      ON  sf.triangle_id   = c.triangle_id
      AND sf.dev_period_to = c.dev_month
)
SELECT
    triangle_id,
    dev_month,
    ROUND(cdf_to_ultimate, 6) AS cdf_to_ultimate
FROM cdf_recursive
ORDER BY triangle_id, dev_month;

-- --------------------------------------------------------------------------
-- 9. VIEW — V_ULTIMATES  (Projected ultimate losses & IBNR)
-- --------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_ultimates AS
WITH latest_diagonal AS (
    SELECT
        triangle_id,
        accident_year,
        MAX(dev_month) AS latest_dev_month,
        MAX_BY(cumulative_paid, dev_month) AS reported_loss
    FROM paid_loss_triangles
    GROUP BY triangle_id, accident_year
)
SELECT
    d.triangle_id,
    d.accident_year,
    d.latest_dev_month,
    d.reported_loss,
    c.cdf_to_ultimate                              AS cdf,
    ROUND(d.reported_loss * c.cdf_to_ultimate, 2)  AS ultimate_loss,
    ROUND(d.reported_loss * c.cdf_to_ultimate
          - d.reported_loss, 2)                    AS ibnr
FROM latest_diagonal d
JOIN v_cdfs c
  ON  c.triangle_id = d.triangle_id
  AND c.dev_month   = d.latest_dev_month
ORDER BY d.triangle_id, d.accident_year;

-- --------------------------------------------------------------------------
-- 10. VIEW — V_PORTFOLIO_KPIS  (Portfolio-level summary)
-- --------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_portfolio_kpis AS
WITH current_totals AS (
    SELECT
        SUM(reported_loss)  AS total_reported,
        SUM(ibnr)           AS total_ibnr,
        SUM(ultimate_loss)  AS total_ultimate,
        COUNT(DISTINCT triangle_id) AS active_triangles
    FROM v_ultimates
),
prior_totals AS (
    SELECT SUM(prior_ultimate) AS prior_total_ultimate
    FROM prior_ultimates
)
SELECT
    ROUND(ct.total_reported, 2)                         AS total_reported,
    ROUND(ct.total_ibnr, 2)                             AS total_ibnr,
    ROUND(ct.total_ultimate, 2)                          AS total_ultimate,
    ct.active_triangles,
    '2024-12-31'::DATE                                   AS eval_date,
    ROUND(pt.prior_total_ultimate, 2)                    AS prior_total_ultimate,
    ROUND(ct.total_ultimate - pt.prior_total_ultimate, 2) AS change_from_prior,
    ROUND((ct.total_ultimate - pt.prior_total_ultimate)
          / NULLIF(pt.prior_total_ultimate, 0) * 100, 2) AS change_pct
FROM current_totals ct
CROSS JOIN prior_totals pt;

-- --------------------------------------------------------------------------
-- 11. VIEW — V_RESERVE_WATERFALL
-- --------------------------------------------------------------------------
-- Simplified reserve-change waterfall from prior to current estimate.

CREATE OR REPLACE VIEW v_reserve_waterfall AS
WITH
-- Sum of prior ultimates = starting point
prior_carried AS (
    SELECT SUM(prior_ultimate) AS amount FROM prior_ultimates
),
-- Current ultimates by triangle/AY
curr AS (
    SELECT triangle_id, accident_year, ultimate_loss, ibnr
    FROM v_ultimates
),
-- Current total
current_estimate AS (
    SELECT SUM(ultimate_loss) AS amount FROM curr
),
-- Development on recent AYs (2022+, excluding brand-new 2024)
recent_development AS (
    SELECT
        SUM(u.ultimate_loss - p.prior_ultimate) AS amount
    FROM v_ultimates u
    JOIN prior_ultimates p
      ON  p.triangle_id  = u.triangle_id
      AND p.accident_year = u.accident_year
    WHERE u.accident_year BETWEEN 2022 AND 2023
),
-- New year emergence (AY 2024 ultimate)
new_year AS (
    SELECT SUM(ultimate_loss) AS amount
    FROM v_ultimates
    WHERE accident_year = 2024
),
-- Prior AY 2024 ultimates (for netting)
prior_new_year AS (
    SELECT SUM(prior_ultimate) AS amount
    FROM prior_ultimates
    WHERE accident_year = 2024
),
-- Favorable run-off on mature AYs (2017-2021)
favorable_runoff AS (
    SELECT
        SUM(u.ultimate_loss - p.prior_ultimate) AS amount
    FROM v_ultimates u
    JOIN prior_ultimates p
      ON  p.triangle_id  = u.triangle_id
      AND p.accident_year = u.accident_year
    WHERE u.accident_year BETWEEN 2017 AND 2021
),
-- Tail revision: difference if tail factors deviate from a 1.015 baseline
tail_revision AS (
    SELECT
        SUM(u.reported_loss * (tf.tail_factor - 1.015) / tf.tail_factor) AS amount
    FROM v_ultimates u
    JOIN tail_factors tf ON tf.triangle_id = u.triangle_id
)
SELECT 1 AS sort_order, 'Prior Carried'        AS category, ROUND(amount, 1) AS amount FROM prior_carried
UNION ALL
SELECT 2, 'Recent AY Development (2022-2023)',  ROUND(amount, 1) FROM recent_development
UNION ALL
SELECT 3, 'New Year Emergence (AY 2024)',        ROUND(amount - COALESCE(pny.amount, 0), 1)
  FROM new_year CROSS JOIN prior_new_year pny
UNION ALL
SELECT 4, 'Tail Revision vs 1.015 Baseline',    ROUND(amount, 1) FROM tail_revision
UNION ALL
SELECT 5, 'Favorable Run-off (2017-2021)',       ROUND(amount, 1) FROM favorable_runoff
UNION ALL
SELECT 6, 'Current Estimate',                   ROUND(amount, 1) FROM current_estimate
ORDER BY sort_order;

-- --------------------------------------------------------------------------
-- 12. VIEW — V_ANOMALIES  (Anomalous link ratios)
-- --------------------------------------------------------------------------
-- Flags link ratios more than 1.5 standard deviations from the period mean.

CREATE OR REPLACE VIEW v_anomalies AS
WITH base AS (
    SELECT
        triangle_id,
        dev_from,
        dev_to,
        accident_year,
        link_ratio
    FROM v_link_ratios
),
stats AS (
    SELECT
        triangle_id,
        dev_from,
        dev_to,
        AVG(link_ratio)    AS mean_ratio,
        STDDEV(link_ratio) AS stddev_ratio
    FROM base
    GROUP BY triangle_id, dev_from, dev_to
)
SELECT
    b.triangle_id,
    b.dev_from,
    b.dev_to,
    b.accident_year,
    ROUND(b.link_ratio, 6)   AS link_ratio,
    ROUND(s.mean_ratio, 6)   AS mean_ratio,
    ROUND(s.stddev_ratio, 6) AS stddev_ratio,
    CASE
        WHEN s.stddev_ratio > 0
         AND ABS(b.link_ratio - s.mean_ratio) > 1.5 * s.stddev_ratio
        THEN TRUE
        ELSE FALSE
    END AS is_anomalous
FROM base b
JOIN stats s
  ON  s.triangle_id = b.triangle_id
  AND s.dev_from    = b.dev_from
  AND s.dev_to      = b.dev_to
ORDER BY b.triangle_id, b.dev_from, b.accident_year;

-- --------------------------------------------------------------------------
-- 13. VERIFICATION
-- --------------------------------------------------------------------------

SELECT 'paid_loss_triangles'  AS table_name, COUNT(*) AS row_count FROM paid_loss_triangles
UNION ALL
SELECT 'selected_factors',    COUNT(*) FROM selected_factors
UNION ALL
SELECT 'tail_factors',        COUNT(*) FROM tail_factors
UNION ALL
SELECT 'prior_ultimates',     COUNT(*) FROM prior_ultimates
UNION ALL
SELECT 'v_link_ratios',       COUNT(*) FROM v_link_ratios
UNION ALL
SELECT 'v_cdfs',              COUNT(*) FROM v_cdfs
UNION ALL
SELECT 'v_ultimates',         COUNT(*) FROM v_ultimates
UNION ALL
SELECT 'v_anomalies',         COUNT(*) FROM v_anomalies
ORDER BY table_name;

SELECT '--- Portfolio KPIs ---' AS label;
SELECT * FROM v_portfolio_kpis;

SELECT '--- Reserve Waterfall ---' AS label;
SELECT * FROM v_reserve_waterfall;
