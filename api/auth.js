/**
 * Codem Studios — Vercel OAuth Bridge
 * FILENAME: auth.js  →  deploy to /api/auth.js in your repo
 * Route: /api/auth?session=XXXXXXXX
 */

const CLIENT_ID   = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = 'https://codem-studios.vercel.app/api/callback';
const SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.appdata'
].join(' ');

export default function handler(req, res) {
    const session = (req.query.session || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (session.length !== 8) {
        return res.status(400).send('Invalid or missing session code.');
    }
    const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        response_type: 'code',
        scope:         SCOPES,
        access_type:   'offline',
        prompt:        'consent',
        state:         session
    });
    return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
