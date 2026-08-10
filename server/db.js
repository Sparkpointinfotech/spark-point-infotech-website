import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let dbMode = dbUrl ? 'pg' : (process.env.VERCEL ? 'fallback' : 'sqlite');

let pgPool = null;
let sqliteDb = null;

// Persistent Store for Vercel/Fallback Environments & Configuration
const fallbackFile = process.env.VERCEL ? '/tmp/submissions_store.json' : path.resolve(__dirname, 'submissions_store.json');
let fallbackStore = {
  admin_password: process.env.ADMIN_PASSWORD || 'SparkPoint2026!Admin',
  contact_submissions: [
    {
      id: 1,
      name: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+91 9876543210',
      company: 'Acme Corp',
      service: 'website',
      budget: '15k-35k',
      message: 'Looking for web application development.',
      created_at: new Date().toISOString()
    }
  ],
  talent_submissions: [
    {
      id: 1,
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 9876543210',
      role: 'Senior Full Stack Engineer',
      experience: '5-8',
      location: 'Indore',
      notice_period: '15days',
      resume_url: 'https://github.com/rahulsharma',
      created_at: new Date().toISOString()
    }
  ],
  contact_seq: 1,
  talent_seq: 1
};

function loadFallbackStore() {
  try {
    if (fs.existsSync(fallbackFile)) {
      const data = fs.readFileSync(fallbackFile, 'utf8');
      const loaded = JSON.parse(data);
      fallbackStore = { ...fallbackStore, ...loaded };
    } else {
      saveFallbackStore();
    }
  } catch (err) {
    console.warn('[DB Fallback] Store load warning:', err.message);
  }
}

