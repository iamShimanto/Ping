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
    updateStatus: `${base}/auth/update-status`,
  },
  conversations: {
    addNewFriend: `${base}/conversations/add-new-friend`,
    createGroup: `${base}/conversations/create-group`,
    list: `${base}/conversations/list`,
    getOne: `${base}/conversations/:conversationId`,
    sendMessage: `${base}/conversations/messages/send`,
    getMessages: `${base}/conversations/messages/:conversationId`,
    deleteMessage: `${base}/conversations/messages/:messageId`,
    markRead: `${base}/conversations/messages/:messageId/read`,
    markAllRead: `${base}/conversations/messages/read-all/:conversationId`,
    searchMessages: `${base}/conversations/messages/:conversationId/search`,
    likeMessage: `${base}/conversations/messages/:messageId/like`,
    reactToMessage: `${base}/conversations/messages/:messageId/react`,
  },
  users: {
    search: `${base}/users/search`,
    getProfile: `${base}/users/:userId`,
  },
  calls: {
    list: `${base}/calls`,
  },
  bookmarks: {
    list: `${base}/bookmarks`,
    add: `${base}/bookmarks`,
    remove: `${base}/bookmarks/:messageId`,
    check: `${base}/bookmarks/check/:messageId`,
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
