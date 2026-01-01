import { VercelRequest, VercelResponse } from "@vercel/node";
import yahooFinance from "yahoo-finance2";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar headers CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Manejar preflight OPTIONS
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const mnqData = await getPrice("MNQ=F");
    const nqData = await getPrice("NQ=F");

    res.status(200).json({
      MNQ: mnqData,
      NQ: nqData,
    });
  } catch (error) {
    console.error("Error in /api/prices:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}

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
