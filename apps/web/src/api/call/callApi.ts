import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../api";
import { ROUTES } from "@repo/helpers";

export interface CallParticipant {
  _id: string;
  fullName: string;
  avatar: string | null;
}

export interface CallLog {
  _id: string;
  conversationId: string;
  caller: CallParticipant;
  callee: CallParticipant;
  callType: "audio" | "video";
  status: "completed" | "missed" | "rejected";
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  createdAt: string;
}

export const callApi = createApi({
  reducerPath: "callApi",
  baseQuery: api,
  tagTypes: ["CallLogs"],
  endpoints: (builder) => ({
    getCallLogs: builder.query<CallLog[], void>({
      query: () => ({ url: ROUTES.calls.list, method: "GET" }),
      transformResponse: (res: { data: CallLog[] }) => res.data,
      providesTags: ["CallLogs"],
    }),
  }),
});

export const { useGetCallLogsQuery } = callApi;
