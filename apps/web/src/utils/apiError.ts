import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

export type RtkError = FetchBaseQueryError | SerializedError | undefined;

export function getErrorMessage(err: RtkError, fallback = "Something went wrong"): string {
  if (!err) return fallback;
  if ("status" in err) {
    const data = err.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return err.message ?? fallback;
}
