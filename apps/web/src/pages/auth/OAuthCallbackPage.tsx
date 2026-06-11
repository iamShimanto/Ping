import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useGetCurrentUserQuery } from "../../api/auth/authAPi";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const { isSuccess, isError } = useGetCurrentUserQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (error) {
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }
    if (isSuccess) {
      navigate("/chat", { replace: true });
    }
    if (isError) {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, [isSuccess, isError, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 animate-spin text-[#4CAF82]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-400 font-medium">Signing you in…</span>
      </div>
    </div>
  );
}
