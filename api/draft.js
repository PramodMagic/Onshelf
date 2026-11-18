const { redis, auth } = require('./_lib');
const ok = (d) => /^[a-zA-Z0-9]{6,40}$/.test(String(d || ''));

// Abhi scan ho rahi (unsaved) bin ka backup, device ke hisaab se
module.exports = async (req, res) => {
  if (!auth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const dev = req.query && req.query.dev;
      if (!ok(dev)) return res.status(400).json({ error: 'bad_dev' });
      const d = await redis.get('onshelf:draft:' + dev);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(d || {});
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      if (!ok(b.dev)) return res.status(400).json({ error: 'bad_dev' });
      const items = Array.isArray(b.items)
        ? b.items.map((i) => ({ sku: String(i.sku || ''), qty: Math.max(1, parseInt(i.qty, 10) || 1) }))
        : [];
      await redis.set('onshelf:draft:' + b.dev, { bin: String(b.bin || ''), items }, { ex: 60 * 60 * 24 * 7 });
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
