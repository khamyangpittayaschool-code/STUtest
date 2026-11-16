const { PGlite } = require('@electric-sql/pglite');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const TABLES = [
  'profiles',
  'activities',
  'code_batches',
  'activity_codes',
  'user_scores',
  'posts',
  'comments',
  'assignments',
  'submissions',
  'audit_logs'
];

const DB_DIR = path.join(__dirname, '..', 'data', 'pgdata');
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'backup_latest.json');

async function getLocalDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new PGlite(DB_DIR);
  await db.waitReady;
  return db;
}

async function exportLocal() {
  console.log('📦 กำลังสำรองข้อมูลจาก Local Database ไปยัง data/backup_latest.json...');
  const db = await getLocalDb();
  const backup = {
    exported_at: new Date().toISOString(),
    data: {}
  };

  for (const t of TABLES) {
    try {
      const res = await db.query(`SELECT * FROM public.${t};`);
      backup.data[t] = res.rows || [];
      console.log(`  ✓ ${t}: ${res.rows.length} รายการ`);
    } catch (e) {
      console.log(`  ⚠ ${t}: ${e.message}`);
      backup.data[t] = [];
    }
  }

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\n✅ สำรองข้อมูลเรียบร้อยแล้ว บันทึกไว้ที่: ${BACKUP_FILE}`);
}

async function importToLocal(filePath = BACKUP_FILE) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ไม่พบไฟล์สำรองข้อมูล: ${filePath}`);
    return;
  }

  console.log(`📥 กำลังนำเข้าข้อมูลจาก ${filePath} เข้าสู่ Local Database...`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const backup = JSON.parse(raw);
  const db = await getLocalDb();

  for (const t of TABLES) {
    const rows = backup.data?.[t] || [];
    if (rows.length === 0) continue;

    console.log(`  นำเข้า ${t} (${rows.length} รายการ)...`);
    for (const row of rows) {
      const cols = Object.keys(row);
      const values = Object.values(row).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const colNames = cols.join(', ');

      try {
        await db.query(
          `INSERT INTO public.${t} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`,
          values
        );
      } catch (err) {
        // Continue on individual row error
      }
    }
    console.log(`  ✓ นำเข้า ${t} สำเร็จ`);
  }

  console.log('\n✅ นำเข้าข้อมูลเข้า Local Database เรียบร้อยแล้ว!');
}

async function pullFromSupabase() {
  const envPath = path.join(__dirname, '..', '.env.local');
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) connectionString = match[1];
  }

  if (!connectionString) {
    console.error('❌ ไม่พบ DATABASE_URL ใน .env.local');
    return;
  }

  console.log('🌐 กำลังพยายามเชื่อมต่อไปยัง Supabase...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('✓ เชื่อมต่อ Supabase สำเร็จ!');
    const backup = {
      exported_at: new Date().toISOString(),
      source: 'supabase',
      data: {}
    };

    for (const t of TABLES) {
      try {
        const res = await client.query(`SELECT * FROM public.${t};`);
        backup.data[t] = res.rows || [];
        console.log(`  ✓ ดึงข้อมูล ${t}: ${res.rows.length} รายการ`);
      } catch (e) {
        console.log(`  ⚠ ${t}: ${e.message}`);
        backup.data[t] = [];
      }
    }

    client.release();
    await pool.end();

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf-8');
    console.log(`\n💾 บันทึกข้อมูล Supabase ลง data/backup_latest.json สำเร็จ`);

    // Import into local
    await importToLocal(BACKUP_FILE);
  } catch (err) {
    console.error('\n❌ ไม่สามารถเชื่อมต่อ Supabase ได้ในขณะนี้:');
    console.error(`  สาเหตุ: ${err.message}`);
    console.log('\n💡 คำแนะนำ:');
    console.log('  หาก Supabase พักการทำงาน (Paused) อยู่ คุณครูสามารถเข้าไปที่ https://supabase.com/dashboard');
    console.log('  แล้วกดปุ่ม "Restore project" หรือ "Unpause" จากนั้นรันคำสั่งนี้อีกครั้งเพื่อดึงข้อมูล');
    console.log('  (แต่ระหว่างนี้ ระบบในเครื่องจะใช้ฐานข้อมูล Local ทำงานได้ตามปกติ 100% โดยไม่ต้องพึ่งพา Supabase แล้วครับ)');
  }
}

const command = process.argv[2] || 'export';
if (command === 'export') {
  exportLocal().catch(console.error);
} else if (command === 'import') {
  importToLocal().catch(console.error);
} else if (command === 'pull-supabase') {
  pullFromSupabase().catch(console.error);
} else {
  console.log('คำสั่งที่รองรับ: node scripts/db-sync.js [export | import | pull-supabase]');
}
