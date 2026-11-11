const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Protocol State - Immutable Ledger Chain & Secured Vaults
const vaults = new Map();
const blockchainLedger = [{
    index: 0,
    previousHash: "0",
    timestamp: new Date().toISOString(),
    transactionId: "genesis_block",
    data: { system: "Krypton Protocol Master Core Initialized" },
    hash: crypto.createHash('sha256').update("genesis").digest('hex')
}];

// Panel de Control Visual - Negro Puro OLED con Telemetría Criptográfica
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Krypton Protocol | Master Infallible Core</title>
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
            <h2>Krypton Protocol <span class="status">SECURE [ONLINE]</span></h2>
            <div class="stats">Cryptographic Escrow & Chained Ledger Active</div>
            <button onclick="testInfalliblePipeline()">Ejecutar Pipeline Inalcanzable</button>
            <pre id="output">Núcleo blindado listo. Esperando agentes...</pre>
        </div>
        <script>
            async function testInfalliblePipeline() {
                const output = document.getElementById('output');
                output.innerText = "1. Solicitando Bóveda Criptográfica...\n";
                try {
                    const vaultRes = await fetch('/api/v1/escrow/vault', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ buyerAgent: "Agent-Alpha", sellerAgent: "Agent-Beta", amount: 50000 })
                    });
                    const vaultData = await vaultRes.json();
                    output.innerText += "VAULT SECURED: " + vaultData.vaultId + "\n\n2. Ejecutando Liquidación Inmutable...\n";

                    const settleRes = await fetch('/api/v1/settlement/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionId: "tx_infallible_" + Math.floor(Math.random() * 99999),
                            vaultId: vaultData.vaultId,
                            sourceAgent: "Agent-Alpha",
                            targetAgent: "Agent-Beta",
                            amount: 50000,
                            currency: "USD"
                        })
                    });
                    const settleData = await settleRes.json();
                    output.innerText += "SUCCESSFUL SETTLEMENT:\n" + JSON.stringify(settleData, null, 2);
                } catch (err) {
                    output.innerText = "Error crítico: " + err.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// 1. Creación de Bóvedas de Escrow con Protección Criptográfica
app.post('/api/v1/escrow/vault', (req, res) => {
    const { buyerAgent, sellerAgent, amount } = req.body;
    if (!buyerAgent || !sellerAgent || !amount) {
        return res.status(400).json({ error: "Parámetros de bóveda insuficientes." });
    }
    const vaultId = `vlt_${crypto.randomBytes(16).toString('hex')}`;
    const vaultData = {
        vaultId,
        status: "LOCKED_ATOMIC",
        buyerAgent,
        sellerAgent,
        amount,
        createdAt: new Date().toISOString(),
        checksum: crypto.createHash('sha256').update(vaultId + amount).digest('hex')
    };
    
    vaults.set(vaultId, vaultData);
    res.status(201).json(vaultData);
});

// 2. Liquidación Atómica Inalcanzable con Hashing En Cadena (Blockchain Ledger)
app.post('/api/v1/settlement/execute', async (req, res) => {
    try {
        const { transactionId, vaultId, sourceAgent, targetAgent, amount, currency } = req.body;

        if (!transactionId || !amount || !currency) {
            return res.status(400).json({ 
                error: "Parámetros de liquidación insuficientes. Se requiere ID, monto y moneda." 
            });
        }

        if (vaultId && vaults.has(vaultId)) {
            const vault = vaults.get(vaultId);
            vault.status = "SETTLED_AND_COMMITTED";
        }

        // Enlace criptográfico con el bloque anterior (Chain Integrity)
        const previousBlock = blockchainLedger[blockchainLedger.length - 1];
        const blockPayload = {
            index: blockchainLedger.length,
            previousHash: previousBlock.hash,
            timestamp: new Date().toISOString(),
            transactionId,
            details: {
                source: sourceAgent || "Anonymous-Agent",
                target: targetAgent || "Treasury",
                amount,
                currency
            }
        };

        const currentHash = crypto.createHash('sha256')
            .update(blockPayload.previousHash + JSON.stringify(blockPayload.details) + blockPayload.timestamp)
            .digest('hex');

        const immutableRecord = {
            ...blockPayload,
            hash: currentHash,
            status: "SETTLED_IMMUTABLE",
            settlementLayer: "Krypton Protocol Infallible Core"
        };

        blockchainLedger.push(immutableRecord);

        res.json(immutableRecord);

    } catch (error) {
        res.status(500).json({ error: "Error crítico en la red de liquidación", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Krypton Protocol Infallible Core running on port ${PORT}`);
});
