/**
 * Codem Studios — Vercel OAuth Bridge
 * FILENAME: poll.js  →  deploy to /api/poll.js in your repo
 * Route: /api/poll?session=XXXXXXXX  (TV polls this every 5s)
 */

async function redisGet(key) {
    const url   = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Vercel KV env vars not set');
    const res = await fetch(url, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(['GET', key])
    });
    if (!res.ok) throw new Error('KV GET failed: ' + await res.text());
    const data = await res.json();
    return data.result; // null if key doesn't exist
}

async function redisDel(key) {
    const url   = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return; // best-effort, don't throw
    await fetch(url, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(['DEL', key])
    }).catch(() => {});
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const session = (req.query.session || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (session.length !== 8) {
        return res.status(400).json({ status: 'error', message: 'Invalid session ID' });
    }

    const key = `session:${session}`;
    try {
        const raw = await redisGet(key);
        if (!raw) {
            return res.json({ status: 'pending' });
        }
        const tokens = typeof raw === 'string' ? JSON.parse(raw) : raw;
        // Delete after first pickup (one-time use)
        await redisDel(key);
        console.log('[poll] Tokens claimed for session', session);
        return res.json({ status: 'authorized', tokens });
    } catch (err) {
        console.error('[poll] Error:', err.message);
        return res.status(500).json({ status: 'error', message: err.message });
    }
}
