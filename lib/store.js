import { Redis } from '@upstash/redis';

// Vercel + Upstash Redis crea estas variables al conectar la base de datos al proyecto.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// Sin base de datos (solo en local) se usa memoria para poder probar.
const mem = globalThis.__premiosMem || (globalThis.__premiosMem = new Map());
const PREFIX = 'premios2026:';

export const usingMemory = !redis;

export async function get(key) {
  if (redis) return (await redis.get(PREFIX + key)) ?? null;
  const v = mem.get(PREFIX + key);
  if (!v) return null;
  if (v.exp && v.exp < Date.now()) { mem.delete(PREFIX + key); return null; }
  return JSON.parse(v.val);
}

export async function mget(keys) {
  if (!keys.length) return [];
  if (redis) return await redis.mget(...keys.map(k => PREFIX + k));
  return Promise.all(keys.map(get));
}

export async function set(key, value) {
  if (redis) return redis.set(PREFIX + key, value);
  mem.set(PREFIX + key, { val: JSON.stringify(value) });
}

export async function del(key) {
  if (redis) return redis.del(PREFIX + key);
  mem.delete(PREFIX + key);
}

export async function incrWithTtl(key, ttlSeconds) {
  if (redis) {
    const n = await redis.incr(PREFIX + key);
    if (n === 1) await redis.expire(PREFIX + key, ttlSeconds);
    return n;
  }
  const cur = (await get(key)) || 0;
  const prev = mem.get(PREFIX + key);
  mem.set(PREFIX + key, { val: JSON.stringify(cur + 1), exp: prev?.exp || Date.now() + ttlSeconds * 1000 });
  return cur + 1;
}
