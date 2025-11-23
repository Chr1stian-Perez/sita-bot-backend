const express = require('express');
const axios = require('axios');
const router = express.Router();

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';
const COGNITO_REDIRECT_URI = process.env.COGNITO_REDIRECT_URI;

// GET /api/auth/callback - Exchange authorization code for tokens
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('[AUTH] Exchanging code for tokens...');

    // Exchange code for tokens
    const tokenUrl = `https://${COGNITO_DOMAIN}/oauth2/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: COGNITO_CLIENT_ID,
      code: code,
      redirect_uri: COGNITO_REDIRECT_URI
    });

    const auth = Buffer.from(`${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });

    console.log('[AUTH] Tokens obtained successfully');
    res.json(response.data);
  } catch (error) {
    console.error('[AUTH] Callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to exchange authorization code',
      details: error.response?.data || error.message
    });
  }
});

// POST /api/auth/validate - Validate access token
router.post('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    console.log('[AUTH] Validating token...');

    // Validate token with Cognito userinfo endpoint
    const userInfoUrl = `https://${COGNITO_DOMAIN}/oauth2/userInfo`;
    
    const response = await axios.get(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[AUTH] Token validated successfully');
    res.json({ valid: true, user: response.data });
  } catch (error) {
    console.error('[AUTH] Validation error:', error.response?.data || error.message);
    res.status(401).json({ 
      valid: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router;
