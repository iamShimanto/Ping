import React, { useEffect } from "react";
import { useGetCurrentUserQuery } from "../api/auth/authAPi";
import { useAppDispatch } from "../store/hooks";
import { setBootstrapping } from "../store/slices/authSlice";

interface Props {
  children: React.ReactNode;
}

/**
 * Fires GET /api/v1/auth/me once on app mount to rehydrate auth state
 * from the httpOnly cookie. Blocks render until resolved.
 */
export const AuthBootstrap: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useGetCurrentUserQuery(undefined, {
    // Only run once; skip if somehow already called
    refetchOnMountOrArgChange: false,
  });

  useEffect(() => {
    if (!isLoading) {
      dispatch(setBootstrapping(false));
    }
  }, [isLoading, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 animate-spin text-[#4CAF82]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-400 font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
