import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../api";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: api,
    tagTypes: ["Auth", "Users"],
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (payload) => ({
                url: "/api/v1/auth/register",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Auth"],
        }),

        login: builder.mutation({
            query: (payload) => ({
                url: "/api/v1/auth/login",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Auth"],
        }),

        logout: builder.mutation({
            query: () => ({
                url: "/api/v1/auth/logout",
                method: "POST",
            }),
            invalidatesTags: ["Auth"],
        }),
    }),
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
} = authApi;