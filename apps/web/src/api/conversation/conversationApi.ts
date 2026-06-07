import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../api";
import { ROUTES, buildRoute } from "@repo/helpers";

export interface ConversationFriend {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  status: string;
  lastSeen?: string;
}

export interface Conversation {
  conversationId: string;
  isGroup: boolean;
  friend?: ConversationFriend;
  groupName?: string;
  groupAvatar?: string | null;
  participants?: ConversationFriend[];
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface MessageSender {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: MessageSender;
  content: string;
  contentType: "text" | "image" | "file";
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  readBy: string[];
  likes: string[];
  isDeleted: boolean;
  createdAt: string;
}

export const conversationApi = createApi({
  reducerPath: "conversationApi",
  baseQuery: api,
  tagTypes: ["Conversations", "Messages"],
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], void>({
      query: () => ({ url: ROUTES.conversations.list, method: "GET" }),
      transformResponse: (res: { data: Conversation[] }) => res.data,
      providesTags: ["Conversations"],
    }),

    addNewFriend: builder.mutation<{ conversationId: string; friend: ConversationFriend }, { email: string }>({
      query: (payload) => ({
        url: ROUTES.conversations.addNewFriend,
        method: "POST",
        body: payload,
      }),
      transformResponse: (res: { data: { conversationId: string; friend: ConversationFriend } }) => res.data,
      invalidatesTags: ["Conversations"],
    }),

    createGroup: builder.mutation<Conversation, { groupName: string; participantIds: string[] }>({
      query: (payload) => ({
        url: ROUTES.conversations.createGroup,
        method: "POST",
        body: payload,
      }),
      transformResponse: (res: { data: Conversation }) => res.data,
      invalidatesTags: ["Conversations"],
    }),

    sendMessage: builder.mutation<Message, FormData | { conversationId: string; content: string; contentType?: string }>({
      query: (payload) => ({
        url: ROUTES.conversations.sendMessage,
        method: "POST",
        body: payload,
        // let browser set Content-Type with boundary when FormData
        formData: payload instanceof FormData,
      }),
      transformResponse: (res: { data: Message }) => res.data,
    }),

    getMessages: builder.query<{ messages: Message[]; pagination: { page: number; limit: number; total: number; pages: number } }, { conversationId: string; page?: number; limit?: number }>({
      query: ({ conversationId, page = 1, limit = 50 }) => ({
        url: `${buildRoute(ROUTES.conversations.getMessages, { conversationId })}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      transformResponse: (res: { data: { messages: Message[]; pagination: { page: number; limit: number; total: number; pages: number } } }) => res.data,
      providesTags: (_result, _err, { conversationId }) => [{ type: "Messages", id: conversationId }],
    }),

    deleteMessage: builder.mutation<{ messageId: string }, string>({
      query: (messageId) => ({
        url: buildRoute(ROUTES.conversations.deleteMessage, { messageId }),
        method: "DELETE",
      }),
      transformResponse: (res: { data: { messageId: string } }) => res.data,
    }),

    markAllRead: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: buildRoute(ROUTES.conversations.markAllRead, { conversationId }),
        method: "PATCH",
      }),
    }),

    likeMessage: builder.mutation<{ messageId: string; liked: boolean; likes: string[] }, string>({
      query: (messageId) => ({
        url: buildRoute(ROUTES.conversations.likeMessage, { messageId }),
        method: "PATCH",
      }),
      transformResponse: (res: { data: { messageId: string; liked: boolean; likes: string[] } }) => res.data,
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useAddNewFriendMutation,
  useCreateGroupMutation,
  useSendMessageMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useDeleteMessageMutation,
  useMarkAllReadMutation,
  useLikeMessageMutation,
} = conversationApi;
