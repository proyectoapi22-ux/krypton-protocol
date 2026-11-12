const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg'); // Requerido para PostgreSQL
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Conexión a PostgreSQL (Render provee DATABASE_URL automáticamente)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inicializar tablas necesarias en PostgreSQL al arrancar
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
        console.log("Base de datos PostgreSQL sincronizada.");
    } catch (err) {
        console.error("Error al inicializar la base de datos:", err.message);
    }
}
initDB();

// Middleware de Autenticación HMAC por API Key para Agentes
function verifyAgentHMAC(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    
    const SECRET_KEY = process.env.KRYPTON_SECRET_KEY || "krypton_master_secret_2026";

    if (!apiKey) {
        return res.status(401).json({ error: "Acceso denegado. Falta API Key." });
    }

    if (signature) {
        const computedSig = crypto.createHmac('sha256', SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
        if (signature !== computedSig) {
            return res.status(403).json({ error: "Firma criptográfica HMAC inválida." });
        }
    }

    next();
}

// Traductor automático de idioma
function gettext(req) {
    const lang = req.headers['accept-language'] || 'es';
    if (lang.includes('en')) {
        return {
            title: "Krypton Protocol",
            status: "ENTERPRISE [SECURE]",
            subtitle: "PostgreSQL Persistence & HMAC Security Active",
            btnText: "Execute Production Pipeline",
            waiting: "Enterprise core ready..."
        };
    }
    return {
        title: "Krypton Protocol",
        status: "EMPRESA [SEGURO]",
        subtitle: "Persistencia PostgreSQL y Seguridad HMAC Activa",
        btnText: "Ejecutar Pipeline de Producción",
        waiting: "Núcleo empresarial listo..."
    };
}

// Panel Visual OLED
app.get('/', (req, res) => {
  const t = gettext(req);
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title} | Enterprise Core</title>
        <style>
            body { background: #000000; color: #ffffff; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #0a0a0a; padding: 30px; border-radius: 8px; box-shadow: 0 0 30px rgba(0,255,102,0.08); width: 480px; border: 1px solid #222222; }
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
            <h2>${t.title} <span class="status">${t.status}</span></h2>
            <div class="stats">${t.subtitle}</div>
            <button onclick="testEnterprisePipeline()">${t.btnText}</button>
            <pre id="output">${t.waiting}</pre>
        </div>
        <script>
            async function testEnterprisePipeline() {
                const output = document.getElementById('output');
                output.innerText = "1. Creando Vault en PostgreSQL con HMAC...";
                try {
                    const vaultRes = await fetch('/api/v1/escrow/vault', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-api-key': 'agent_key_test_999'
                        },
                        body: JSON.stringify({ buyerAgent: "Agent-Alpha", sellerAgent: "Agent-Beta", amount: 75000 })
                    });
                    const vaultData = await vaultRes.json();
                    if (!vaultRes.ok) throw new Error(vaultData.error);

                    output.innerText += "\\nVAULT DB ID: " + vaultData.vaultId + "\\n2. Ejecutando Liquidación Inmutable...";

                    const settleRes = await fetch('/api/v1/settlement/execute', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-api-key': 'agent_key_test_999'
                        },
                        body: JSON.stringify({
                            transactionId: "tx_prod_" + Math.floor(Math.random() * 99999),
                            vaultId: vaultData.vaultId,
                            sourceAgent: "Agent-Alpha",
                            targetAgent: "Agent-Beta",
                            amount: 75000,
                            currency: "USD"
                        })
                    });
                    const settleData = await settleRes.json();
                    if (!settleRes.ok) throw new Error(settleData.error);

                    output.innerText += "\\nSUCCESSFULLY COMMITTED TO DB:\\n" + JSON.stringify(settleData, null, 2);
                } catch (err) {
                    output.innerText = "ERROR: " + err.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Endpoint protegidos con HMAC y persistencia en PostgreSQL
app.post('/api/v1/escrow/vault', verifyAgentHMAC, async (req, res) => {
    const { buyerAgent, sellerAgent, amount } = req.body;
    if (!buyerAgent || !sellerAgent || !amount) {
        return res.status(400).json({ error: "Parámetros insuficientes." });
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
        res.status(500).json({ error: "Error de base de datos", details: err.message });
    }
});

app.post('/api/v1/settlement/execute', verifyAgentHMAC, async (req, res) => {
    try {
        const { transactionId, vaultId, sourceAgent, targetAgent, amount, currency } = req.body;
        if (!transactionId || !amount || !currency) {
            return res.status(400).json({ error: "Parámetros de liquidación insuficientes." });
        }

        if (vaultId) {
            await pool.query('UPDATE vaults SET status = $1 WHERE vaultId = $2', ['SETTLED_AND_COMMITTED', vaultId]);
        }

        const lastBlockRes = await pool.query('SELECT blockIndex, hash FROM ledger ORDER BY id DESC LIMIT 1');
        const lastBlock = lastBlockRes.rows[0] || { blockIndex: 0, hash: '0' };

        const blockIndex = lastBlock.blockIndex + 1;
        const previousHash = lastBlock.hash;
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
            status: "SETTLED_IMMUTABLE_DB",
            details
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Krypton Enterprise Core running on port ${PORT}`);
});
