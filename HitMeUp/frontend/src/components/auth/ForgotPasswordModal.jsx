import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight
} from "lucide-react";
import { authApi } from "../../services/api";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess
}) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setStep(1);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setInfoMessage("");
    }
  }, [isOpen, initialEmail]);

  // Countdown timer for Resend code
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    setInfoMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp({
        email: trimmedEmail,
        purpose: "forgot_password"
      });

      const baseMsg = res.message || `Verification code sent to ${trimmedEmail}`;
      setInfoMessage(baseMsg);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(
        err.message || "Failed to send reset code. Please check your email."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword
      });

      if (onSuccess) {
        onSuccess({
          email: email.trim().toLowerCase(),
          message: res.message || "Password reset successfully. You can now log in."
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to reset password. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ios-popup-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111318]/60 backdrop-blur-xs">
      <div
        className="ios-popup-card relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] p-6 sm:p-7 shadow-[0_16px_40px_rgba(31,27,22,0.16)]"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#7B7266] transition-colors hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D94832]/10 text-[#D94832]">
            <KeyRound size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#1F1B16]">
              {step === 1 ? "Reset your password" : "Enter verification code"}
            </h2>
            <p className="text-[12px] text-[#7B7266]">
              {step === 1
                ? "We'll send a 6-digit OTP code to your inbox."
                : `Sent to ${email}`}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#B91C1C]/25 bg-[#B91C1C]/5 p-3 text-[12px] text-[#B91C1C]">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info / Success message */}
        {infoMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#166534]/25 bg-[#166534]/5 p-3 text-[12px] text-[#166534]">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reset-email"
                className="block text-[13px] font-medium text-[#1F1B16]"
              >
                Account email address
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                  <Mail size={16} strokeWidth={1.5} />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-4 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1F1B16] text-[13px] font-medium text-[#FDFBF7] transition-colors hover:bg-[#D94832] disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? "Sending code..." : "Send verification code"}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP + New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            {/* 6-Digit OTP */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reset-otp"
                  className="block text-[13px] font-medium text-[#1F1B16]"
                >
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-[#D94832] hover:underline cursor-pointer"
                >
                  Change email
                </button>
              </div>
              <input
                id="reset-otp"
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="h-12 w-full text-center font-mono text-[20px] font-bold tracking-[8px] rounded-lg border border-[#E6E0D6] bg-white text-[#1F1B16] placeholder:text-[#A89F91] focus:border-[#D94832] focus:outline-none"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-new-password"
                className="block text-[13px] font-medium text-[#1F1B16]"
              >
                New Password (minimum 6 characters)
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                  <Lock size={16} strokeWidth={1.5} />
                </div>
                <input
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-10 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#7B7266] hover:text-[#1F1B16] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-confirm-password"
                className="block text-[13px] font-medium text-[#1F1B16]"
              >
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3.5 text-[#7B7266]">
                  <Lock size={16} strokeWidth={1.5} />
                </div>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E6E0D6] bg-white pl-10 pr-4 text-[14px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
                />
              </div>
            </div>

            {/* Resend Link */}
            <div className="flex items-center justify-between text-[12px] pt-1">
              <span className="text-[#7B7266]">Didn&apos;t get the code?</span>
              {countdown > 0 ? (
                <span className="font-mono text-[#A89F91]">
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="font-medium text-[#D94832] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1F1B16] text-[13px] font-medium text-[#FDFBF7] transition-colors hover:bg-[#D94832] disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? "Resetting password..." : "Set new password"}</span>
              <CheckCircle2 size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

