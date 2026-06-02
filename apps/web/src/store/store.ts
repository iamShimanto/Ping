import { configureStore } from "@reduxjs/toolkit";
import {authApi} from "../api/auth/authAPi";
import socketReducer from "./slices/socketSlice";


export const store = configureStore({
    reducer: {
        socket: socketReducer,
        [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;