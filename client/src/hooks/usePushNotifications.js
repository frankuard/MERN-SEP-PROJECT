import { useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

// Converts a base64 URL-safe string (VAPID public key) to a Uint8Array
// as required by PushManager.subscribe({ applicationServerKey }).
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

const usePushNotifications = () => {
  useEffect(() => {
    // Bail out if the browser doesn't support the APIs we need
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    let mounted = true;

    const setup = async () => {
      try {
        // 1. Register the service worker
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // 2. Ask the user for notification permission (only prompts once)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // 3. Fetch our VAPID public key from the server
        const { data } = await axiosInstance.get('/push/vapid-public-key');
        if (!mounted || !data.publicKey) return;

        // 4. Check if there's already an active subscription for this browser
        const existing = await registration.pushManager.getSubscription();

        let subscription = existing;

        // 5. If not, create a new one
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey),
          });
        }

        // 6. Save the subscription to our backend (upsert — safe to call every time)
        const sub = subscription.toJSON();
        await axiosInstance.post('/push/subscribe', {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth:   sub.keys.auth,
          },
        });
      } catch (err) {
        // Non-fatal — push not critical to the app
        if (err?.response?.status !== 401) {
          // Suppress 401 (user not logged in yet) silently
          console.warn('[PushNotifications] Setup error (non-fatal):', err.message);
        }
      }
    };

    setup();
    return () => { mounted = false; };
  }, []);
};

export default usePushNotifications;
