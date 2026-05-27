const parseOrigin = (value) => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getConfiguredOrigins = () => {
  const rawOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  return rawOrigins
    .map(parseOrigin)
    .filter(Boolean);
};

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = parseOrigin(origin);
  if (!normalizedOrigin) return false;

  const allowedOrigins = getConfiguredOrigins();
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  try {
    const hostname = new URL(normalizedOrigin).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }

  return false;
};

export const getAllowedOrigins = () => getConfiguredOrigins();