import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const openDb = async () => {
  return {
    get: async (sql, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows.length > 0 ? result.rows[0] : undefined;
      } finally {
        client.release();
      }
    },
    all: async (sql, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    },
    run: async (sql, params) => {
      const client = await pool.connect();
      try {
        await client.query(sql, params);
        return { lastID: null };
      } finally {
        client.release();
      }
    },
    exec: async (sql) => {
      const client = await pool.connect();
      try {
        await client.query(sql);
      } finally {
        client.release();
      }
    },
  };
};
export { pool };
