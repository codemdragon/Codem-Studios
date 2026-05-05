/**
 * Codem Studios — Vercel OAuth Bridge
 * Step 2: Google redirects here after the user signs in.
 *
 * - Exchanges the one-time `code` for access + refresh tokens.
 * - Stores them in Upstash Redis under `session:<SESSION_ID>` with a 10-min TTL.
 * - Shows a success page so the user knows they can return to their TV.
 *
 * Google Console redirect URI must be set to:
 *   https://codem-studios.vercel.app/api/callback
 *
 * Requires Upstash Redis env vars (set by Vercel integration):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const CLIENT_ID     = '698198831884-7i3mp6d6s3vnnus7qoje0181iv3pp7ni.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI  = 'https://codem-studios.vercel.app/api/callback';
const TOKEN_URL     = 'https://oauth2.googleapis.com/token';

// Upstash Redis REST API
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Missing Upstash Redis env vars. Set up Redis in Vercel Storage.');
}

export default async function handler(req, res) {
    const { code, state: session, error: googleError } = req.query;

    // User denied access on Google's side
    if (googleError) {
        console.warn('[callback] Google returned error:', googleError);
        return res.redirect(302, `/login.html?error=${encodeURIComponent(googleError)}`);
    }

    if (!code || !session) {
        return res.status(400).send('Missing authorization code or state.');
    }

    try {
        // Exchange authorization code for tokens
        const tokenRes = await fetch(TOKEN_URL, {
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

        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
        }

        // Attach absolute expiry time so the TV can check it directly
        tokens.expiry_time = Date.now() + ((tokens.expires_in || 3600) * 1000);

        // Store in Upstash Redis — key lives for 10 minutes (TV has plenty of time to poll)
        // Using SET command with EX (expire in seconds)
        const redisSetResponse = await fetch(`${REDIS_URL}/set/session:${session.toUpperCase()}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REDIS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                value: JSON.stringify(tokens),
                ex: 600  // 10 minutes
            })
        });

        if (!redisSetResponse.ok) {
            throw new Error('Failed to store tokens in Redis: ' + await redisSetResponse.text());
        }

        console.log('[callback] Tokens stored for session', session);

        // Return a branded success page
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(successPage());

    } catch (err) {
        console.error('[callback] Token exchange failed:', err.message);
        res.redirect(302, `/login.html?error=${encodeURIComponent('Token exchange failed: ' + err.message)}`);
    }
}

// ── Success page shown on phone/PC after sign-in ────────────────────────────
function successPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codem Studios — Connected!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --cyan:  #00d1ff;
      --bg:    #080c14;
      --card:  #0f1623;
      --border: rgba(0,209,255,0.25);
    }

    body {
      background: var(--bg);
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background-image:
        radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,209,255,0.07) 0%, transparent 70%);
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 52px 44px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 0 60px rgba(0,209,255,0.08), 0 24px 64px rgba(0,0,0,0.5);
      animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes rise {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: none; }
    }

    .check-ring {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(0,209,255,0.1);
      border: 2px solid rgba(0,209,255,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 28px;
      font-size: 36px;
    }

    h1 {
      font-family: 'Space Mono', monospace;
      font-size: 22px;
      color: var(--cyan);
      margin-bottom: 14px;
      letter-spacing: -0.5px;
    }

    p {
      font-size: 15px;
      color: #8899aa;
      line-height: 1.65;
    }

    .pill {
      display: inline-block;
      margin-top: 28px;
      background: rgba(0,209,255,0.08);
      border: 1px solid rgba(0,209,255,0.2);
      border-radius: 100px;
      padding: 8px 20px;
      font-size: 13px;
      color: var(--cyan);
      font-family: 'Space Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="check-ring">✓</div>
    <h1>Google Drive Connected</h1>
    <p>Your TV is receiving the authorization now. This tab can be safely closed.</p>
    <div class="pill">CODEM STUDIOS</div>
  </div>
</body>
</html>`;
}
