import { Pool } from 'pg';

let connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.myyhcokodllntnbqducu:flEudKiNVSbWAG8F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

if (connectionString.includes(':5432') || connectionString.includes('db.myyhcokodllntnbqducu.supabase.co')) {
  connectionString =
    'postgresql://postgres.myyhcokodllntnbqducu:flEudKiNVSbWAG8F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
}

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool: Pool =
  global._pgPool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
