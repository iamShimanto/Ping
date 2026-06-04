import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { Button, Input, toast } from "@repo/ui";
import { useForgotPasswordMutation } from "../../api/auth/authAPi";
import { getErrorMessage, type RtkError } from "../../utils/apiError";

interface ForgotForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [forgotPassword] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    try {
      await forgotPassword(data).unwrap();
      toast.success("Check your inbox for reset instructions.", "Email sent");
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err as RtkError));
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-800 text-center">Reset Password</h1>
      <p className="text-sm text-gray-500 text-center mt-1 mb-8">Reset Password with Doot.</p>

      <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 text-sm text-blue-700 text-center mb-6">
        Enter your Email and instructions will be sent to you!
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          placeholder="Enter Email"
          type="email"
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Reset
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
