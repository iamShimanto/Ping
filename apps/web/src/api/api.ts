import {
    fetchBaseQuery,
    type BaseQueryFn,
    type FetchArgs,
    type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_API_URL ?? "";

const DEFAULT_TIMEOUT_MS = 10000;

const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> => {
    if (init?.signal) return fetch(input, init);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
};

let refreshPromise: Promise<boolean> | null = null;
let logoutPromise: Promise<unknown> | null = null;

const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    credentials: "include",
    fetchFn: fetchWithTimeout,
});

export const api: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result?.error?.status !== 401) return result;

    const requestUrl = typeof args === "string" ? args : args?.url;

    const isRefreshCall = (requestUrl || "").includes(
        "/api/v1/auth/refreshtoken",
    );

    const isLogoutCall = (requestUrl || "").includes("/api/v1/auth/logout");

    if (isRefreshCall || isLogoutCall) return result;

    try {
        if (!refreshPromise) {
            refreshPromise = (async () => {
                try {
                    const refreshResult = await rawBaseQuery(
                        {
                            url: "/api/v1/auth/refreshtoken",
                            method: "POST",
                        },
                        api,
                        extraOptions,
                    );

                    return !refreshResult?.error;
                } catch {
                    return false;
                } finally {
                    refreshPromise = null;
                }
            })();
        }

        const refreshed = await refreshPromise;

        if (!refreshed) {
            if (!logoutPromise) {
                logoutPromise = (async () => {
                    try {
                        return await rawBaseQuery(
                            {
                                url: "/api/v1/auth/logout",
                                method: "POST",
                            },
                            api,
                            extraOptions,
                        );
                    } catch {
                        return undefined;
                    } finally {
                        logoutPromise = null;
                    }
                })();
            }

            await logoutPromise;
            return result;
        }

        result = await rawBaseQuery(args, api, extraOptions);
        return result;
    } catch {
        return result;
    }
};

export default api;