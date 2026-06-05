import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../api";
import { ROUTES, buildRoute } from "@repo/helpers";

export interface UserSearchResult {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  status: string;
}

export interface UserProfile extends UserSearchResult {
  bio?: string;
  location?: string;
  lastSeen?: string;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: api,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    searchUsers: builder.query<UserSearchResult[], string>({
      query: (q) => ({ url: `${ROUTES.users.search}?q=${encodeURIComponent(q)}`, method: "GET" }),
      transformResponse: (res: { data: UserSearchResult[] }) => res.data,
    }),

    getUserProfile: builder.query<UserProfile, string>({
      query: (userId) => ({ url: buildRoute(ROUTES.users.getProfile, { userId }), method: "GET" }),
      transformResponse: (res: { data: UserProfile }) => res.data,
      providesTags: (_result, _err, userId) => [{ type: "Users", id: userId }],
    }),
  }),
});

export const { useSearchUsersQuery, useGetUserProfileQuery } = userApi;
