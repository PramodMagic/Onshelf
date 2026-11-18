const { redis, auth } = require('./_lib');
const KEY = 'onshelf:saves';

module.exports = async (req, res) => {
  if (!auth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const h = (await redis.hgetall(KEY)) || {};
      const list = Object.entries(h).map(([id, v]) => {
        const o = typeof v === 'string' ? JSON.parse(v) : v;
        return { id, ...o };
      });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(list);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const bin = String(b.bin || '').trim().toUpperCase();
      const items = Array.isArray(b.items)
        ? b.items
            .map((i) => ({
              sku: String(i.sku || '').trim().toUpperCase(),
              qty: Math.max(1, parseInt(i.qty, 10) || 1),
            }))
            .filter((i) => i.sku)
        : [];
      if (!bin || !items.length) return res.status(400).json({ error: 'bin ya items missing hain' });
      const id = 's' + Date.now() + Math.random().toString(36).slice(2, 6);
      await redis.hset(KEY, { [id]: { bin, items, ts: Date.now(), by: String(b.by || '').slice(0, 60) } });
      return res.status(200).json({ id });
    }

    if (req.method === 'DELETE') {
      const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map(String) : [];
      if (ids.length) await redis.hdel(KEY, ...ids);
      return res.status(200).json({ deleted: ids.length });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
