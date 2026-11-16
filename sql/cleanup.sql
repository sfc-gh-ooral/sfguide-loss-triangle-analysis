-- ============================================================================
-- Loss Triangle Analysis: cleanup
-- Drops everything sql/setup.sql and sql/cortex-agent.sql created. Dropping the
-- database removes its schema, tables, views, semantic view, and Cortex Agent.
-- ============================================================================
USE ROLE ACCOUNTADMIN;

DROP DATABASE IF EXISTS LOSS_TRIANGLE_EXAMPLE;
DROP WAREHOUSE IF EXISTS LOSS_TRIANGLE_WH;
DROP ROLE IF EXISTS LOSS_TRIANGLE_ROLE;

-- If you registered a key pair only for this example, also run:
-- ALTER USER <YOUR_USER> UNSET RSA_PUBLIC_KEY_2;
