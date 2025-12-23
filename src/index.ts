import express from "express";
import { WebSocketServer } from "ws";
import YahooFinance from "yahoo-finance2";

const app = express();
const port = 3000;

const yahooFinance = new YahooFinance();

// Función para obtener precios usando yahoo-finance2
async function getPrice(symbol: string): Promise<{
  price: string;
  change: string;
  percent: string;
  time: string;
} | null> {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      price: quote.regularMarketPrice?.toString() || "",
      change: quote.regularMarketChange?.toString() || "",
      percent: quote.regularMarketChangePercent?.toString() || "",
      time: quote.regularMarketTime?.toISOString() || "",
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

// Endpoint GET
app.get("/prices", async (req, res) => {
  try {
    const mnqData = await getPrice("MNQ=F");
    const nqData = await getPrice("NQ=F");

    res.json({
      MNQ: mnqData,
      NQ: nqData,
    });
  } catch (error) {
    console.error("Error in /prices:", error);
    res.status(500).json({ error: "Error scraping data" });
  }
});

// Servidor HTTP
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Enviar datos cada 30 segundos
  const interval = setInterval(async () => {
    try {
      const mnqData = await getPrice("MNQ=F");
      const nqData = await getPrice("NQ=F");

      ws.send(
        JSON.stringify({
          MNQ: mnqData,
          NQ: nqData,
        })
      );
    } catch (error) {
      ws.send(JSON.stringify({ error: "Error fetching data" }));
    }
  }, 30000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});
