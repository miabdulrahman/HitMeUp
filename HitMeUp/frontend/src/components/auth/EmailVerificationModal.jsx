import { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight
} from "lucide-react";
import { authApi } from "../../services/api";

export default function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerified,
  onResend
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError("");
      setCountdown(60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      // Confirm OTP validity with server
      await authApi.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        purpose: "register"
      });

      // Pass verified OTP to parent register handler
      await onVerified(cleanOtp);
    } catch (err) {
      setError(
        err.message || "Invalid or expired verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);
    try {
      if (onResend) {
        await onResend();
      } else {
        await authApi.sendOtp({
          email: email.trim().toLowerCase(),
          purpose: "register"
        });
      }
      setCountdown(60);
    } catch (err) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="ios-popup-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111318]/60 backdrop-blur-xs">
      <div
        className="ios-popup-card relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] p-6 sm:p-7 shadow-[0_16px_40px_rgba(31,27,22,0.16)]"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#7B7266] transition-colors hover:bg-[#EFE9DF] hover:text-[#1F1B16] cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#166534]/10 text-[#166534]">
            <ShieldCheck size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#1F1B16]">
              Verify your email
            </h2>
            <p className="text-[12px] text-[#7B7266]">
              Enter the 6-digit code sent to <strong className="text-[#1F1B16]">{email}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#B91C1C]/25 bg-[#B91C1C]/5 p-3 text-[12px] text-[#B91C1C]">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="verify-otp-input"
              className="block text-[13px] font-medium text-[#1F1B16]"
            >
              6-Digit Verification Code
            </label>
            <input
              id="verify-otp-input"
              type="text"
              required
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="h-12 w-full text-center font-mono text-[22px] font-bold tracking-[8px] rounded-lg border border-[#E6E0D6] bg-white text-[#1F1B16] placeholder:text-[#A89F91] focus:border-[#D94832] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-[12px] pt-1">
            <span className="text-[#7B7266]">Didn&apos;t receive the code?</span>
            {countdown > 0 ? (
              <span className="font-mono text-[#A89F91]">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-medium text-[#D94832] hover:underline cursor-pointer disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1F1B16] text-[13px] font-medium text-[#FDFBF7] transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Verifying..." : "Verify & Complete Registration"}</span>
            <CheckCircle2 size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

