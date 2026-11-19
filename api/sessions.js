const { redis, auth, SESS, OPEN, parse } = require('./_lib');

// POST { action:'complete', id } -> onshelf task close (session complete)
module.exports = async (req, res) => {
  if (!auth(req, res)) return;
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end();
    }
    const b = req.body || {};
    const id = String(b.id || '');
    if (b.action !== 'complete' || !id) return res.status(400).json({ error: 'bad_request' });
    const raw = await redis.hget(SESS, id);
    if (!raw) return res.status(404).json({ error: 'session_not_found' });
    const s = parse(raw);
    if (s.status !== 'closed') {
      s.status = 'closed';
      s.end = Date.now();
      await redis.hset(SESS, { [id]: s });
    }
    if ((await redis.get(OPEN + s.uk)) === id) await redis.del(OPEN + s.uk);
    return res.status(200).json({ ok: true, id, end: s.end });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
