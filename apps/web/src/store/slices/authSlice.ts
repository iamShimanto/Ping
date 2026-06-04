import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "../../api/auth/authAPi";

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean; // true while /me is in-flight on first load
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isBootstrapping = false;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isBootstrapping = false;
    },
    setBootstrapping(state, action: PayloadAction<boolean>) {
      state.isBootstrapping = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Automatically sync state from RTK Query responses
    builder
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
        state.user = payload.data;
        state.isAuthenticated = true;
        state.isBootstrapping = false;
      })
      .addMatcher(authApi.endpoints.getCurrentUser.matchFulfilled, (state, { payload }) => {
        state.user = payload.data;
        state.isAuthenticated = true;
        state.isBootstrapping = false;
      })
      .addMatcher(authApi.endpoints.getCurrentUser.matchRejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isBootstrapping = false;
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addMatcher(authApi.endpoints.updateProfile.matchFulfilled, (state, { payload }) => {
        if (state.user) {
          state.user = { ...state.user, ...payload.data };
        }
      });
  },
});

export const { setUser, clearUser, setBootstrapping } = authSlice.actions;
export default authSlice.reducer;
