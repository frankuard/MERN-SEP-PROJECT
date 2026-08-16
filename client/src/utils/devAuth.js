export const DEV_CREDENTIALS = {
  email: 'demo@campusconnect.local',
  password: 'Demo@123',
};

export class DevAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DevAuthError';
  }
}

export const isDevEnvironment = () => import.meta.env.DEV;

export const isNetworkError = (error) => {
  if (error?.response) return false;
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.message === 'Network Error' ||
    error?.message?.includes('Network Error')
  );
};

export const matchesDevCredentials = (email, password) => {
  return (
    email.trim().toLowerCase() === DEV_CREDENTIALS.email.toLowerCase() &&
    password === DEV_CREDENTIALS.password
  );
};

export const createDevToken = (userId) => `dev-token-${userId}`;

export const createDemoDevUser = () => ({
  id: 'dev-demo-user',
  username: 'Demo Student',
  email: DEV_CREDENTIALS.email,
  role: 'student',
  status: 'approved',
});

export const createDevUserFromSignup = ({ username, email, role = 'student' }) => ({
  id: `dev-user-${Date.now()}`,
  username,
  email,
  role: role || 'student',
  status: 'approved',
});

export const buildDevLoginResponse = (user, message = 'Development login successful') => ({
  message,
  token: createDevToken(user.id),
  user,
  devMode: true,
});
