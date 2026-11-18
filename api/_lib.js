const { Redis } = require('@upstash/redis');

// Vercel Marketplace (Upstash) KV_REST_API_* ya UPSTASH_REDIS_REST_* dono chalte hain
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// Redis keys
const SAVES = 'onshelf:saves';       // har saved bin
const SESS = 'onshelf:sessions';     // har onshelf task (session)
const OPEN = 'onshelf:open:';        // user ka abhi chalu session -> OPEN + userKey

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

const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
// "  Ramesh   Kumar " -> "ramesh kumar" (same banda alag device se bhi same session mein aaye)
const userKey = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');

module.exports = { redis, auth, SAVES, SESS, OPEN, parse, userKey };
