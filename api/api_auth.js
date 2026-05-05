/**
 * Codem Studios — Vercel OAuth Bridge
 * Step 1: Redirect the user's phone/PC browser to Google's sign-in page.
 *
 * Called by: login.html when user submits their session code.
 * URL: /api/auth?session=A3BX7K9P
 */

const CLIENT_ID   = '698198831884-7i3mp6d6s3vnnus7qoje0181iv3pp7ni.apps.googleusercontent.com';
const REDIRECT_URI = 'https://codem-studios.vercel.app/api/callback';
const SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.appdata'
].join(' ');

export default function handler(req, res) {
    const { session } = req.query;

    // Basic validation — session must be exactly 8 uppercase alphanumeric chars
    if (!session || !/^[A-Z0-9]{8}$/.test(session.toUpperCase())) {
        return res.status(400).send('Invalid or missing session code.');
    }

    const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        response_type: 'code',
        scope:         SCOPES,
        access_type:   'offline',   // Get a refresh_token
        prompt:        'consent',   // Force consent so refresh_token is always issued
        state:         session.toUpperCase()
    });

    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('[auth] Redirecting session', session, 'to Google OAuth');
    res.redirect(302, googleAuthURL);
}
