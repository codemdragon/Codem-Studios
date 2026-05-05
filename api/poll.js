/**
 * Codem Studios — Vercel OAuth Bridge
 * Step 3: The TV polls this endpoint every 5 seconds until tokens are ready.
 *
 * Responses:
 *   { status: 'pending' }              — user hasn't signed in yet
 *   { status: 'authorized', tokens: { access_token, refresh_token, expiry_time, ... } }
 *   { status: 'error', message: '...' }
 *
 * Tokens are deleted from Redis on first successful retrieval (one-time pickup).
 *
 * Requires Upstash Redis env vars (set by Vercel integration):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Missing Upstash Redis env vars. Set up Redis in Vercel Storage.');
}

export default async function handler(req, res) {
    // Allow TV (any origin) to reach this endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { session } = req.query;

    if (!session || !/^[A-Z0-9]{8}$/i.test(session)) {
        return res.status(400).json({ status: 'error', message: 'Invalid session ID' });
    }

    const key = `session:${session.toUpperCase()}`;

    try {
        // GET the token from Redis
        const getResponse = await fetch(`${REDIS_URL}/get/${key}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${REDIS_TOKEN}`
            }
        });

        if (!getResponse.ok) {
            throw new Error('Redis GET failed: ' + await getResponse.text());
        }

        const getData = await getResponse.json();
        const raw = getData.result;

        if (!raw) {
            // Not ready yet — TV should keep polling
            return res.json({ status: 'pending' });
        }

        // Parse the stored JSON
        const tokens = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // One-time retrieval — delete immediately after pickup
        const delResponse = await fetch(`${REDIS_URL}/del/${key}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REDIS_TOKEN}`
            }
        });

        if (!delResponse.ok) {
            console.warn('[poll] Failed to delete session key, but returning tokens anyway');
        }

        console.log('[poll] Tokens claimed for session', session);
        return res.json({ status: 'authorized', tokens });

    } catch (err) {
        console.error('[poll] Redis error for session', session, ':', err.message);
        return res.status(500).json({ status: 'error', message: 'Server error, please retry.' });
    }
}
