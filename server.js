const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const vaults = new Map();
const blockchainLedger = [{
    index: 0,
    previousHash: "0",
    timestamp: new Date().toISOString(),
    transactionId: "genesis_block",
    data: { system: "Krypton Protocol Master Core Initialized" },
    hash: crypto.createHash('sha256').update("genesis").digest('hex')
}];

// Traductor automático basado en el idioma del cliente
function gettext(req) {
    const lang = req.headers['accept-language'] || 'es';
    if (lang.includes('en')) {
        return {
            title: "Krypton Protocol",
            status: "SECURE [ONLINE]",
            subtitle: "Cryptographic Escrow & Chained Ledger Active",
            btnText: "Execute Infallible Pipeline",
            waiting: "Core secured. Waiting for agents...",
            executing: "Executing atomic pipeline..."
        };
    }
    return {
        title: "Krypton Protocol",
        status: "SEGURO [EN LÍNEA]",
        subtitle: "Escrow Criptográfico y Ledger En Cadena Activo",
        btnText: "Ejecutar Pipeline Inalcanzable",
        waiting: "Núcleo blindado listo. Esperando agentes...",
        executing: "Ejecutando pipeline atómico..."
    };
}

// Panel de Control Visual con Detección Automática de Idioma
app.get('/', (req, res) => {
  const t = gettext(req);
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title} | Master Core</title>
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
            <button onclick="testInfalliblePipeline()">${t.btnText}</button>
            <pre id="output">${t.waiting}</pre>
        </div>
        <script>
            async function testInfalliblePipeline() {
                const output = document.getElementById('output');
                output.innerText = "${t.executing}\\n1. Vault Request...";
                try {
                    const vaultRes = await fetch('/api/v1/escrow/vault', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ buyerAgent: "Agent-Alpha", sellerAgent: "Agent-Beta", amount: 50000 })
                    });
                    const vaultData = await vaultRes.json();
                    if (!vaultRes.ok) throw new Error(vaultData.error || "Vault error");
                    
                    output.innerText += "\\nVAULT SECURED: " + vaultData.vaultId + "\\n2. Executing Settlement...";

                    const settleRes = await fetch('/api/v1/settlement/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionId: "tx_inf_" + Math.floor(Math.random() * 99999),
                            vaultId: vaultData.vaultId,
                            sourceAgent: "Agent-Alpha",
                            targetAgent: "Agent-Beta",
                            amount: 50000,
                            currency: "USD"
                        })
                    });
                    const settleData = await settleRes.json();
                    if (!settleRes.ok) throw new Error(settleData.error || "Settlement error");

                    output.innerText += "\\nSUCCESS:\\n" + JSON.stringify(settleData, null, 2);
                } catch (err) {
                    output.innerText = "CRITICAL ERROR: " + err.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

app.post('/api/v1/escrow/vault', (req, res) => {
    const { buyerAgent, sellerAgent, amount } = req.body;
    if (!buyerAgent || !sellerAgent || !amount) {
        return res.status(400).json({ error: "Invalid vault parameters." });
    }
    const vaultId = `vlt_${crypto.randomBytes(16).toString('hex')}`;
    const vaultData = {
        vaultId,
        status: "LOCKED_ATOMIC",
        buyerAgent,
        sellerAgent,
        amount,
        createdAt: new Date().toISOString()
    };
    vaults.set(vaultId, vaultData);
    res.status(201).json(vaultData);
});

app.post('/api/v1/settlement/execute', async (req, res) => {
    try {
        const { transactionId, vaultId, sourceAgent, targetAgent, amount, currency } = req.body;
        if (!transactionId || !amount || !currency) {
            return res.status(400).json({ error: "Insufficient settlement parameters." });
        }

        if (vaultId && vaults.has(vaultId)) {
            vaults.get(vaultId).status = "SETTLED_AND_COMMITTED";
        }

        const previousBlock = blockchainLedger[blockchainLedger.length - 1];
        const blockPayload = {
            index: blockchainLedger.length,
            previousHash: previousBlock.hash,
            timestamp: new Date().toISOString(),
            transactionId,
            details: { source: sourceAgent || "Agent", target: targetAgent || "Treasury", amount, currency }
        };

        const currentHash = crypto.createHash('sha256')
            .update(blockPayload.previousHash + JSON.stringify(blockPayload.details) + blockPayload.timestamp)
            .digest('hex');

        const immutableRecord = {
            ...blockPayload,
            hash: currentHash,
            status: "SETTLED_IMMUTABLE"
        };

        blockchainLedger.push(immutableRecord);
        res.json(immutableRecord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Krypton Protocol Infallible Core running on port ${PORT}`);
});
