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

// Initialize Production Tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vaults (
                vaultId VARCHAR(64) PRIMARY KEY,
                status VARCHAR(32),
                buyerAgent VARCHAR(64),
                sellerAgent VARCHAR(64),
                amount NUMERIC,
                createdAt TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS ledger (
                id SERIAL PRIMARY KEY,
                blockIndex INT,
                previousHash VARCHAR(64),
                transactionId VARCHAR(64),
                hash VARCHAR(64),
                payload JSONB,
                createdAt TIMESTAMP
            );
        `);
        console.log("PostgreSQL production tables synchronized.");
    } catch (err) {
        console.error("Database initialization error:", err.message);
    }
}
initDB();

// HMAC Agent Authentication Middleware
function verifyAgentHMAC(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const SECRET_KEY = process.env.KRYPTON_SECRET_KEY || "krypton_master_secret_2026";

    if (!apiKey) {
        return res.status(401).json({ error: "Access denied. Missing Agent API Key." });
    }

    if (signature) {
        const computedSig = crypto.createHmac('sha256', SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
        if (signature !== computedSig) {
            return res.status(403).json({ error: "Cryptographic HMAC signature validation failed." });
        }
    }

    next();
}

// OLED High-Contrast Enterprise Interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Krypton Protocol | Global Settlement Core</title>
        <style>
            body { background: #000000; color: #ffffff; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #0a0a0a; padding: 30px; border-radius: 8px; box-shadow: 0 0 30px rgba(0,255,102,0.08); width: 500px; border: 1px solid #222222; }
            h2 { color: #ffffff; margin-top: 0; border-bottom: 1px solid #222222; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
            .status { color: #00ff66; font-size: 11px; font-weight: bold; }
            button { background: #ffffff; color: #000000; border: none; padding: 12px; font-weight: bold; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; transition: 0.2s; }
            button:hover { background: #00ff66; color: #000000; }
            pre { background: #000000; padding: 12px; border-radius: 4px; font-size: 11px; overflow-x: auto; color: #00ff66; border: 1px solid #222222; max-height: 200px; }
            .stats { font-size: 11px; color: #777777; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Krypton Protocol <span class="status">ENTERPRISE [ACTIVE]</span></h2>
            <div class="stats">PostgreSQL Storage & Immutable Ledger Engine</div>
            <button onclick="executeSettlementPipeline()">Execute Settlement Pipeline</button>
            <pre id="output">Core node synchronized and awaiting agent transactions...</pre>
        </div>
        <script>
            async function executeSettlementPipeline() {
                const output = document.getElementById('output');
                output.innerText = "1. Initializing cryptographic escrow vault...";
                try {
                    const vaultRes = await fetch('/api/v1/escrow/vault', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-api-key': 'agent_key_prod_core'
                        },
                        body: JSON.stringify({ buyerAgent: "Autonomous-Agent-Alpha", sellerAgent: "Autonomous-Agent-Beta", amount: 150000 })
                    });
                    const vaultData = await vaultRes.json();
                    if (!vaultRes.ok) throw new Error(vaultData.error);

                    output.innerText += "\\nVault Secured: " + vaultData.vaultId + "\\n2. Committing atomic settlement block...";

                    const settleRes = await fetch('/api/v1/settlement/execute', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-api-key': 'agent_key_prod_core'
                        },
                        body: JSON.stringify({
                            transactionId: "tx_global_" + Math.floor(Math.random() * 999999),
                            vaultId: vaultData.vaultId,
                            sourceAgent: "Autonomous-Agent-Alpha",
                            targetAgent: "Autonomous-Agent-Beta",
                            amount: 150000,
                            currency: "USD"
                        })
                    });
                    const settleData = await settleRes.json();
                    if (!settleRes.ok) throw new Error(settleData.error);

                    output.innerText += "\\nBLOCK COMMITTED SUCCESSFULLY:\\n" + JSON.stringify(settleData, null, 2);
                } catch (err) {
                    output.innerText = "ERROR: " + err.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Production Escrow Vault Creation
app.post('/api/v1/escrow/vault', verifyAgentHMAC, async (req, res) => {
    const { buyerAgent, sellerAgent, amount } = req.body;
    if (!buyerAgent || !sellerAgent || !amount) {
        return res.status(400).json({ error: "Insufficient payload parameters." });
    }
    const vaultId = `vlt_${crypto.randomBytes(16).toString('hex')}`;
    const createdAt = new Date().toISOString();

    try {
        await pool.query(
            'INSERT INTO vaults (vaultId, status, buyerAgent, sellerAgent, amount, createdAt) VALUES ($1, $2, $3, $4, $5, $6)',
            [vaultId, 'LOCKED_ATOMIC', buyerAgent, sellerAgent, amount, createdAt]
        );
        res.status(201).json({ vaultId, status: 'LOCKED_ATOMIC', buyerAgent, sellerAgent, amount, createdAt });
    } catch (err) {
        res.status(500).json({ error: "Database transaction error", details: err.message });
    }
});

// Immutable Settlement Execution
app.post('/api/v1/settlement/execute', verifyAgentHMAC, async (req, res) => {
    try {
        const { transactionId, vaultId, sourceAgent, targetAgent, amount, currency } = req.body;
        if (!transactionId || !amount || !currency) {
            return res.status(400).json({ error: "Insufficient settlement parameters." });
        }

        if (vaultId) {
            await pool.query('UPDATE vaults SET status = $1 WHERE vaultId = $2', ['SETTLED_AND_COMMITTED', vaultId]);
        }

        const lastBlockRes = await pool.query('SELECT blockIndex, hash FROM ledger ORDER BY id DESC LIMIT 1');
        const lastIndex = lastBlockRes.rows.length > 0 ? parseInt(lastBlockRes.rows[0].blockindex, 10) : 0;
        const previousHash = lastBlockRes.rows.length > 0 ? lastBlockRes.rows[0].hash : '0';

        const blockIndex = lastIndex + 1;
        const timestamp = new Date().toISOString();
        
        const details = { source: sourceAgent || "Agent", target: targetAgent || "Treasury", amount, currency };
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
            status: "SETTLED_IMMUTABLE_CORE",
            details
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Krypton Enterprise Core running on port ${PORT}`);
});
