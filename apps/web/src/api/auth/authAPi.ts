import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../api";
import { ROUTES } from "@repo/helpers";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: api,
  tagTypes: ["Auth", "Users"],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (payload) => ({
        url: ROUTES.auth.register,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Auth"],
    }),

    login: builder.mutation({
      query: (payload) => ({
        url: ROUTES.auth.login,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation({
      query: () => ({
        url: ROUTES.auth.logout,
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
    getCurrentUser: builder.query({
      query: () => ({
        url: ROUTES.auth.getCurrentUser,
        method: "GET",
      }),
    }),
    changePassword: builder.mutation({
      query: (payload) => ({
        url: ROUTES.auth.changePassword,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation({
      query: (payload) => ({
        url: ROUTES.auth.forgotPassword,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Auth"],
    }),
    resetPassword: builder.mutation({
      query: (payload) => ({
        url: ROUTES.auth.resetPassword,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Auth"],
    }),
    updateProfile: builder.mutation({
      query: (payload) => ({
        url: ROUTES.auth.updateProfile,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Auth", "Users"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
