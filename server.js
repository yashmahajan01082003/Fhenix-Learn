import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const dbPath = join(__dirname, 'progress.db');
const jsonDbPath = join(__dirname, 'progress.json');
const contractConfigPath = join(__dirname, 'contract-config.json');

const app = express();
app.use(cors());
app.use(express.json());

// Contract address storage
let contractConfig = {
    FhenixLearnBadge: null,
    network: 'arb-sepolia',
    chainId: 421614,
    lastUpdated: null
};

async function loadContractConfig() {
    try {
        const data = await fs.readFile(contractConfigPath, 'utf8');
        contractConfig = JSON.parse(data);
    } catch {
        // File doesn't exist, use defaults
    }

    const envBadgeAddress = process.env.FHENIX_LEARN_BADGE_ADDRESS || process.env.VITE_FHENIX_LEARN_BADGE_ADDRESS;
    if (envBadgeAddress) {
        contractConfig.FhenixLearnBadge = envBadgeAddress;
    }
}

async function saveContractConfig() {
    await fs.writeFile(contractConfigPath, JSON.stringify(contractConfig, null, 2));
}

loadContractConfig();

function defaultProgress(userId) {
    return {
        user_id: userId,
        display_name: null,
        xp: 0,
        completed_modules: [],
        completed_lessons: [],
        badges: [],
        wallet_address: null,
        contract_address: null,
        last_tx_hash: null
    };
}

