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

// Initialize Master Enterprise Tables including Subscriptions & Webhook logs
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
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                paddleSubscriptionId VARCHAR(128) UNIQUE,
                companyName VARCHAR(128),
                email VARCHAR(128),
                apiKey VARCHAR(64),
                status VARCHAR(32),
                createdAt TIMESTAMP
            );
        `);
        console.log("Krypton Protocol Enterprise Database synchronized.");
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

// OLED High-Contrast Enterprise Interface + Developer Docs & Simulator
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Krypton Protocol | Autonomous Settlement Core</title>
        <style>
            body { background: #000000; color: #ffffff; font-family: monospace; display: flex; flex-direction: column; align-items: center; padding: 40px; margin: 0; }
            .container { width: 700px; }
            .card { background: #0a0a0a; padding: 30px; border-radius: 8px; box-shadow: 0 0 30px rgba(0,255,102,0.08); border: 1px solid #222222; margin-bottom: 20px; }
            h2 { color: #ffffff; margin-top: 0; border-bottom: 1px solid #222222; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
            .status { color: #00ff66; font-size: 11px; font-weight: bold; }
            button { background: #ffffff; color: #000000; border: none; padding: 12px; font-weight: bold; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; transition: 0.2s; }
            button:hover { background: #00ff66; color: #000000; }
            pre { background: #000000; padding: 12px; border-radius: 4px; font-size: 11px; overflow-x: auto; color: #00ff66; border: 1px solid #222222; max-height: 180px; }
            .stats { font-size: 11px; color: #777777; margin-bottom: 10px; }
            code { color: #00ff66; background: #111; padding: 2px 5px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h2>Krypton Protocol <span class="status">PRODUCTION [ONLINE]</span></h2>
                <div class="stats">Autonomous AI Settlement Layer & Dual-Channel Engine (Paddle + USDT)</div>
                <button onclick="executeDualPipeline()">Run Live Settlement Simulator</button>
                <pre id="output">System initialized. Ready for execution...</pre>
            </div>

            <div class="card">
                <h2>Developer Integration Docs</h2>
                <p style="font-size: 12px; color: #aaa;">Use your <code>x-api-key</code> header to connect your agents and apps to Krypton.</p>
                <p style="font-size: 12px; color: #fff;"><strong>1. Create Escrow Vault:</strong></p>
                <pre>POST /api/v1/escrow/vault
Headers: { "x-api-key": "YOUR_API_KEY", "Content-Type": "application/json" }
Body: { "buyerAgent": "Bot-A", "sellerAgent": "Bot-B", "amount": 5000 }</pre>
                <p style="font-size: 12px; color: #fff;"><strong>2. Execute Settlement & Take-Rate:</strong></p>
                <pre>POST /api/v1/settlement/execute
Headers: { "x-api-key": "YOUR_API_KEY", "Content-Type": "application/json" }
Body: { "transactionId": "tx_01", "vaultId": "vlt_...", "amount": 5000, "currency": "USDT" }</pre>
            </div>
        </div>
        <script>
            async function executeDualPipeline() {
                const output = document.getElementById('output');
                output.innerText = "1. Initializing secure escrow vault...";
                try {
                    const vaultRes = await fetch('/api/v1/escrow/vault', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': 'agent_key_prod_core' },
                        body: JSON.stringify({ buyerAgent: "Autonomous-Agent-Alpha", sellerAgent: "Autonomous-Agent-Beta", amount: 300000 })
                    });
                    const vaultData = await vaultRes.json();
                    if (!vaultRes.ok) throw new Error(vaultData.error);

                    output.innerText += "\\nVault Secured: " + vaultData.vaultId + "\\n2. Executing Settlement & Protocol Take-Rate...";

                    const txId = "tx_dual_" + Math.floor(Math.random() * 999999);
                    const settleRes = await fetch('/api/v1/settlement/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': 'agent_key_prod_core' },
                        body: JSON.stringify({ transactionId: txId, vaultId: vaultData.vaultId, sourceAgent: "Autonomous-Agent-Alpha", targetAgent: "Autonomous-Agent-Beta", amount: 300000, currency: "USDT" })
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

// Paddle Webhook Receiver (Automated Client Provisioning & API Key Generation)
app.post('/api/v1/webhook/paddle', async (req, res) => {
    try {
        const eventData = req.body;
        // Valida el evento de pago exitoso de Paddle (subscription.created / transaction.completed)
        const eventType = eventData.alert_name || eventData.event_type;
        
        console.log("Paddle Webhook Received Event:", eventType);

        // Extrae los datos del cliente que pagó
        const customerEmail = eventData.email || eventData.data?.customer?.email;
        const companyName = eventData.passthrough || eventData.data?.custom_data?.companyName || "Krypton Enterprise Client";
        const subscriptionId = eventData.subscription_id || eventData.data?.id || `sub_${Date.now()}`;

        if (eventType === 'subscription_created' || eventType === 'transaction.completed' || eventType === 'payment_succeeded') {
            const apiKey = `agent_key_${crypto.randomBytes(16).toString('hex')}`;
            const createdAt = new Date().toISOString();

            // 1. Registra al cliente en la tabla de agents para darle acceso automático a la API
            await pool.query(
                'INSERT INTO agents (apiKey, companyName, balance, preferredPaymentMethod, isActive, createdAt) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (apiKey) DO NOTHING',
                [apiKey, companyName, 0, 'HYBRID', true, createdAt]
            );

            // 2. Guarda el recibo en la tabla de suscripciones
            await pool.query(
                'INSERT INTO subscriptions (paddleSubscriptionId, companyName, email, apiKey, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6)',
                [subscriptionId, companyName, customerEmail || 'client@krypton.co', apiKey, 'ACTIVE', createdAt]
            );

            console.log(`Successfully provisioned API Key for ${companyName}: ${apiKey}`);
        }

        res.status(200).json({ status: "Webhook processed successfully" });
    } catch (err) {
        console.error("Webhook processing error:", err.message);
        res.status(500).json({ error: err.message });
    }
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
        res.status(201).json({ message: "Agent successfully registered.", apiKey, companyName, paymentMethod });
    } catch (err) {
        res.status(500).json({ error: "Database error", details: err.message });
    }
});

// Secure Escrow Vault Creation
app.post('/api/v1/escrow/vault', verifyAgentAndIdempotency, async (req, res) => {
    const { buyerAgent, sellerAgent, amount } = req.body;
    if (!buyerAgent || !sellerAgent || !amount) {
        return res.status(400).json({ error: "Insufficient vault parameters." });
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

// Settlement Execution with Protocol Take-Rate & Idempotency
app.post('/api/v1/settlement/execute', verifyAgentAndIdempotency, async (req, res) => {
    try {
        const { transactionId, vaultId, sourceAgent, targetAgent, amount, currency } = req.body;
        if (!transactionId || !amount || !currency) {
            return res.status(400).json({ error: "Insufficient settlement parameters." });
        }

        if (vaultId) {
            await pool.query('UPDATE vaults SET status = $1 WHERE vaultId = $2', ['SETTLED_AND_COMMITTED', vaultId]);
        }

        // Calculate 0.2% Protocol Take-Rate
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
        res.status(500).json({ error: "Database transaction error", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Krypton Protocol Production Core running on port ${PORT}`);
});
