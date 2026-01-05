import { VercelRequest, VercelResponse } from "@vercel/node";
import yahooFinance from "yahoo-finance2";

// Interfaz para los datos de precio
interface PriceData {
  price: string;
  change: string;
  percent: string;
  time: string;
}

// Cache global en memoria (por instancia en serverless)
interface Cache {
  data: { MNQ: PriceData | null; NQ: PriceData | null };
  timestamp: number;
}

const CACHE_TTL = 60 * 1000; // 60 segundos en ms
let cache: Cache = { data: { MNQ: null, NQ: null }, timestamp: 0 };
let fetchPromise: Promise<{
  MNQ: PriceData | null;
  NQ: PriceData | null;
}> | null = null;

// Función para obtener precios de Yahoo Finance
async function fetchPrices(): Promise<{
  MNQ: PriceData | null;
  NQ: PriceData | null;
}> {
  const symbols = ["MNQ=F", "NQ=F"];
  const results: { MNQ: PriceData | null; NQ: PriceData | null } = {
    MNQ: null,
    NQ: null,
  };

  for (const symbol of symbols) {
    try {
      const quote = await yahooFinance.quote(symbol);
      const data: PriceData = {
        price: quote.regularMarketPrice?.toString() || "",
        change: quote.regularMarketChange?.toString() || "",
        percent: quote.regularMarketChangePercent?.toString() || "",
        time: quote.regularMarketTime?.toISOString() || "",
      };
      if (symbol === "MNQ=F") results.MNQ = data;
      else results.NQ = data;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      // Mantener el último valor válido
    }
  }

  return results;
}

// Función para obtener precios con cache
async function getCachedPrices(): Promise<{
  MNQ: PriceData | null;
  NQ: PriceData | null;
}> {
  const now = Date.now();

  // Si el cache es válido, devolverlo
  if (now - cache.timestamp < CACHE_TTL && cache.data.MNQ && cache.data.NQ) {
    return cache.data;
  }

  // Si ya hay una promesa en curso, esperar a ella
  if (fetchPromise) {
    return await fetchPromise;
  }

  // Iniciar nueva fetch
  fetchPromise = fetchPrices();
  const newData = await fetchPromise;
  fetchPromise = null;

  // Actualizar cache solo si se obtuvieron datos nuevos
  if (newData.MNQ || newData.NQ) {
    cache.data = { ...cache.data, ...newData };
    cache.timestamp = now;
  }

  return cache.data;
}

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
    const data = await getCachedPrices();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in /api/prices:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}
