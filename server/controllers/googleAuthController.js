const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { getDbStatus } = require('../config/db');
const generateToken = require('../utils/generateToken');

const REQUIRED_DOMAIN = 'bicnepal.edu.np';

// Initialize Google OAuth2 Client
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return new OAuth2Client(clientId, clientSecret, 'postmessage');
};

const ensureDatabase = (res) => {
  if (!getDbStatus().connected) {
    res.status(503).json({ message: 'Database is unavailable. Please try again later.' });
    return false;
  }
  return true;
};

/**
 * Validates that an email strictly and exactly belongs to @bicnepal.edu.np
 * Prevents subdomains, prefix attacks, and other domains
 */
const validateBicDomain = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();

  // Strict regex check: must match name@bicnepal.edu.np
  const emailRegex = /^[a-zA-Z0-9._%+-]+@bicnepal\.edu\.np$/i;
  if (!emailRegex.test(normalized)) return false;

  const parts = normalized.split('@');
  if (parts.length !== 2) return false;

  return parts[1] === REQUIRED_DOMAIN;
};

/**
 * Helper to generate a clean, unique username from Google name or email
 */
const generateUniqueUsername = async (name, email, sub) => {
  let baseUsername = (name || email.split('@')[0] || 'student')
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();

  if (!baseUsername || baseUsername.length < 3) {
    baseUsername = 'student_' + (sub ? sub.slice(-4) : Math.floor(1000 + Math.random() * 9000));
  }

  let uniqueUsername = baseUsername;
  let counter = 1;

  while (await User.findOne({ username: uniqueUsername })) {
    uniqueUsername = `${baseUsername}${counter}`;
    counter++;
  }

  return uniqueUsername;
};

/**
 * Verify Google identity using ID Token (Credential), Authorization Code, or Access Token
 */
const verifyGoogleIdentity = async (body) => {
  const { credential, code, access_token } = body;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const client = getOAuth2Client();

  // 1. Verify via OpenID Connect ID Token (credential from Google Identity Services)
  if (credential) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId ? [clientId] : undefined,
      });
      const payload = ticket.getPayload();
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        picture: payload.picture || '',
        emailVerified: payload.email_verified,
        hd: payload.hd,
      };
    } catch (err) {
      // Direct tokeninfo fallback check if verifyIdToken encounters certificate latency
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (response.ok) {
          const payload = await response.json();
          if (clientId && payload.aud !== clientId) {
            throw new Error('Google token audience mismatch');
          }
          return {
            sub: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || '',
            emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
            hd: payload.hd,
          };
        }
      } catch (fallbackErr) {
        console.warn('Tokeninfo fallback failed:', fallbackErr.message);
      }
      throw new Error(`Google ID Token verification failed: ${err.message}`);
    }
  }

  // 2. Verify via Authorization Code exchange
  if (code) {
    const { tokens } = await client.getToken(code);
    if (tokens.id_token) {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId ? [clientId] : undefined,
      });
      const payload = ticket.getPayload();
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || '',
        emailVerified: payload.email_verified,
        hd: payload.hd,
      };
    } else if (tokens.access_token) {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!userinfoRes.ok) {
        throw new Error('Failed to fetch Google user profile from access token');
      }
      const profile = await userinfoRes.json();
      return {
        sub: profile.sub,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        picture: profile.picture || '',
        emailVerified: profile.email_verified,
        hd: profile.hd,
      };
    }
  }

  // 3. Verify via Access Token
  if (access_token) {
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userinfoRes.ok) {
      throw new Error('Invalid Google access token');
    }
    const profile = await userinfoRes.json();
    return {
      sub: profile.sub,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      picture: profile.picture || '',
      emailVerified: profile.email_verified,
      hd: profile.hd,
    };
  }

  throw new Error('No valid Google authentication credential, code, or access token provided');
};

/**
 * POST /api/auth/google
 * Authenticates user via Google OAuth 2.0 / OpenID Connect
 * STRICTLY ENFORCES: Only @bicnepal.edu.np accounts permitted
 */
const googleAuth = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;

    // 1. Verify Google identity cryptographically with Google servers
    let googleUser;
    try {
      googleUser = await verifyGoogleIdentity(req.body);
    } catch (err) {
      return res.status(401).json({
        message: 'Google authentication failed. Invalid identity token or signature.',
        error: err.message,
      });
    }

    const { sub, email, name, picture, emailVerified } = googleUser;

    if (!email) {
      return res.status(400).json({ message: 'Google account did not return an email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. STRICT SERVER-SIDE DOMAIN VALIDATION (@bicnepal.edu.np ONLY)
    if (!validateBicDomain(normalizedEmail)) {
      return res.status(403).json({
        message: 'Only BIC institutional email accounts (@bicnepal.edu.np) are allowed to sign in.',
        domainError: true,
        providedEmail: normalizedEmail,
        allowedDomain: REQUIRED_DOMAIN,
      });
    }

    // 3. Verify email_verified status from Google
    if (emailVerified === false) {
      return res.status(403).json({
        message: 'Your Google email address is not verified by Google. Please verify your Google Workspace account before signing in.',
      });
    }

    // 4. Look up user by Google Account ID (sub)
    let user = await User.findOne({ googleId: sub });

    if (user) {
      // Existing Google user — update last login and profile picture if changed
      user.lastLogin = new Date();
      user.emailVerified = true;
      if (picture && (!user.profileImage || user.profileImage.includes('googleusercontent.com'))) {
        user.profileImage = picture;
      }
      await user.save();
    } else {
      // 5. Look up by email (in case user registered locally earlier)
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Link existing account with Google identity
        user.googleId = sub;
        user.authProvider = user.authProvider || 'google';
        user.emailVerified = true;
        user.lastLogin = new Date();
        if (picture && !user.profileImage) {
          user.profileImage = picture;
        }
        await user.save();
      } else {
        // 6. Brand new user — create account in MongoDB
        const uniqueUsername = await generateUniqueUsername(name, normalizedEmail, sub);

        user = await User.create({
          username: uniqueUsername,
          email: normalizedEmail,
          googleId: sub,
          authProvider: 'google',
          role: 'student',
          status: 'approved',
          department: 'Computer Science',
          semester: 'Level 4',
          emailVerified: true,
          profileImage: picture || '',
          lastLogin: new Date(),
        });
      }
    }

    // 7. Account status enforcement
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending administrator approval.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account request was rejected. Please contact support.' });
    }

    // 8. Generate application JWT session token and set HttpOnly Cookie
    const token = generateToken(user._id, user.role);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // 9. Success response with in-memory user data only
    res.status(200).json({
      message: 'Google sign-in successful',
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        department: user.department,
        semester: user.semester,
        authProvider: user.authProvider || 'google',
      },
    });
  } catch (err) {
    console.error('Google OAuth Controller Error:', err);
    res.status(500).json({ message: err.message || 'Internal server error during Google sign-in' });
  }
};

/**
 * GET /api/auth/google/config
 * Returns public Google Client ID configuration and allowed domain for the frontend
 */
const getGoogleConfig = (req, res) => {
  res.status(200).json({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    allowedDomain: REQUIRED_DOMAIN,
  });
};

module.exports = {
  googleAuth,
  getGoogleConfig,
  validateBicDomain,
};
