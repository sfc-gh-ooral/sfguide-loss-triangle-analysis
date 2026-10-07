import snowflake from 'snowflake-sdk';

let connectionPool: snowflake.Connection | null = null;

function getConnectionConfig(): snowflake.ConnectionOptions {
  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const database = process.env.SNOWFLAKE_DATABASE;
  const schema = process.env.SNOWFLAKE_SCHEMA ?? 'LOSS_TRIANGLES';
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE;

  if (!account || !username || !database || !warehouse) {
    throw new Error(
      'Missing required Snowflake environment variables. ' +
      'Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_DATABASE, and SNOWFLAKE_WAREHOUSE.'
    );
  }

  const base: snowflake.ConnectionOptions = {
    account,
    username,
    database,
    schema,
    warehouse,
  };

  // Auth priority: PAT (OAuth token) > external browser SSO > key-pair > password
  const token = process.env.SNOWFLAKE_TOKEN;
  const privateKeyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const useBrowserAuth = process.env.SNOWFLAKE_BROWSER_AUTH === 'true';

  if (token) {
    return { ...base, authenticator: 'OAUTH', token };
  } else if (useBrowserAuth) {
    return { ...base, authenticator: 'EXTERNALBROWSER' };
  } else if (privateKeyPath) {
    return { ...base, authenticator: 'SNOWFLAKE_JWT', privateKeyPath };
  } else if (password) {
    return { ...base, password };
  }

  throw new Error('Set SNOWFLAKE_TOKEN, SNOWFLAKE_BROWSER_AUTH=true, SNOWFLAKE_PRIVATE_KEY_PATH, or SNOWFLAKE_PASSWORD.');
}

async function getConnection(): Promise<snowflake.Connection> {
  if (connectionPool && connectionPool.isUp()) {
    return connectionPool;
  }

  const config = getConnectionConfig();
  const conn = snowflake.createConnection(config);

  return new Promise((resolve, reject) => {
    conn.connect((err) => {
      if (err) {
        reject(new Error(`Snowflake connection failed: ${err.message}`));
      } else {
        connectionPool = conn;
        resolve(conn);
      }
    });
  });
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
}

export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  binds?: snowflake.Binds,
): Promise<QueryResult<T>> {
  const conn = await getConnection();

  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      binds,
      complete: (err, _stmt, rows) => {
        if (err) {
          reject(new Error(`Query failed: ${err.message}`));
        } else {
          resolve({ rows: (rows ?? []) as T[] });
        }
      },
    });
  });
}

export function isSnowflakeConfigured(): boolean {
  return !!(
    process.env.SNOWFLAKE_ACCOUNT &&
    process.env.SNOWFLAKE_USERNAME &&
    process.env.SNOWFLAKE_DATABASE &&
    process.env.SNOWFLAKE_WAREHOUSE &&
    (process.env.SNOWFLAKE_TOKEN || process.env.SNOWFLAKE_BROWSER_AUTH === 'true' || process.env.SNOWFLAKE_PRIVATE_KEY_PATH || process.env.SNOWFLAKE_PASSWORD)
  );
}
