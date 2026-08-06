import Cookies from "js-cookie";

const TOKEN_KEY = "smartsync_token";
const COOKIE_OPTIONS = {
  expires: 7,          // 7 days
  secure: true,        // HTTPS only in production
  sameSite: "strict" as const,
};

export const authUtils = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
  },

  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },

  isLoggedIn: (): boolean => {
    return !!Cookies.get(TOKEN_KEY);
  },
};