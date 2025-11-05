import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  RoundedTextButton,
} from "../../components/form-controls/";
import { showCustomTextToast } from "../../utilities";
import { resetPassword } from "../../services/authService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      showCustomTextToast("Invalid reset link. Please request a new one.", 3);
      navigate("/forgot-password");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      showCustomTextToast("Please fill in all fields", 3);
      return;
    }

    if (formData.newPassword.length < 6) {
      showCustomTextToast("Password must be at least 6 characters", 3);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showCustomTextToast("Passwords do not match", 3);
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(token, formData.newPassword);
      console.log("Reset password response:", response);
      
      showCustomTextToast("Password reset successful! Logging you in...", 3);
      
      // Navigate to feed after successful reset (user is automatically logged in)
      setTimeout(() => {
        navigate("/feed", { state: { loggedIn: true } });
      }, 1500);
    } catch (error) {
      console.error("Reset password error:", error);
      showCustomTextToast(
        error.response?.data?.message || "Failed to reset password. Please try again or request a new reset link.",
        5
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-color-text-accent mb-2">
            Reset Password
          </h1>
          <p className="text-color-text-low-emphasis">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              className="w-full h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
              type="password"
              name="newPassword"
              id="new-password"
              placeholder="New Password (6+ characters)"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <div>
            <input
              className="w-full h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
              type="password"
              name="confirmPassword"
              id="confirm-password"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
              <RoundedTextButton
                strColor="blue"
                strText={isLoading ? "Resetting..." : "Reset Password"}
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

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Password Requirements:</strong>
          </p>
          <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
            <li>At least 6 characters long</li>
            <li>Both fields must match</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
