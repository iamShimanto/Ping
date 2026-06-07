import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../api/auth/authAPi";
import { conversationApi } from "../api/conversation/conversationApi";
import { userApi } from "../api/user/userApi";
import { bookmarkApi } from "../api/bookmark/bookmarkApi";
import { callApi } from "../api/call/callApi";
import socketReducer from "./slices/socketSlice";
import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import callReducer from "./slices/callSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        socket: socketReducer,
        chat: chatReducer,
        call: callReducer,
        [authApi.reducerPath]: authApi.reducer,
        [conversationApi.reducerPath]: conversationApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [bookmarkApi.reducerPath]: bookmarkApi.reducer,
        [callApi.reducerPath]: callApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(conversationApi.middleware)
            .concat(userApi.middleware)
            .concat(bookmarkApi.middleware)
            .concat(callApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
