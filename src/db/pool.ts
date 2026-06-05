import { Pool, PoolClient } from "pg";
import mybatisMapper from "mybatis-mapper";
import path from "path";

type ParamValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | null
  | undefined;
type Params = Record<string, ParamValue>;

type MapperParams = Record<
  string,
  string | number | boolean | string[] | number[] | null | undefined
>;

function normalizeParams(params: Params): MapperParams {
  const result: MapperParams = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = value instanceof Date ? value.toISOString() : value;
  }
  return result;
}

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "village_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  options: "-c client_encoding=UTF8",
});

const mapperDir = path.join(__dirname, "../../mapper");

mybatisMapper.createMapper([
  `${mapperDir}/auth.xml`,
  `${mapperDir}/farmer.xml`,
  `${mapperDir}/product.xml`,
  `${mapperDir}/cart.xml`,
  `${mapperDir}/order.xml`,
  `${mapperDir}/village.xml`,
  `${mapperDir}/file.xml`,
  `${mapperDir}/permission.xml`,
  `${mapperDir}/commonCode.xml`,
  `${mapperDir}/menu.xml`,
]);

// mybatis-mapper types are outdated; "postgresql" is supported at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const format = { language: "postgresql", indent: "  " } as any;

const isLogging = process.env.NODE_ENV !== "test";

const logSql = (namespace: string, sqlId: string, sql: string) => {
  if (!isLogging) return;
  console.log(`\x1b[36m[SQL]\x1b[0m ${namespace}.${sqlId}\n${sql.trim()}`);
};

const logSqlError = (namespace: string, sqlId: string, err: unknown) => {
  console.error(`\x1b[31m[SQL ERROR]\x1b[0m ${namespace}.${sqlId}`, err);
};

export const query = async <T = Record<string, unknown>>(
  namespace: string,
  sqlId: string,
  params: Params = {},
): Promise<T[]> => {
  const sql = mybatisMapper.getStatement(
    namespace,
    sqlId,
    normalizeParams(params),
    format,
  );
  logSql(namespace, sqlId, sql);
  try {
    const result = await pool.query(sql);
    return result.rows as T[];
  } catch (err) {
    logSqlError(namespace, sqlId, err);
    throw err;
  }
};

export const queryOne = async <T = Record<string, unknown>>(
  namespace: string,
  sqlId: string,
  params: Params = {},
): Promise<T | null> => {
  const rows = await query<T>(namespace, sqlId, params);
  return rows[0] ?? null;
};

export const execute = async (
  namespace: string,
  sqlId: string,
  params: Params = {},
): Promise<number> => {
  const sql = mybatisMapper.getStatement(
    namespace,
    sqlId,
    normalizeParams(params),
    format,
  );
  logSql(namespace, sqlId, sql);
  try {
    const result = await pool.query(sql);
    return result.rowCount ?? 0;
  } catch (err) {
    logSqlError(namespace, sqlId, err);
    throw err;
  }
};

export const withTransaction = async <T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const clientQuery = async <T = Record<string, unknown>>(
  client: PoolClient,
  namespace: string,
  sqlId: string,
  params: Params = {},
): Promise<T[]> => {
  const sql = mybatisMapper.getStatement(
    namespace,
    sqlId,
    normalizeParams(params),
    format,
  );
  logSql(namespace, sqlId, sql);
  try {
    const result = await client.query(sql);
    return result.rows as T[];
  } catch (err) {
    logSqlError(namespace, sqlId, err);
    throw err;
  }
};

export const clientQueryOne = async <T = Record<string, unknown>>(
  client: PoolClient,
  namespace: string,
  sqlId: string,
  params: Params = {},
): Promise<T | null> => {
  const rows = await clientQuery<T>(client, namespace, sqlId, params);
  return rows[0] ?? null;
};

export const clientExecute = async (
  client: PoolClient,
  namespace: string,
  sqlId: string,
  params: Params = {},
): Promise<number> => {
  const sql = mybatisMapper.getStatement(
    namespace,
    sqlId,
    normalizeParams(params),
    format,
  );
  logSql(namespace, sqlId, sql);
  try {
    const result = await client.query(sql);
    return result.rowCount ?? 0;
  } catch (err) {
    logSqlError(namespace, sqlId, err);
    throw err;
  }
};
