# Shady Store

Loja React do Eminem com API Node/Express, MongoDB e CRUD de produtos.

## Docker

Na pasta `eminem`, execute:

```bash
docker compose up -d --build
```

O MongoDB fica em `localhost:27017` e a aplicação completa (frontend + API) em `http://localhost:3001` — o backend serve o build do React e expõe as rotas `/api/*`. O banco recebe produtos iniciais na primeira subida. O volume `mongodb_data` mantém os dados entre reinicializações.

## Desenvolvimento local

```bash
npm install
npm --prefix server install
copy server\.env.example server\.env
npm run api:dev
npm run dev
```

Rotas disponíveis: `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` e `GET /api/health`.