function normalizeProgressRecord(input) {
    return {
        user_id: input.user_id,
        display_name: input.display_name ?? null,
        xp: Number.isFinite(input.xp) ? input.xp : 0,
        completed_modules: Array.isArray(input.completed_modules) ? input.completed_modules : [],
        completed_lessons: Array.isArray(input.completed_lessons) ? input.completed_lessons : [],
        badges: Array.isArray(input.badges) ? input.badges : [],
        wallet_address: input.wallet_address ?? input.walletAddress ?? null,
        contract_address: input.contract_address ?? input.contractAddress ?? null,
        last_tx_hash: input.last_tx_hash ?? input.lastTxHash ?? null
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
        async getAll() {
            return Object.values(store).map(normalizeProgressRecord);
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
            badges: JSON.parse(row.badges || '[]'),
            wallet_address: row.wallet_address,
            contract_address: row.contract_address,
            last_tx_hash: row.last_tx_hash
        });
    };

    return {
        type: 'sqlite',
        async getAll() {
            const rows = await all('SELECT * FROM user_progress');
            return rows.map(fromRow);
        },
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
                INSERT INTO user_progress (user_id, display_name, xp, completed_modules, completed_lessons, badges, wallet_address, contract_address, last_tx_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    display_name = COALESCE(excluded.display_name, user_progress.display_name),
                    xp = excluded.xp,
                    completed_modules = excluded.completed_modules,
                    completed_lessons = excluded.completed_lessons,
                    badges = excluded.badges,
                    wallet_address = COALESCE(excluded.wallet_address, user_progress.wallet_address),
                    contract_address = COALESCE(excluded.contract_address, user_progress.contract_address),
                    last_tx_hash = COALESCE(excluded.last_tx_hash, user_progress.last_tx_hash)
            `;
            await run(query, [
                normalized.user_id,
                normalized.display_name,
                normalized.xp,
                JSON.stringify(normalized.completed_modules),
                JSON.stringify(normalized.completed_lessons),
                JSON.stringify(normalized.badges),
                normalized.wallet_address,
                normalized.contract_address,
                normalized.last_tx_hash
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
                    badges TEXT DEFAULT '[]',
                    wallet_address TEXT,
                    contract_address TEXT,
                    last_tx_hash TEXT
                )`,
                (err) => (err ? reject(err) : resolve())
            );
        });
        await new Promise((resolve, reject) => {
            db.all('PRAGMA table_info(user_progress)', [], (err, rows) => {
                if (err) return reject(err);
                const names = rows.map((row) => row.name);
                const addColumn = (sql) => new Promise((resolveAdd, rejectAdd) => {
                    db.run(sql, (err) => (err ? rejectAdd(err) : resolveAdd()));
                });
                const alters = [];
                if (!names.includes('wallet_address')) alters.push(addColumn('ALTER TABLE user_progress ADD COLUMN wallet_address TEXT'));
                if (!names.includes('contract_address')) alters.push(addColumn('ALTER TABLE user_progress ADD COLUMN contract_address TEXT'));
                if (!names.includes('last_tx_hash')) alters.push(addColumn('ALTER TABLE user_progress ADD COLUMN last_tx_hash TEXT'));
                Promise.all(alters).then(() => resolve()).catch(reject);
            });
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

// Get all progress records
app.get('/api/progress/all', async (req, res) => {
    try {
        const allProgress = await storage.getAll();
        res.json(allProgress);
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch progress records' });
    }
});

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
    const { user_id, display_name, xp, completed_modules, completed_lessons, badges, wallet_address, contract_address, last_tx_hash } = req.body;

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
            badges: badges || [],
            wallet_address: wallet_address || null,
            contract_address: contract_address || null,
            last_tx_hash: last_tx_hash || null
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

// Contract Address Endpoints
// Get contract configuration
app.get('/api/contract-config', async (req, res) => {
    try {
        res.json(contractConfig);
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch contract config' });
    }
});

// Save contract address (called after deployment)
app.post('/api/contract-config', async (req, res) => {
    const { FhenixLearnBadge, network, chainId } = req.body;

    if (!FhenixLearnBadge) {
        return res.status(400).json({ error: "FhenixLearnBadge address is required" });
    }

    try {
        contractConfig = {
            FhenixLearnBadge,
            network: network || 'arb-sepolia',
            chainId: chainId || 421614,
            lastUpdated: new Date().toISOString()
        };
        await saveContractConfig();
        res.json({ success: true, config: contractConfig });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to save contract config' });
    }
});

// Update badge with on-chain info after minting
app.post('/api/progress/:userId/badge/:badgeId', async (req, res) => {
    const { userId, badgeId } = req.params;
    const {
        tokenId,
        txHash,
        contractAddress,
        walletAddress,
        badgeName,
        badgeDescription
    } = req.body;

    if (!txHash) {
        return res.status(400).json({ error: "txHash is required" });
    }

    try {
        let progress = await storage.getByUserId(userId);
        if (!progress) {
            progress = defaultProgress(userId);
        }

        const badgeIndex = progress.badges.findIndex((b) => {
            if (typeof b === 'string') return b === badgeId;
            return b?.id === badgeId;
        });

        const updatedBadge = {
            id: badgeId,
            name: badgeName || undefined,
            description: badgeDescription || undefined,
            tokenId: tokenId ?? null,
            txHash,
            contractAddress: contractAddress || contractConfig.FhenixLearnBadge,
            walletAddress,
            mintedAt: new Date().toISOString()
        };

        progress.wallet_address = walletAddress || progress.wallet_address || null;
        progress.contract_address = contractAddress || progress.contract_address || contractConfig.FhenixLearnBadge || null;
        progress.last_tx_hash = txHash || progress.last_tx_hash || null;

        if (badgeIndex === -1) {
            progress.badges = [...(progress.badges || []), updatedBadge];
        } else {
            progress.badges[badgeIndex] = {
                ...((typeof progress.badges[badgeIndex] === 'string') ? { id: badgeId } : progress.badges[badgeIndex]),
                ...updatedBadge
            };
        }

        await storage.upsert(progress);
        res.json({ success: true, badge: updatedBadge });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to update badge' });
    }
});

// ============ ADMIN DASHBOARD ENDPOINTS ============
// Simple in-memory session store
const sessions = new Map();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'fhenix2024';

function generateSessionToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function validateSession(req) {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!token || !sessions.has(token)) {
        return false;
    }
    const session = sessions.get(token);
    if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
        sessions.delete(token);
        return false;
    }
    return true;
}

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateSessionToken();
        sessions.set(token, { createdAt: Date.now(), username });
        return res.json({ success: true, token });
    }

    res.status(401).json({ error: 'Invalid credentials' });
});

