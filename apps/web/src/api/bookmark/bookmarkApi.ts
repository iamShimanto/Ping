import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../api";
import { ROUTES, buildRoute } from "@repo/helpers";

export interface Bookmark {
  bookmarkId: string;
  messageId: string;
  conversationId: string;
  conversationName: string;
  content: string;
  contentType: string;
  fileName: string | null;
  isDeleted: boolean;
  sender: { _id: string; fullName: string; avatar: string | null };
  createdAt: string;
}

export const bookmarkApi = createApi({
  reducerPath: "bookmarkApi",
  baseQuery: api,
  tagTypes: ["Bookmarks"],
  endpoints: (builder) => ({
    getBookmarks: builder.query<Bookmark[], void>({
      query: () => ({ url: ROUTES.bookmarks.list, method: "GET" }),
      transformResponse: (res: { data: Bookmark[] }) => res.data,
      providesTags: ["Bookmarks"],
    }),

    addBookmark: builder.mutation<{ bookmarkId: string; messageId: string }, string>({
      query: (messageId) => ({ url: ROUTES.bookmarks.add, method: "POST", body: { messageId } }),
      transformResponse: (res: { data: { bookmarkId: string; messageId: string } }) => res.data,
      invalidatesTags: ["Bookmarks"],
    }),

    removeBookmark: builder.mutation<{ messageId: string }, string>({
      query: (messageId) => ({
        url: buildRoute(ROUTES.bookmarks.remove, { messageId }),
        method: "DELETE",
      }),
      transformResponse: (res: { data: { messageId: string } }) => res.data,
      invalidatesTags: ["Bookmarks"],
    }),

    checkBookmark: builder.query<{ isBookmarked: boolean }, string>({
      query: (messageId) => ({
        url: buildRoute(ROUTES.bookmarks.check, { messageId }),
        method: "GET",
      }),
      transformResponse: (res: { data: { isBookmarked: boolean } }) => res.data,
    }),
  }),
});

export const {
  useGetBookmarksQuery,
  useAddBookmarkMutation,
  useRemoveBookmarkMutation,
  useCheckBookmarkQuery,
} = bookmarkApi;
