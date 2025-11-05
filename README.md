# Sistema de Eventos Bancarios (modificado) — TP Final

Servicios:
- API (api/) -> POST /transactions -> publica en txn.commands
- Orchestrator (orchestrator/) -> consume txn.commands, emite txn.events y en errores publica en txn.dlq
- Gateway WS (gateway/) -> consume txn.events y retransmite por WebSocket a clientes (filtros por userId/transactionId)
- Frontend (frontend/) -> Next.js -> conecta por WS y muestra timeline

Tópicos Kafka: txn.commands, txn.events, txn.dlq
Clave de partición: transactionId

Cómo arrancar:
1. `docker compose up -d` (en la raíz)
2. `cd orchestrator && npm install && npm start`
3. `cd api && npm install && npm start`
4. `cd gateway && npm install && npm start`
5. `cd frontend && npm install && npm run dev`
6. POST /transactions a `http://localhost:3001/transactions` con `{ "userId":"demo-user", "amount":2000 }`
