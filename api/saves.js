const { redis, auth, SAVES, SESS, OPEN, parse, userKey } = require('./_lib');

// User ka chalu (open) session dhundo; na ho to naya banao. Do device ek saath save karein to bhi ek hi session banega.
async function openSession(user) {
  const uk = userKey(user);
  for (let attempt = 0; attempt < 3; attempt++) {
    const cur = await redis.get(OPEN + uk);
    if (cur) {
      const s = await redis.hget(SESS, String(cur));
      if (s && parse(s).status === 'open') return String(cur);
      await redis.del(OPEN + uk); // purana/ghalat pointer
    }
    const id = 'o' + Date.now() + Math.random().toString(36).slice(2, 6);
    const got = await redis.set(OPEN + uk, id, { nx: true });
    if (got) {
      await redis.hset(SESS, { [id]: { user: user.trim().replace(/\s+/g, ' '), uk, ts: Date.now(), status: 'open', end: null } });
      return id;
    }
  }
  throw new Error('session nahi ban paya, dobara try karo');
}

module.exports = async (req, res) => {
  if (!auth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const [h, sh] = await Promise.all([redis.hgetall(SAVES), redis.hgetall(SESS)]);
      const saves = Object.entries(h || {}).map(([id, v]) => ({ id, ...parse(v) }));
      const sessions = Object.entries(sh || {}).map(([id, v]) => ({ id, ...parse(v) }));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ saves, sessions });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const bin = String(b.bin || '').trim().toUpperCase();
      const user = String(b.user || '').trim().slice(0, 40);
      const items = Array.isArray(b.items)
        ? b.items
            .map((i) => ({
              sku: String(i.sku || '').trim().toUpperCase(),
              qty: Math.max(1, parseInt(i.qty, 10) || 1),
            }))
            .filter((i) => i.sku)
        : [];
      if (!user) return res.status(400).json({ error: 'user ka naam missing hai' });
      if (!bin || !items.length) return res.status(400).json({ error: 'bin ya items missing hain' });
      const sid = await openSession(user);
      const id = 's' + Date.now() + Math.random().toString(36).slice(2, 6);
      await redis.hset(SAVES, {
        [id]: { bin, items, ts: Date.now(), by: String(b.by || '').slice(0, 60), user, sid },
      });
      return res.status(200).json({ id, sid });
    }

    if (req.method === 'DELETE') {
      const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map(String) : [];
      const sids = Array.isArray(req.body && req.body.sids) ? req.body.sids.map(String) : [];
      if (sids.length) {
        const sh = (await redis.hgetall(SESS)) || {};
        for (const sid of sids) {
          if (!sh[sid]) continue;
          const s = parse(sh[sid]);
          if ((await redis.get(OPEN + s.uk)) === sid) await redis.del(OPEN + s.uk);
        }
        await redis.hdel(SESS, ...sids);
      }
      if (ids.length) await redis.hdel(SAVES, ...ids);
      return res.status(200).json({ deleted: ids.length, sessions: sids.length });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
