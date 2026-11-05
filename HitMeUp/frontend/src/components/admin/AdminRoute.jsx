import { Navigate, Link, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "../../context/useAuth";

/**
 * Strict RBAC Guard for Platform Administration Routes.
 * Never bypasses authentication; verifies user.role === "admin".
 */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F9FB]">
        <div className="flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1D4ED8] border-t-transparent" />
          <span className="text-[13px] font-medium text-[#374151]">
            Verifying administrator session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (user.role !== "admin") {
    const fallbackDashboard =
      user.role === "seller" || user.role === "business"
        ? "/seller/dashboard"
        : "/customer/dashboard";

    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F9FB] p-6">
        <div className="w-full max-w-[460px] rounded-[12px] border border-[#E5E7EB] bg-white p-7 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]">
            <ShieldAlert size={20} strokeWidth={1.5} />
          </div>

          <h1 className="mt-4 text-[18px] font-semibold text-[#111827]">
            Administrator access required
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">
            You are currently signed in as{" "}
            <span className="font-medium text-[#111827]">{user.email}</span> (role:{" "}
            <span className="font-mono text-[12px] text-[#111827]">{user.role}</span>
            ). Only authorized platform administrators can access the HitMeUp
            administration console.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              to={fallbackDashboard}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#D1D5DB] bg-white px-3.5 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              <span>Go to my dashboard</span>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#111827] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1F2937] cursor-pointer"
            >
              <LogIn size={14} strokeWidth={1.5} />
              <span>Switch account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

