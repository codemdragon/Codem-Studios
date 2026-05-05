/**
 * Codem Studios — Vercel OAuth Bridge
 * FILENAME: callback.js  →  deploy to /api/callback.js in your repo
 * Route: /api/callback  (this is your Google redirect URI)
 */

const CLIENT_ID     = '698198831884-7i3mp6d6s3vnnus7qoje0181iv3pp7ni.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI  = 'https://codem-studios.vercel.app/api/callback';

async function redisSet(key, value, exSeconds) {
    const url   = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Vercel KV env vars not set');

    const res = await fetch(url, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(['SET', key, value, 'EX', exSeconds])
    });

    if (!res.ok) throw new Error('KV SET failed: ' + await res.text());
}

export default async function handler(req, res) {
    const { code, state: session, error: googleError } = req.query;

    if (googleError) {
        return res.redirect(302, `/login.html?error=${encodeURIComponent(googleError)}`);
    }
    if (!code || !session) {
        return res.status(400).send('Missing code or state.');
    }

    try {
        // Exchange auth code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id:     CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri:  REDIRECT_URI,
                grant_type:    'authorization_code'
            }).toString()
        });

        const tokens = await tokenRes.json();
        if (tokens.error) throw new Error(tokens.error_description || tokens.error);

        tokens.expiry_time = Date.now() + ((tokens.expires_in || 3600) * 1000);

        // Store in Vercel KV — 10 min TTL
        await redisSet(`session:${session.toUpperCase()}`, JSON.stringify(tokens), 600);

        console.log('[callback] Tokens stored for session', session);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(successPage());

    } catch (err) {
        console.error('[callback] Error:', err.message);
        res.redirect(302, `/login.html?error=${encodeURIComponent(err.message)}`);
    }
}

function successPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codem Studios — Connected!</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080c14; color: #fff;
      font-family: -apple-system, 'DM Sans', sans-serif;
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; padding: 24px;
      background-image: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,209,255,0.07) 0%, transparent 70%);
    }
    .card {
      background: #0f1623; border: 1px solid rgba(0,209,255,0.25);
      border-radius: 24px; padding: 52px 44px; text-align: center;
      max-width: 400px; width: 100%;
      box-shadow: 0 0 60px rgba(0,209,255,0.08), 0 24px 64px rgba(0,0,0,0.5);
      animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes rise { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:none; } }
    .icon { font-size: 56px; margin-bottom: 24px; }
    h1 { color: #00d1ff; font-size: 22px; margin-bottom: 12px; font-weight: 700; }
    p { font-size: 15px; color: #7a8a9a; line-height: 1.65; }
    .pill {
      display: inline-block; margin-top: 28px;
      background: rgba(0,209,255,0.08); border: 1px solid rgba(0,209,255,0.2);
      border-radius: 100px; padding: 8px 20px;
      font-size: 12px; color: #00d1ff; letter-spacing: 2px; text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Google Drive Connected</h1>
    <p>Your TV is receiving the authorization now.<br>This tab can be safely closed.</p>
    <div class="pill">Codem Studios</div>
  </div>
</body>
</html>`;
}
