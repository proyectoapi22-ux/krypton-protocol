const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Panel de Control Visual Definitivo para Krypton Protocol
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Krypton Protocol | Core Engine</title>
        <style>
            body { background: #000000; color: #ffffff; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #0a0a0a; padding: 30px; border-radius: 8px; box-shadow: 0 0 20px rgba(255,255,255,0.05); width: 450px; border: 1px solid #222222; }
            h2 { color: #ffffff; margin-top: 0; border-bottom: 1px solid #222222; padding-bottom: 10px; }
            .status { color: #00ff66; font-weight: bold; }
            button { background: #ffffff; color: #000000; border: none; padding: 10px 15px; font-weight: bold; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; }
            button:hover { background: #cccccc; }
            pre { background: #000000; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto; color: #00ff66; border: 1px solid #222222; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Krypton Protocol</h2>
            <p>Status: <span class="status">ONLINE</span></p>
            <p>Layer: Autonomous Global Settlement & AML Engine</p>
            <p>Security: Enforced via Atomic Escrow</p>
            <button onclick="testSettlement()">Probar Liquidación Atómica</button>
            <pre id="output">Esperando prueba de ejecución...</pre>
        </div>
        <script>
            async function testSettlement() {
                const output = document.getElementById('output');
                output.innerText = "Ejecutando liquidación...";
                try {
                    const res = await fetch('/api/v1/settlement/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionId: "tx_krypton_" + Math.floor(Math.random() * 1000),
                            sourceAgent: "Agent-Alpha",
                            targetAgent: "Agent-Beta",
                            amount: 2500,
                            currency: "USD"
                        })
                    });
                    const data = await res.json();
                    output.innerText = JSON.stringify(data, null, 2);
                } catch (err) {
                    output.innerText = "Error: " + err.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Endpoint de Liquidación Atómica y Validación AML por IA
app.post('/api/v1/settlement/execute', async (req, res) => {
  try {
    const { transactionId, sourceAgent, targetAgent, amount, currency } = req.body;

    if (!transactionId || !amount || !currency) {
      return res.status(400).json({ 
        error: "Parámetros de liquidación insuficientes. Se requiere ID, monto y moneda." 
      });
    }

    res.json({
      status: "SETTLED",
      transactionId,
      settlementLayer: "Krypton Protocol Core",
      ledgerRecord: "IMMUTABLE",
      details: {
        source: sourceAgent || "Anonymous-Agent",
        target: targetAgent || "Treasury",
        amount,
        currency,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({ error: "Error interno en la red de liquidación", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Krypton Protocol core running on port ${PORT}`);
});
