const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize Master Enterprise Tables with Dual-Channel Support
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agents (
                apiKey VARCHAR(64) PRIMARY KEY,
                companyName VARCHAR(128),
                balance NUMERIC DEFAULT 0,
                preferredPaymentMethod VARCHAR(32) DEFAULT 'HYBRID',
                isActive BOOLEAN DEFAULT TRUE,
                createdAt TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS vaults (
                vaultId VARCHAR(64) PRIMARY KEY,
                status VARCHAR(32),
                buyerAgent VARCHAR(64),
                sellerAgent VARCHAR(64),
                amount NUMERIC,
                paymentChannel VARCHAR(32) DEFAULT 'FIAT_PADDLE',
                createdAt TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS ledger (
                id SERIAL PRIMARY KEY,
                blockIndex INT,
                previousHash VARCHAR(64),
                transactionId VARCHAR(64) UNIQUE,
                hash VARCHAR(64),
                payload JSONB,
                createdAt TIMESTAMP
            );
        `);
        console.log("Krypton Dual-Engine Enterprise Database synchronized.");
    } catch (err) {
        console.error("Database initialization error:", err.message);
    }
}
initDB();

// Advanced Multi-Tenant & Idempotency Middleware
async function verifyAgentAndIdempotency(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const { transactionId } = req.body;
    const SECRET_KEY = process.env.KRYPTON_SECRET_KEY || "krypton_master_secret_2026";

    if (!apiKey) {
        return res.status(401).json({ error: "Access denied. Missing Agent API Key." });
    }

    try {
        const agentRes = await pool.query('SELECT * FROM agents WHERE apiKey = $1 AND isActive = TRUE', [apiKey]);
        
        if (agentRes.rows.length === 0 && apiKey !== 'agent_key_prod_core') {
            return res.status(403).json({ error: "Invalid or revoked Agent API Key." });
        }

        if (signature) {
            const computedSig = crypto.createHmac('sha256', SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
            if (signature !== computedSig) {
                return res.status(403).json({ error: "Cryptographic HMAC signature validation failed." });
            }
        }

        if (transactionId) {
            const txCheck = await pool.query('SELECT id FROM ledger WHERE transactionId = $1', [transactionId]);
            if (txCheck.rows.length > 0) {
                return res.status(409).json({ error: "Idempotency conflict: Transaction ID already processed and immutably committed." });
            }
        }

        next();
    } catch (err) {
        return res.status(500).json({ error: "Authentication pipeline error", details: err.message });
    }
}

// OLED High-Contrast Enterprise Interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Krypton Protocol | Dual-Engine Core</title>
        <style>
            body { background: #000000; color: #ffffff; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #0a0a0a; padding: 30px; border-radius: 8px; box-shadow: 0 0 30px rgba(0,255,102,0.08); width: 540px; border: 1px solid #222222; }
            h2 { color: #ffffff; margin-top: 0; border-bottom: 1px solid #222222; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
            .status { color: #00ff66; font-size: 11px; font-weight: bold; }
            button { background: #ffffff; color: #000000; border: none; padding: 12px; font-weight: bold; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; transition: 0.2s; }
            button:hover { background: #00ff66; color: #000000; }
            pre { background: #000000; padding: 12px; border-radius: 4px; font-size: 11px; overflow-x: auto; color: #00ff66; border: 1px solid #222222; max-height: 180px; }
            .stats { font-size: 11px; color: #777777; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Krypton Protocol <span class="status">DUAL-ENGINE [ACTIVE]</span></h2>
            <div class="stats">Paddle (Fiat) & USDT (Crypto) Settlement Support</div>
            <button onclick="executeDualPipeline()">Execute Dual-Channel Settlement</button>
            <pre id="output">Core initialized. Ready for Fiat & Crypto agent transactions...</pre>
        </div>
        <script>
            async function executeDualPipeline() {
                const output = document.getElementById('output');
                output.innerText = "1. Initializing secure escrow vault (Channel: CRYPTO_USDT)...";
                try {
                    const vaultRes = await fetch('/api/v1/escrow/vault', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-api-key': 'agent_key_prod_core'
                        },
                        body: JSON.stringify({ 
                            buyerAgent: "Autonomous-Agent-Alpha", 
                            sellerAgent: "Autonomous-Agent-Beta", 
                            amount: 300000,
                            paymentChannel: "CRYPTO_USDT" 
                        })
                    });
                    const vaultData = await vaultRes.json();
                    if (!vaultRes.ok) throw new Error(vaultData.error);

                    output.innerText += "\\nVault Secured: " + vaultData.vaultId + "\\n2. Executing Settlement & Protocol Take-Rate...";

                    const txId = "tx_dual_" + Math.floor(Math.random() * 999999);
                    const settleRes = await fetch('/api/v1/settlement/execute', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-api-key': 'agent_key_prod_core'
                        },
                        body: JSON.stringify({
                            transactionId: txId,
                            vaultId: vaultData.vaultId,
                            sourceAgent: "Autonomous-Agent-Alpha",
                            targetAgent: "Autonomous-Agent-Beta",
                            amount: 300000,
                            currency: "USDT"
                        })
                    });
                    const settleData = await settleRes.json();
                    if (!settleRes.ok) throw new Error(settleData.error);

                    output.innerText += "\\nCOMMITTED TO IMMUTABLE LEDGER:\\n" + JSON.stringify(settleData, null, 2);
                } catch (err) {
                    output.innerText = "ERROR: " + err.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Register new Agent API Key (Admin Endpoint)
app.post('/api/v1/agents/register', async (req, res) => {
    const { companyName, preferredPaymentMethod } = req.body;
    if (!companyName) return res.status(400).json({ error: "Company name required." });
    
    const apiKey = `agent_key_${crypto.randomBytes(16).toString('hex')}`;
    const paymentMethod = preferredPaymentMethod || 'HYBRID';
    const createdAt = new Date().toISOString();

    try {
        await pool.query(
            'INSERT INTO agents (apiKey, companyName, balance, preferredPaymentMethod, isActive, createdAt) VALUES ($1, $2, $3, $4, $5, $6)',
            [apiKey, companyName, 0, paymentMethod, true, createdAt]
        );
        res.status(201).json({ message: "Agent successfully registered with dual-engine support.", apiKey, companyName, paymentMethod });
    } catch (err) {
        res.status(500).json({ error: "Database error", details: err.message });
    }
});

// Secure Escrow Vault Creation with Payment Channel Support
app.post('/api/v1/escrow/vault', verifyAgentAndIdempotency, async (req, res) => {
    const { buyerAgent, sellerAgent, amount, paymentChannel } = req.body;
    if (!buyerAgent || !sellerAgent || !amount) {
        return res.status(400).json({ error: "Insufficient vault parameters." });
    }
    const vaultId = `vlt_${crypto.randomBytes(16).toString('hex')}`;
    const channel = paymentChannel || 'FIAT_PADDLE';
    const createdAt = new Date().toISOString();

    try {
        await pool.query(
            'INSERT INTO vaults (vaultId, status, buyerAgent, sellerAgent, amount, paymentChannel, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [vaultId, 'LOCKED_ATOMIC', buyerAgent, sellerAgent, amount, channel, createdAt]
        );
        res.status(201).json({ vaultId, status: 'LOCKED_ATOMIC', buyerAgent, sellerAgent, amount, paymentChannel: channel, createdAt });
    } catch (err) {
        console.error("Vault Creation DB Error:", err.message);
        res.status(500).json({ error: "Database transaction error: " + err.message, details: err.message });
    }
});

// God-Tier Settlement Execution with Protocol Take-Rate & Idempotency
app.post('/api/v1/settlement/execute', verifyAgentAndIdempotency, async (req, res) => {
    try {
        const { transactionId, vaultId, sourceAgent, targetAgent, amount, currency } = req.body;
        if (!transactionId || !amount || !currency) {
            return res.status(400).json({ error: "Insufficient settlement parameters." });
        }

        if (vaultId) {
            await pool.query('UPDATE vaults SET status = $1 WHERE vaultId = $2', ['SETTLED_AND_COMMITTED', vaultId]);
        }

        // Calculate 0.2% Protocol Take-Rate (Monetization Engine)
        const protocolFee = parseFloat(amount) * 0.002;
        const netSettlementAmount = parseFloat(amount) - protocolFee;

        const lastBlockRes = await pool.query('SELECT blockIndex, hash FROM ledger ORDER BY id DESC LIMIT 1');
        const lastIndex = lastBlockRes.rows.length > 0 ? parseInt(lastBlockRes.rows[0].blockindex, 10) : 0;
        const previousHash = lastBlockRes.rows.length > 0 ? lastBlockRes.rows[0].hash : '0';

        const blockIndex = lastIndex + 1;
        const timestamp = new Date().toISOString();
        
        const details = { 
            source: sourceAgent || "Agent", 
            target: targetAgent || "Treasury", 
            grossAmount: amount, 
            protocolFee: protocolFee.toFixed(2),
            netAmount: netSettlementAmount.toFixed(2),
            currency 
        };

        const currentHash = crypto.createHash('sha256')
            .update(previousHash + JSON.stringify(details) + timestamp)
            .digest('hex');

        await pool.query(
            'INSERT INTO ledger (blockIndex, previousHash, transactionId, hash, payload, createdAt) VALUES ($1, $2, $3, $4, $5, $6)',
            [blockIndex, previousHash, transactionId, currentHash, JSON.stringify(details), timestamp]
        );

        res.json({
            index: blockIndex,
            previousHash,
            transactionId,
            hash: currentHash,
            status: "SETTLED_DUAL_ENGINE_IMMUTABLE",
            details
        });
    } catch (error) {
        console.error("Settlement Execution DB Error:", error.message);
        res.status(500).json({ error: "Database transaction error: " + error.message, details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Krypton Dual-Engine Enterprise Core running on port ${PORT}`);
});
