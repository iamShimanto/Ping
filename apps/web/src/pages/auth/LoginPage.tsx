import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router";
import { useEffect } from "react";
import { AuthLayout } from "./AuthLayout";
import { Button, Input, Checkbox, toast } from "@repo/ui";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { useLoginMutation } from "../../api/auth/authAPi";
import { getErrorMessage, type RtkError } from "../../utils/apiError";
import { ROUTES } from "@repo/helpers";

const API_BASE = import.meta.env.VITE_API_URL;

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/chat";

  const [login] = useLoginMutation();

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      toast.error("OAuth sign-in failed. Please try again.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login({ email: data.email, password: data.password }).unwrap();
      toast.success("Welcome back!", "Logged in");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err as RtkError, "Login failed"));
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-800 text-center">Welcome Back !</h1>
      <p className="text-sm text-gray-500 text-center mt-1 mb-8">Sign in to continue to Doot.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          placeholder="admin@themesbrand.com"
          type="email"
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-[#4CAF82]">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", { required: "Password is required" })}
          />
        </div>

        <Checkbox label="Remember me" {...register("rememberMe")} />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Log In
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-sm text-gray-500">Sign in with</span>
        </div>
      </div>

      <div className="flex gap-3">
        <a
          href={`${API_BASE}${ROUTES.auth.googleOAuth}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <FaGoogle className="text-[#db4437] text-lg" />
          Google
        </a>
        <a
          href={`${API_BASE}${ROUTES.auth.githubOAuth}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <FaGithub className="text-gray-800 text-lg" />
          GitHub
        </a>
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-[#4CAF82] hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
