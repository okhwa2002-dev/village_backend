import { Pool, PoolClient } from "pg";
import mybatisMapper from "mybatis-mapper";
import path from "path";

type Params = Record<
  string,
  string | number | boolean | string[] | number[] | null | undefined
>;

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
]);

const format = { language: "sql" as const, indent: "  " };

export const query = async <T = Record<string, unknown>>(
  namespace: string,
  sqlId: string,
  params: Params = {},
): Promise<T[]> => {
  const sql = mybatisMapper.getStatement(namespace, sqlId, params, format);
  const result = await pool.query(sql);
  return result.rows as T[];
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
  const sql = mybatisMapper.getStatement(namespace, sqlId, params, format);
  const result = await pool.query(sql);
  return result.rowCount ?? 0;
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
  const sql = mybatisMapper.getStatement(namespace, sqlId, params, format);
  const result = await client.query(sql);
  return result.rows as T[];
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
  const sql = mybatisMapper.getStatement(namespace, sqlId, params, format);
  const result = await client.query(sql);
  return result.rowCount ?? 0;
};
