import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../api/auth/authAPi";
import { conversationApi } from "../api/conversation/conversationApi";
import { userApi } from "../api/user/userApi";
import socketReducer from "./slices/socketSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        socket: socketReducer,
        [authApi.reducerPath]: authApi.reducer,
        [conversationApi.reducerPath]: conversationApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(conversationApi.middleware)
            .concat(userApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
