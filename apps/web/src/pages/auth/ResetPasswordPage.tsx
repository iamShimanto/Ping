import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { Button, Input, toast } from "@repo/ui";
import { useResetPasswordMutation } from "../../api/auth/authAPi";
import { getErrorMessage, type RtkError } from "../../utils/apiError";

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [resetPassword] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }
    try {
      await resetPassword({ token, newPassword: data.newPassword }).unwrap();
      toast.success("Password updated. Please log in.", "Success");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err as RtkError, "Reset failed"));
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-800 text-center">New Password</h1>
      <p className="text-sm text-gray-500 text-center mt-1 mb-8">
        Set a new password for your Doot account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="New Password"
          type="password"
          placeholder="Enter new password"
          error={errors.newPassword?.message}
          {...register("newPassword", {
            required: "Password is required",
            minLength: { value: 6, message: "Min 6 characters" },
          })}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (v) => v === watch("newPassword") || "Passwords do not match",
          })}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Set New Password
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8">
        Remember It?{" "}
        <Link to="/login" className="font-semibold text-[#4CAF82] hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
