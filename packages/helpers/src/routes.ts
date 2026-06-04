const base = "/api/v1" as const;

export const ROUTES = {
  auth: {
    register: `${base}/auth/register`,
    login: `${base}/auth/login`,
    logout: `${base}/auth/logout`,
    forgotPassword: `${base}/auth/forgot-password`,
    resetPassword: `${base}/auth/reset-password`,
    refreshToken: `${base}/auth/refresh`,
    getCurrentUser: `${base}/auth/me`,
    changePassword: `${base}/auth/change-password`,
    updateProfile: `${base}/auth/update-profile`,
  },
  conversation: {
    addNewFriend: `${base}/conversation/add-new-friend`,
    list: `${base}/conversation/list`,
    sendMessage: `${base}/conversation/send-message`,
    getMessages: `${base}/conversation/messages/:conversationId`,
  },
} as const;

// Route builder — replaces :param with actual values
// Usage: buildRoute(ROUTES.post.get, { postId: "abc123" }) → "/api/v1/posts/abc123"

type RouteParams = Record<string, string | number>;

export const buildRoute = (route: string, params: RouteParams): string => {
  return Object.entries(params).reduce<string>(
    (acc, [key, value]) => acc.replace(`:${key}`, String(value)),
    route,
  );
};
