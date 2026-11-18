const { Redis } = require('@upstash/redis');

// Vercel Marketplace (Upstash) KV_REST_API_* ya UPSTASH_REDIS_REST_* dono chalte hain
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

function auth(req, res) {
  const pin = process.env.APP_PIN;
  if (!pin) {
    res.status(500).json({ error: 'APP_PIN set nahi hai (Vercel Environment Variables mein add karo)' });
    return false;
  }
  if (req.headers['x-pin'] !== pin) {
    res.status(401).json({ error: 'bad_pin' });
    return false;
  }
  return true;
}

module.exports = { redis, auth };
