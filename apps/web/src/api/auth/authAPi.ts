import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../api";
import { ROUTES } from "@repo/helpers";

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  status: string;
  bio: string | null;
  location: string | null;
  lastSeen?: string | null;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: api,
  tagTypes: ["Auth", "Users"],
  endpoints: (builder) => ({
    register: builder.mutation<{ data: AuthUser }, { fullName: string; email: string; password: string }>({
      query: (payload) => ({ url: ROUTES.auth.register, method: "POST", body: payload }),
      invalidatesTags: ["Auth"],
    }),

    login: builder.mutation<{ data: AuthUser }, { email: string; password: string }>({
      query: (payload) => ({ url: ROUTES.auth.login, method: "POST", body: payload }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: ROUTES.auth.logout, method: "POST" }),
      invalidatesTags: ["Auth"],
    }),

    getCurrentUser: builder.query<{ data: AuthUser }, void>({
      query: () => ({ url: ROUTES.auth.getCurrentUser, method: "GET" }),
      providesTags: ["Auth"],
    }),

    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (payload) => ({ url: ROUTES.auth.changePassword, method: "POST", body: payload }),
    }),

    forgotPassword: builder.mutation<void, { email: string }>({
      query: (payload) => ({ url: ROUTES.auth.forgotPassword, method: "POST", body: payload }),
    }),

    resetPassword: builder.mutation<void, { token: string; newPassword: string }>({
      query: (payload) => ({ url: ROUTES.auth.resetPassword, method: "POST", body: payload }),
    }),

    updateProfile: builder.mutation<{ data: AuthUser }, FormData>({
      query: (formData) => ({
        url: ROUTES.auth.updateProfile,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Auth", "Users"],
    }),

    updateStatus: builder.mutation<{ status: string }, { status: "online" | "offline" | "away" | "busy" }>({
      query: (payload) => ({ url: ROUTES.auth.updateStatus, method: "PATCH", body: payload }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
  useUpdateStatusMutation,
} = authApi;