function saveFallbackStore() {
  try {
    fs.writeFileSync(fallbackFile, JSON.stringify(fallbackStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('[DB Fallback] Store save warning:', err.message);
  }
}

loadFallbackStore();

export function getAdminPassword() {
  loadFallbackStore();
  return fallbackStore.admin_password || process.env.ADMIN_PASSWORD || 'SparkPoint2026!Admin';
}

export function setAdminPassword(newPassword) {
  loadFallbackStore();
  fallbackStore.admin_password = newPassword;
  saveFallbackStore();
  return true;
}

// Initialize Database Connection & Tables
export async function initDb() {
  if (dbMode === 'pg') {
    try {
      pgPool = new pg.Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          company TEXT,
          service TEXT,
          budget TEXT,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS talent_submissions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          role TEXT NOT NULL,
          experience TEXT,
          location TEXT,
          notice_period TEXT,
          resume_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[Database] Connected & initialized PostgreSQL Cloud');
      return;
    } catch (err) {
      console.warn('[Database] PG init error, switching to fallback mode:', err.message);
      dbMode = 'fallback';
    }
  }

  if (dbMode === 'sqlite') {
    try {
      const sqlite3Module = await import('sqlite3').catch(() => null);
      const sqlite3 = sqlite3Module?.default || sqlite3Module;
      if (sqlite3) {
        const dbPath = path.resolve(__dirname, 'database.db');
        sqliteDb = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.warn('[Database] SQLite init error, switching to fallback mode:', err.message);
            dbMode = 'fallback';
          } else {
            console.log(`[Database] Connected to SQLite database at: ${dbPath}`);
          }
        });

        return new Promise((resolve) => {
          sqliteDb.serialize(() => {
            sqliteDb.run(`
              CREATE TABLE IF NOT EXISTS contact_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                company TEXT,
                service TEXT,
                budget TEXT,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
              if (err) dbMode = 'fallback';
            });
            sqliteDb.run(`
              CREATE TABLE IF NOT EXISTS talent_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                role TEXT NOT NULL,
                experience TEXT,
                location TEXT,
                notice_period TEXT,
                resume_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )`, (err) => {
                if (err) dbMode = 'fallback';
                resolve();
              });
          });
        });
      } else {
        dbMode = 'fallback';
      }
    } catch (err) {
      console.warn('[Database] SQLite load error, switching to fallback mode:', err.message);
      dbMode = 'fallback';
    }
  }

  if (dbMode === 'fallback') {
    console.log('[Database] Active Mode: Pure JS Zero-Config Engine (Serverless persistent)');
  }
}

// Helper: Run Mutation Query
export const dbRun = async (sql, params = []) => {
  if (dbMode === 'pg' && pgPool) {
    try {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
      const finalSql = isInsert ? `${pgSql} RETURNING id` : pgSql;
      const res = await pgPool.query(finalSql, params);
      return { lastID: res.rows[0]?.id || 0, rowCount: res.rowCount };
    } catch (err) {
      console.warn('[Database] PG Run error, using fallback:', err.message);
      dbMode = 'fallback';
    }
  }
  
  if (dbMode === 'sqlite' && sqliteDb) {
    try {
      return await new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, rowCount: this.changes });
        });
      });
    } catch (err) {
      console.warn('[Database] SQLite Run error, using fallback:', err.message);
      dbMode = 'fallback';
    }
  }

  // Fallback Engine
  loadFallbackStore();
  const normalizedSql = sql.trim().toUpperCase();

  if (normalizedSql.startsWith('INSERT INTO CONTACT_SUBMISSIONS')) {
    const newId = ++fallbackStore.contact_seq;
    const record = {
      id: newId,
      name: params[0],
      email: params[1],
      phone: params[2],
      company: params[3] || null,
      service: params[4] || null,
      budget: params[5] || null,
      message: params[6],
      created_at: new Date().toISOString()
    };
    fallbackStore.contact_submissions.unshift(record);
    saveFallbackStore();
    return { lastID: newId, rowCount: 1 };
  }

  if (normalizedSql.startsWith('INSERT INTO TALENT_SUBMISSIONS')) {
    const newId = ++fallbackStore.talent_seq;
    const record = {
      id: newId,
      name: params[0],
      email: params[1],
      phone: params[2],
      role: params[3],
      experience: params[4] || null,
      location: params[5] || null,
      notice_period: params[6] || null,
      resume_url: params[7] || null,
      created_at: new Date().toISOString()
    };
    fallbackStore.talent_submissions.unshift(record);
    saveFallbackStore();
    return { lastID: newId, rowCount: 1 };
  }

  if (normalizedSql.startsWith('DELETE FROM CONTACT_SUBMISSIONS WHERE ID =')) {
    const id = parseInt(params[0]);
    fallbackStore.contact_submissions = fallbackStore.contact_submissions.filter(r => r.id !== id);
    saveFallbackStore();
    return { lastID: 0, rowCount: 1 };
  }

  if (normalizedSql.startsWith('DELETE FROM TALENT_SUBMISSIONS WHERE ID =')) {
    const id = parseInt(params[0]);
    fallbackStore.talent_submissions = fallbackStore.talent_submissions.filter(r => r.id !== id);
    saveFallbackStore();
    return { lastID: 0, rowCount: 1 };
  }

  if (normalizedSql.includes('DELETE FROM CONTACT_SUBMISSIONS WHERE ID IN')) {
    const ids = params.map(id => parseInt(id));
    fallbackStore.contact_submissions = fallbackStore.contact_submissions.filter(r => !ids.includes(r.id));
    saveFallbackStore();
    return { lastID: 0, rowCount: ids.length };
  }

  if (normalizedSql.includes('DELETE FROM TALENT_SUBMISSIONS WHERE ID IN')) {
    const ids = params.map(id => parseInt(id));
    fallbackStore.talent_submissions = fallbackStore.talent_submissions.filter(r => !ids.includes(r.id));
    saveFallbackStore();
    return { lastID: 0, rowCount: ids.length };
  }

  if (normalizedSql === 'DELETE FROM CONTACT_SUBMISSIONS') {
    fallbackStore.contact_submissions = [];
    saveFallbackStore();
    return { lastID: 0, rowCount: 1 };
  }

  if (normalizedSql === 'DELETE FROM TALENT_SUBMISSIONS') {
    fallbackStore.talent_submissions = [];
    saveFallbackStore();
    return { lastID: 0, rowCount: 1 };
  }

  return { lastID: 0, rowCount: 0 };
};

// Helper: Query Rows
export const dbAll = async (sql, params = []) => {
  if (dbMode === 'pg' && pgPool) {
    try {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.warn('[Database] PG All error, using fallback:', err.message);
      dbMode = 'fallback';
    }
  }

  if (dbMode === 'sqlite' && sqliteDb) {
    try {
      return await new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    } catch (err) {
      console.warn('[Database] SQLite All error, using fallback:', err.message);
      dbMode = 'fallback';
    }
  }

  // Fallback Engine
  loadFallbackStore();
  const normalizedSql = sql.trim().toUpperCase();

  if (normalizedSql.includes('COUNT(*) AS COUNT FROM CONTACT_SUBMISSIONS') || normalizedSql.includes('COUNT(*) FROM CONTACT_SUBMISSIONS')) {
    return [{ count: fallbackStore.contact_submissions.length }];
  }

  if (normalizedSql.includes('COUNT(*) AS COUNT FROM TALENT_SUBMISSIONS') || normalizedSql.includes('COUNT(*) FROM TALENT_SUBMISSIONS')) {
    return [{ count: fallbackStore.talent_submissions.length }];
  }

  if (normalizedSql.includes('SELECT * FROM CONTACT_SUBMISSIONS WHERE ID =')) {
    const id = parseInt(params[0]);
    const found = fallbackStore.contact_submissions.find(r => r.id === id);
    return found ? [found] : [];
  }

  if (normalizedSql.includes('SELECT * FROM TALENT_SUBMISSIONS WHERE ID =')) {
    const id = parseInt(params[0]);
    const found = fallbackStore.talent_submissions.find(r => r.id === id);
    return found ? [found] : [];
  }

  if (normalizedSql.includes('CONTACT_SUBMISSIONS')) {
    return fallbackStore.contact_submissions;
  }

  if (normalizedSql.includes('TALENT_SUBMISSIONS')) {
    return fallbackStore.talent_submissions;
  }

  return [];
};

// Trigger table init
initDb().catch(err => console.error('[Database Init Error]:', err));

export default { dbRun, dbAll, initDb, getAdminPassword, setAdminPassword };
