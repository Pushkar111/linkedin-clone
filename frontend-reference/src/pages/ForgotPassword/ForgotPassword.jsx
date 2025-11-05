import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RoundedTextButton,
} from "../../components/form-controls/";
import { showCustomTextToast } from "../../utilities";
import { forgotPassword } from "../../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showCustomTextToast("Please enter your email", 3);
      return;
    }

    setIsLoading(true);

    try {
      const response = await forgotPassword(email);
      console.log("Forgot password response:", response);
      
      setIsEmailSent(true);
      showCustomTextToast("Password reset instructions sent to your email!", 3);
      
      // Show the token in development mode
      if (response.resetToken) {
        console.log("Reset Token (Development):", response.resetToken);
        console.log("Reset URL:", response.resetUrl);
        showCustomTextToast("Check console for reset link (Development Mode)", 5);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      showCustomTextToast(
        error.response?.data?.message || "Failed to send reset email. Please try again.",
        3
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-color-text-accent mb-2">
            Forgot Password?
          </h1>
          <p className="text-color-text-low-emphasis">
            {isEmailSent
              ? "Check your email for reset instructions"
              : "Enter your email to receive password reset instructions"}
          </p>
        </div>

        {!isEmailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                className="w-full h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
                type="email"
                name="email"
                id="forgot-password-email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
                <RoundedTextButton
                  strColor="blue"
                  strText={isLoading ? "Sending..." : "Send Reset Link"}
                  booBorder={true}
                  booColoredBackground={true}
                  booFullWidth={true}
                  handleClick={handleSubmit}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/linkedin")}
                className="w-full text-color-blue hover:underline text-sm font-semibold"
                disabled={isLoading}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm">
                ✓ We&apos;ve sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-green-700 text-xs mt-2">
                Please check your inbox and spam folder.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsEmailSent(false);
                  setEmail("");
                }}
                className="w-full text-color-blue hover:underline text-sm font-semibold"
              >
                Try Different Email
              </button>

              <button
                type="button"
                onClick={() => navigate("/linkedin")}
                className="w-full text-color-text-low-emphasis hover:text-color-text text-sm"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-color-text-low-emphasis">
          <p>
            Note: Password reset link expires in 1 hour for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
