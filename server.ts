import Fastify from 'fastify';
import cors from '@fastify/cors';
import middie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.js';
import { registerRoutes } from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'warn',
    },
  });

  // Enable CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Initialize DB & auto-migration
  await initDatabase();

  // Register API Routes
  await registerRoutes(fastify);

  // Vite middleware in dev or static serving in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    await fastify.register(middie);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Rotas /api seguem para o Fastify; o fallback SPA do Vite devolveria index.html
    fastify.use((req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
      if (req.url?.startsWith('/api')) return next();
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    await fastify.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });

    fastify.setNotFoundHandler((req, reply) => {
      if (req.raw.url && req.raw.url.startsWith('/api')) {
        return reply.status(404).send({ error: 'Rota de API não encontrada' });
      }
      return reply.sendFile('index.html');
    });
  }

  const PORT = 3000;
  const HOST = '0.0.0.0';

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Servidor Fastify do Painel BPC Recife rodando em http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
