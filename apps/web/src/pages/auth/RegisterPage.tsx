import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { Button, Input, toast } from "@repo/ui";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { useRegisterMutation } from "../../api/auth/authAPi";
import { getErrorMessage, type RtkError } from "../../utils/apiError";
import { ROUTES } from "@repo/helpers";

const API_BASE = import.meta.env.VITE_API_URL;

interface RegisterForm {
  email: string;
  fullName: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [registerUser] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data).unwrap();
      toast.success("Account created! Please log in.", "Registered");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err as RtkError, "Registration failed"));
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-800 text-center">Register Account</h1>
      <p className="text-sm text-gray-500 text-center mt-1 mb-8">
        Get your free Doot account now.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          placeholder="Enter Email"
          type="email"
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />

        <Input
          label="Full Name"
          placeholder="Enter full name"
          error={errors.fullName?.message}
          {...register("fullName", { required: "Full name is required" })}
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
            placeholder="Enter Password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Min 6 characters" },
            })}
          />
        </div>

        <p className="text-sm text-gray-500">
          By registering you agree to the Doot{" "}
          <Link to="#" className="text-[#4CAF82] hover:underline">
            Terms of Use
          </Link>
        </p>

        <Button type="submit" fullWidth loading={isSubmitting}>
          Register
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-sm text-gray-500">Sign up using</span>
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
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-[#4CAF82] hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
