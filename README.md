# API Precios Node.js

API REST en Node.js y TypeScript para scraping de precios de Yahoo Finance.

## Endpoints

- `GET /api/prices`: Devuelve los precios de MNQ=F y NQ=F en formato JSON.

## Despliegue en Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta `vercel` en el directorio del proyecto.
3. Sigue las instrucciones para desplegar.

Nota: WebSockets no están soportados en Vercel para conexiones persistentes. Para WebSockets, ejecuta el servidor localmente con `npm run dev`.

## Ejecución local

```bash
npm run dev
```

El servidor se ejecutará en http://localhost:3000

WebSocket en ws://localhost:3000

Cliente puede conectarse y recibir actualizaciones cada 30 segundos.