// Admin dashboard data endpoint
app.get('/api/admin/dashboard', async (req, res) => {
    if (!validateSession(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const allProgress = await storage.getAll();

        // Aggregates
        const totalUsers = allProgress.length;
        const totalXP = allProgress.reduce((sum, u) => sum + (u.xp || 0), 0);
        const totalBadges = allProgress.reduce((sum, u) => sum + (u.badges?.length || 0), 0);

        // Strong validation for minted badges per specification
        const isMintedBadge = (badge) => {
            if (!badge || typeof badge !== 'object') return false;
            const hasId = typeof badge.id === 'string' && badge.id.length > 0;
            const hasName = typeof badge.name === 'string' && badge.name.length > 0;
            const hasTx = typeof badge.txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(badge.txHash);
            const isHex40 = (addr) => typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
            const hasContract = isHex40(badge.contractAddress);
            const hasWallet = isHex40(badge.walletAddress);
            const hasMintedAt = typeof badge.mintedAt === 'string' && !isNaN(Date.parse(badge.mintedAt));

            return hasId && hasName && hasTx && hasContract && hasWallet && hasMintedAt;
        };

        const totalMintedBadges = allProgress.reduce((sum, u) => {
            const badges = Array.isArray(u.badges) ? u.badges : [];
            return sum + badges.filter(isMintedBadge).length;
        }, 0);

        const totalBadgeHolders = allProgress.filter(u => Array.isArray(u.badges) && u.badges.some(b => !!b)).length;
        const avgXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;

        // Module and lesson completion stats
        const moduleCompletions = {};
        const lessonCompletions = {};

        allProgress.forEach(user => {
            (user.completed_modules || []).forEach(mod => {
                moduleCompletions[mod] = (moduleCompletions[mod] || 0) + 1;
            });
            (user.completed_lessons || []).forEach(lesson => {
                lessonCompletions[lesson] = (lessonCompletions[lesson] || 0) + 1;
            });
        });

        const topModules = Object.entries(moduleCompletions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const topLessons = Object.entries(lessonCompletions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Distribution stats
        const xpRanges = {
            '0-1000': 0,
            '1000-5000': 0,
            '5000-10000': 0,
            '10000+': 0
        };

        allProgress.forEach(user => {
            const xp = user.xp || 0;
            if (xp < 1000) xpRanges['0-1000']++;
            else if (xp < 5000) xpRanges['1000-5000']++;
            else if (xp < 10000) xpRanges['5000-10000']++;
            else xpRanges['10000+']++;
        });

        res.json({
            aggregates: {
                totalUsers,
                totalXP,
                avgXP,
                totalBadges,
                totalMintedBadges,
                totalBadgeHolders,
                totalMinted: totalBadgeHolders,
                mintedPercentage: totalBadges > 0 ? Math.round((totalMintedBadges / totalBadges) * 100) : 0
            },
            topModules,
            topLessons,
            xpDistribution: xpRanges,
            users: allProgress.sort((a, b) => (b.xp || 0) - (a.xp || 0)).map(u => ({
                user_id: u.user_id,
                display_name: u.display_name || 'Anonymous',
                xp: u.xp || 0,
                badges_count: u.badges?.length || 0,
                modules_completed: u.completed_modules?.length || 0,
                lessons_completed: u.completed_lessons?.length || 0,
                wallet_address: u.wallet_address || 'N/A',
                last_tx_hash: u.last_tx_hash || 'N/A'
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch dashboard data' });
    }
});

// Serve dashboard HTML at multiple routes
app.get(['/admin/dashboard', '/admin', '/dashboard'], async (req, res) => {
    try {
        const dashboardPath = join(__dirname, 'dashboard.html');
        const dashboardHTML = await fs.readFile(dashboardPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(dashboardHTML);
    } catch (err) {
        console.error('Error serving dashboard:', err);
        res.status(500).send(`
            <html>
                <body style="background: #011623; color: #fff; font-family: Arial;">
                    <h1>❌ Error Loading Dashboard</h1>
                    <p>Could not find dashboard.html file</p>
                    <p>Error: ${err.message}</p>
                </body>
            </html>
        `);
    }
});

// Dashboard help & redirect
app.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

const PORT = process.env.PORT || 3101;
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
