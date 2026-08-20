import axiosInstance from '../api/axiosInstance';

let gsiScriptLoadingPromise = null;
const REQUIRED_DOMAIN = 'bicnepal.edu.np';

/**
 * Dynamically load Google Identity Services SDK (gsi/client)
 */
export const loadGoogleScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));

  if (window.google?.accounts) {
    return Promise.resolve(window.google.accounts);
  }

  if (gsiScriptLoadingPromise) {
    return gsiScriptLoadingPromise;
  }

  gsiScriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-identity-services');
    if (existingScript) {
      existingScript.onload = () => resolve(window.google.accounts);
      existingScript.onerror = (err) => reject(err);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts) {
        resolve(window.google.accounts);
      } else {
        reject(new Error('Google Identity Services SDK loaded but window.google.accounts is undefined'));
      }
    };
    script.onerror = () => {
      gsiScriptLoadingPromise = null;
      reject(new Error('Failed to load Google Identity Services SDK. Please check your internet connection.'));
    };

    document.head.appendChild(script);
  });

  return gsiScriptLoadingPromise;
};

/**
 * Retrieve Google Client ID from environment or backend config
 */
export const getGoogleClientId = async () => {
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envClientId && envClientId.trim()) {
    return envClientId.trim();
  }

  try {
    const res = await axiosInstance.get('/auth/google/config');
    if (res.data?.clientId && res.data.clientId.trim()) {
      return res.data.clientId.trim();
    }
  } catch (err) {
    console.warn('Could not fetch Google Client ID from backend config:', err.message);
  }

  return '';
};

/**
 * Custom error class to distinguish user cancellation from actual errors
 */
export class GoogleAuthCancelledError extends Error {
  constructor(message = 'Google Sign-In was cancelled') {
    super(message);
    this.name = 'GoogleAuthCancelledError';
    this.isCancelled = true;
  }
}

/**
 * Format Google Identity Services errors with actionable messages
 */
const formatGoogleAuthError = (error) => {
  if (!error) return new Error('Google Sign-In failed. Please try again.');

  const errorType = (typeof error === 'string' ? error : error?.error || error?.type || error?.message || '').toLowerCase();

  // User closed popup or cancelled
  if (
    errorType.includes('popup_closed') ||
    errorType.includes('popup_blocked') ||
    errorType.includes('closed') ||
    errorType.includes('user_cancel') ||
    errorType.includes('cancel')
  ) {
    return new GoogleAuthCancelledError('Google Sign-In was cancelled.');
  }

  if (errorType.includes('origin_mismatch') || errorType.includes('400')) {
    const currentOrigin = window.location.origin;
    return new Error(
      `Origin Mismatch (Error 400): "${currentOrigin}" is not listed in Authorized JavaScript Origins in Google Cloud Console. Please add "${currentOrigin}" in your OAuth 2.0 Client ID settings.`
    );
  }

  if (errorType.includes('access_denied')) {
    return new Error('Access was denied. Please allow permissions for your @bicnepal.edu.np Google Workspace account.');
  }

  if (errorType.includes('idpiframe_initialization_failed')) {
    return new Error('Google Sign-In failed to initialize. Please ensure third-party cookies or popups are not blocked.');
  }

  if (errorType.includes('network') || errorType.includes('offline')) {
    return new Error('Network error connecting to Google servers. Please check your internet connection.');
  }

  return new Error(error?.message || error?.error_description || error?.error || 'Google Sign-In failed. Please try again.');
};

/**
 * Triggers official Google OAuth 2.0 account chooser popup
 * with Hosted Domain restriction (hd: bicnepal.edu.np)
 */
export const triggerGoogleAuth = async () => {
  const accounts = await loadGoogleScript();
  const clientId = await getGoogleClientId();

  if (!clientId) {
    throw new Error(
      'Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in server/.env or VITE_GOOGLE_CLIENT_ID in client/.env'
    );
  }

  return new Promise((resolve, reject) => {
    try {
      // Approach 1: OAuth 2.0 Token Client (Cleanest & most reliable popup flow across all browsers)
      if (accounts.oauth2 && typeof accounts.oauth2.initTokenClient === 'function') {
        let isCompleted = false;

        const tokenClient = accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          hd: REQUIRED_DOMAIN,
          prompt: 'select_account',
          callback: (tokenRes) => {
            isCompleted = true;
            if (tokenRes.error) {
              reject(formatGoogleAuthError(tokenRes));
            } else if (tokenRes.access_token) {
              resolve({ access_token: tokenRes.access_token });
            } else {
              reject(new GoogleAuthCancelledError());
            }
          },
          error_callback: (error) => {
            isCompleted = true;
            reject(formatGoogleAuthError(error));
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      // Approach 2: OAuth 2.0 Code Client fallback
      if (accounts.oauth2 && typeof accounts.oauth2.initCodeClient === 'function') {
        const client = accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          hd: REQUIRED_DOMAIN,
          select_account: true,
          callback: (response) => {
            if (response.error) {
              reject(formatGoogleAuthError(response));
            } else if (response.code) {
              resolve({ code: response.code });
            } else {
              reject(new GoogleAuthCancelledError());
            }
          },
          error_callback: (error) => {
            reject(formatGoogleAuthError(error));
          },
        });

        client.requestCode();
        return;
      }

      // Approach 3: OpenID Connect Credential Prompt (One-Tap / standard popup)
      if (accounts.id && typeof accounts.id.initialize === 'function') {
        accounts.id.initialize({
          client_id: clientId,
          hd: REQUIRED_DOMAIN,
          callback: (response) => {
            if (response.credential) {
              resolve({ credential: response.credential });
            } else {
              reject(new GoogleAuthCancelledError());
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error('Google Sign-In popup could not be displayed. Please check popup blockers.'));
          }
        });
        return;
      }

      reject(new Error('Google Identity Services client initialization not supported in this browser.'));
    } catch (err) {
      reject(formatGoogleAuthError(err));
    }
  });
};
