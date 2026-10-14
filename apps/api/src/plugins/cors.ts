import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../config/env.js';

export async function registerCors(app: FastifyInstance, env: Env) {
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      callback(Object.assign(new Error('Origen no autorizado.'), { statusCode: 403 }), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    strictPreflight: true,
    maxAge: 600,
  });
}
