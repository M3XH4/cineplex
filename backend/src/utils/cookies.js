const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
});

const getMaxAge = (expiresInMs) => expiresInMs;

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...baseCookieOptions(),
    maxAge: getMaxAge(24 * 60 * 60 * 1000),
  });

  res.cookie('refreshToken', refreshToken, {
    ...baseCookieOptions(),
    maxAge: getMaxAge(7 * 24 * 60 * 60 * 1000),
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', baseCookieOptions());
  res.clearCookie('refreshToken', baseCookieOptions());
};

export const getCookieValue = (cookieHeader, cookieName) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
  if (!match) return null;

  return decodeURIComponent(match.slice(cookieName.length + 1));
};