import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'progress.db');
const jsonDbPath = join(__dirname, 'progress.json');

const app = express();
app.use(cors());
app.use(express.json());

function defaultProgress(userId) {
    return {
        user_id: userId,
        display_name: null,
        xp: 0,
        completed_modules: [],
        completed_lessons: [],
        badges: []
    };
}

function normalizeProgressRecord(input) {
    return {
        user_id: input.user_id,
        display_name: input.display_name ?? null,
        xp: Number.isFinite(input.xp) ? input.xp : 0,
        completed_modules: Array.isArray(input.completed_modules) ? input.completed_modules : [],
        completed_lessons: Array.isArray(input.completed_lessons) ? input.completed_lessons : [],
        badges: Array.isArray(input.badges) ? input.badges : []
    };
}

async function createJsonAdapter() {
    let store = {};
    try {
        const raw = await fs.readFile(jsonDbPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            store = parsed;
        }
    } catch {
        store = {};
    }

    const persist = async () => {
        await fs.writeFile(jsonDbPath, JSON.stringify(store, null, 2));
    };

    return {
        type: 'json',
        async getByUserId(userId) {
            return store[userId] ? normalizeProgressRecord(store[userId]) : null;
        },
        async getByWallet(wallet) {
            return store[wallet] ? normalizeProgressRecord(store[wallet]) : null;
        },
        async migrateWalletToUser(userId, wallet) {
            const walletRecord = store[wallet];
            if (!walletRecord) return null;
            const migrated = normalizeProgressRecord({ ...walletRecord, user_id: userId });
            store[userId] = migrated;
            delete store[wallet];
            await persist();
            return migrated;
        },
        async upsert(progressRecord) {
            const normalized = normalizeProgressRecord(progressRecord);
            store[normalized.user_id] = normalized;
            await persist();
            return normalized;
        },
        async leaderboard(limit) {
            return Object.values(store)
                .map(normalizeProgressRecord)
                .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                .slice(0, limit)
                .map(({ user_id, display_name, xp, badges }) => ({ user_id, display_name, xp, badges }));
        }
    };
}

function createSqliteAdapter(db) {
    const run = (query, params = []) => new Promise((resolve, reject) => {
        db.run(query, params, function onRun(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const get = (query, params = []) => new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });

    const all = (query, params = []) => new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    const fromRow = (row) => {
        if (!row) return null;
        return normalizeProgressRecord({
            user_id: row.user_id,
            display_name: row.display_name,
            xp: row.xp,
            completed_modules: JSON.parse(row.completed_modules || '[]'),
            completed_lessons: JSON.parse(row.completed_lessons || '[]'),
            badges: JSON.parse(row.badges || '[]')
        });
    };

    return {
        type: 'sqlite',
        async getByUserId(userId) {
            const row = await get('SELECT * FROM user_progress WHERE user_id = ?', [userId]);
            return fromRow(row);
        },
        async getByWallet(wallet) {
            const row = await get('SELECT * FROM user_progress WHERE user_id = ?', [wallet]);
            return fromRow(row);
        },
        async migrateWalletToUser(userId, wallet) {
            const row = await get('SELECT * FROM user_progress WHERE user_id = ?', [wallet]);
            if (!row) return null;
            await run('UPDATE user_progress SET user_id = ? WHERE user_id = ?', [userId, wallet]);
            return fromRow({ ...row, user_id: userId });
        },
        async upsert(progressRecord) {
            const normalized = normalizeProgressRecord(progressRecord);
            const query = `
                INSERT INTO user_progress (user_id, display_name, xp, completed_modules, completed_lessons, badges)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    display_name = COALESCE(excluded.display_name, user_progress.display_name),
                    xp = excluded.xp,
                    completed_modules = excluded.completed_modules,
                    completed_lessons = excluded.completed_lessons,
                    badges = excluded.badges
            `;
            await run(query, [
                normalized.user_id,
                normalized.display_name,
                normalized.xp,
                JSON.stringify(normalized.completed_modules),
                JSON.stringify(normalized.completed_lessons),
                JSON.stringify(normalized.badges)
            ]);
            return normalized;
        },
        async leaderboard(limit) {
            const rows = await all(
                'SELECT user_id, display_name, xp, badges FROM user_progress ORDER BY xp DESC LIMIT ?',
                [limit]
            );
            return rows.map((r) => ({
                user_id: r.user_id,
                display_name: r.display_name,
                xp: r.xp,
                badges: JSON.parse(r.badges || '[]')
            }));
        }
    };
}

async function createStorageAdapter() {
    try {
        const sqlite3Module = await import('sqlite3');
        const sqlite3 = sqlite3Module.default || sqlite3Module;
        const db = await new Promise((resolve, reject) => {
            const dbInstance = new sqlite3.Database(dbPath, (err) => {
                if (err) reject(err);
                else resolve(dbInstance);
            });
        });
        await new Promise((resolve, reject) => {
            db.run(
                `CREATE TABLE IF NOT EXISTS user_progress (
                    user_id TEXT PRIMARY KEY,
                    display_name TEXT,
                    xp INTEGER DEFAULT 0,
                    completed_modules TEXT DEFAULT '[]',
                    completed_lessons TEXT DEFAULT '[]',
                    badges TEXT DEFAULT '[]'
                )`,
                (err) => (err ? reject(err) : resolve())
            );
        });
        console.log('Progress storage: sqlite');
        return createSqliteAdapter(db);
    } catch (err) {
        console.warn('SQLite unavailable, falling back to JSON storage:', err?.message || err);
        const adapter = await createJsonAdapter();
        console.log(`Progress storage: json (${jsonDbPath})`);
        return adapter;
    }
}

const storage = await createStorageAdapter();

// Get progress for a user
app.get('/api/progress/:userId', async (req, res) => {
    const { userId } = req.params;
    const { wallet } = req.query || {};

    try {
        // First, look up by canonical userId
        const row = await storage.getByUserId(userId);
        if (row || !wallet || wallet === userId) {
            return res.json(row || defaultProgress(userId));
        }

        // If not found and a wallet address was provided, attempt migration:
        // move any existing wallet-keyed row to the canonical userId.
        const migrated = await storage.migrateWalletToUser(userId, wallet);
        return res.json(migrated || defaultProgress(userId));
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch progress' });
    }
});

// Update progress for a user
app.post('/api/progress', async (req, res) => {
    const { user_id, display_name, xp, completed_modules, completed_lessons, badges } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
    }

    try {
        await storage.upsert({
            user_id,
            display_name: display_name || null,
            xp: xp || 0,
            completed_modules: completed_modules || [],
            completed_lessons: completed_lessons || [],
            badges: badges || []
        });
        res.json({ success: true, message: "Progress updated successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to update progress' });
    }
});

// Leaderboard: Get top users by XP
app.get('/api/leaderboard', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    try {
        const rows = await storage.leaderboard(limit);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch leaderboard' });
    }
});

const PORT = process.env.PORT || 3101;
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
