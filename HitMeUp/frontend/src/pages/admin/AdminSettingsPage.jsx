import { useState, useEffect } from "react";
import {
  User,
  Shield,
  Bell,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sliders
} from "lucide-react";
import { useAdmin } from "../../components/admin/AdminLayout";
import { useAuth } from "../../context/useAuth";
import adminService from "../../services/adminService";
import { authApi } from "../../services/api";
import { ErrorState, formatDate } from "../../components/admin/AdminUI";

export default function AdminSettingsPage() {
  const { demoMode, notify } = useAdmin();
  const { user, updateProfile, logout } = useAuth();

  // Active settings tab
  const [activeTab, setActiveTab] = useState("platform"); // "platform" | "profile" | "notifications" | "security"

  // 1. Profile State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Sync profile when user updates
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phone || "");
    }
  }, [user]);

  // 2. Platform Settings State
  const [platformSettings, setPlatformSettings] = useState({
    marketplaceName: "HitMeUp",
    supportEmail: "support@hitmeup.lk",
    defaultDiscoveryRadiusKm: 25,
    maxDealDurationHours: 72,
    maxDiscountPercentage: 90,
    requireSellerVerification: true,
    autoExpireDeals: true,
    notifyOnNewApplication: true,
    notifyOnSellerSuspension: true,
    notifyOnDealCancellation: false
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const loadPlatformSettings = async () => {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const res = await adminService.getSettings({ demoMode });
      if (res.settings) {
        setPlatformSettings((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      setSettingsError(err.message || "Failed to load platform settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformSettings();
  }, [demoMode]);

  const handleSavePlatformSettings = async (e) => {
    e?.preventDefault();
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      await adminService.updateSettings(platformSettings, { demoMode });
      setSettingsSuccess("Platform settings updated and persisted successfully.");
      notify("Platform settings saved", "success");
      setTimeout(() => setSettingsSuccess(""), 4000);
    } catch (err) {
      setSettingsError(err.message || "Failed to update platform settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  // 3. Profile Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      await updateProfile({ name: profileName.trim(), phone: profilePhone.trim() });
      setProfileSuccess("Administrator profile updated successfully.");
      notify("Profile updated", "success");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // 4. Security / Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      notify("Password updated successfully", "success");
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const navItems = [
    { id: "platform", label: "Platform Governance", icon: Sliders },
    { id: "profile", label: "Administrator Profile", icon: User },
    { id: "notifications", label: "Notification Defaults", icon: Bell },
    { id: "security", label: "Security & Session", icon: Shield }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#6B7280]">
          <span>ADMINISTRATION</span>
          <span>/</span>
          <span className="text-[#111827]">SETTINGS</span>
        </div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#111827]">
          Platform Administration Settings
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Manage marketplace operational defaults, administrator profile, notification triggers, and security.
        </p>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Settings Navigation Menu */}
        <div className="lg:col-span-3">
          <nav className="space-y-1 rounded-[10px] border border-[#E5E7EB] bg-white p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-[#111318] text-white"
                      : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: Platform Governance */}
          {activeTab === "platform" && (
            <form onSubmit={handleSavePlatformSettings} className="space-y-6">
              <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-6 space-y-6">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#111827]">
                    Marketplace &amp; Operational Defaults
                  </h2>
                  <p className="text-[13px] text-[#6B7280]">
                    System-level parameters applied across discovery calculations and seller deal rules.
                  </p>
                </div>

                {settingsSuccess && (
                  <div className="flex items-center gap-2 rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] text-[#166534]">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                {settingsError && (
                  <div className="flex items-center gap-2 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] text-[#991B1B]">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{settingsError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Marketplace Name
                    </label>
                    <input
                      type="text"
                      value={platformSettings.marketplaceName}
                      onChange={(e) =>
                        setPlatformSettings({ ...platformSettings, marketplaceName: e.target.value })
                      }
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={platformSettings.supportEmail}
                      onChange={(e) =>
                        setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })
                      }
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 font-mono text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Default Nearby Discovery Radius (km)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={platformSettings.defaultDiscoveryRadiusKm}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          defaultDiscoveryRadiusKm: Number(e.target.value)
                        })
                      }
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 font-mono text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Maximum Deal Duration (Hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={platformSettings.maxDealDurationHours}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          maxDealDurationHours: Number(e.target.value)
                        })
                      }
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 font-mono text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Maximum Discount Allowed (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={platformSettings.maxDiscountPercentage}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          maxDiscountPercentage: Number(e.target.value)
                        })
                      }
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 font-mono text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#F3F4F6]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.requireSellerVerification}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          requireSellerVerification: e.target.checked
                        })
                      }
                      className="mt-1 h-4 w-4 rounded border-[#D1D5DB] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                    />
                    <div>
                      <div className="text-[13px] font-medium text-[#111827]">
                        Enforce Seller Approval Verification
                      </div>
                      <div className="text-[12px] text-[#6B7280]">
                        When enabled, merchant storefronts are flagged with an unverified badge on public discovery until an administrator reviews and approves their application.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.autoExpireDeals}
                      onChange={(e) =>
                        setPlatformSettings({
                          ...platformSettings,
                          autoExpireDeals: e.target.checked
                        })
                      }
                      className="mt-1 h-4 w-4 rounded border-[#D1D5DB] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                    />
                    <div>
                      <div className="text-[13px] font-medium text-[#111827]">
                        Automatic Deal Expiration Engine
                      </div>
                      <div className="text-[12px] text-[#6B7280]">
                        Automatically transitions deals past their end timestamp to expired status to prevent voucher purchases on stale flash deals.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#F3F4F6]">
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#111318] px-4 text-[13px] font-medium text-white hover:bg-[#1F2937] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{settingsSaving ? "Saving..." : "Save Settings"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Administrator Profile */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-6 space-y-6">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#111827]">
                    Administrator Profile
                  </h2>
                  <p className="text-[13px] text-[#6B7280]">
                    Your administrative account details and contact attribution on audit logs.
                  </p>
                </div>

                {profileSuccess && (
                  <div className="flex items-center gap-2 rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] text-[#166534]">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] text-[#991B1B]">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Contact Telephone
                    </label>
                    <input
                      type="text"
                      placeholder="+94 77 123 4567"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 font-mono text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Email Address (Read-only identifier)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || "admin@hitmeup.com"}
                      className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 font-mono text-[13px] text-[#6B7280] cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#374151]">
                      Role &amp; Privilege Tier
                    </label>
                    <div className="flex h-9 items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#1D4ED8] uppercase">
                        <Shield size={12} />
                        <span>Platform Administrator (Superuser)</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#F3F4F6]">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#111318] px-4 text-[13px] font-medium text-white hover:bg-[#1F2937] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{profileSaving ? "Saving..." : "Update Profile"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === "notifications" && (
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-6 space-y-6">
              <div>
                <h2 className="text-[15px] font-semibold text-[#111827]">
                  Notification Triggers &amp; Admin Alerts
                </h2>
                <p className="text-[13px] text-[#6B7280]">
                  Configure events that trigger high-priority alerts in the top administration bar.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start justify-between gap-4 rounded-[8px] border border-[#E5E7EB] p-4 cursor-pointer hover:bg-[#F9FAFB]">
                  <div>
                    <div className="text-[13px] font-medium text-[#111827]">
                      New Seller Application Submitted
                    </div>
                    <div className="text-[12px] text-[#6B7280]">
                      Highlight a pending review alert whenever a merchant registers their storefront.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.notifyOnNewApplication}
                    onChange={(e) => {
                      const updated = {
                        ...platformSettings,
                        notifyOnNewApplication: e.target.checked
                      };
                      setPlatformSettings(updated);
                      adminService.updateSettings(updated, { demoMode });
                    }}
                    className="mt-1 h-4 w-4 rounded border-[#D1D5DB] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 rounded-[8px] border border-[#E5E7EB] p-4 cursor-pointer hover:bg-[#F9FAFB]">
                  <div>
                    <div className="text-[13px] font-medium text-[#111827]">
                      Seller Account Suspended
                    </div>
                    <div className="text-[12px] text-[#6B7280]">
                      Notify all administrators when a seller storefront is administratively deactivated.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.notifyOnSellerSuspension}
                    onChange={(e) => {
                      const updated = {
                        ...platformSettings,
                        notifyOnSellerSuspension: e.target.checked
                      };
                      setPlatformSettings(updated);
                      adminService.updateSettings(updated, { demoMode });
                    }}
                    className="mt-1 h-4 w-4 rounded border-[#D1D5DB] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 rounded-[8px] border border-[#E5E7EB] p-4 cursor-pointer hover:bg-[#F9FAFB]">
                  <div>
                    <div className="text-[13px] font-medium text-[#111827]">
                      Deal Cancelled Administratively
                    </div>
                    <div className="text-[12px] text-[#6B7280]">
                      Broadcast notifications when a published flash promotion is force-cancelled.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.notifyOnDealCancellation}
                    onChange={(e) => {
                      const updated = {
                        ...platformSettings,
                        notifyOnDealCancellation: e.target.checked
                      };
                      setPlatformSettings(updated);
                      adminService.updateSettings(updated, { demoMode });
                    }}
                    className="mt-1 h-4 w-4 rounded border-[#D1D5DB] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Security & Session */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-6 space-y-6">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[#111827]">
                      Change Password
                    </h2>
                    <p className="text-[13px] text-[#6B7280]">
                      Ensure your administrative account is protected with a secure password.
                    </p>
                  </div>

                  {passwordSuccess && (
                    <div className="flex items-center gap-2 rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] text-[#166534]">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="flex items-center gap-2 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] text-[#991B1B]">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="max-w-md space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#374151]">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#374151]">
                        New Password (minimum 6 characters)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#374151]">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start pt-4 border-t border-[#F3F4F6]">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#111318] px-4 text-[13px] font-medium text-white hover:bg-[#1F2937] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Lock size={14} />
                      <span>{passwordSaving ? "Updating..." : "Update Password"}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Active Session Info */}
              <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#111827]">
                      Active Administrator Session
                    </h3>
                    <p className="text-[12px] text-[#6B7280]">
                      Authenticated session with RBAC authorization token.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => logout()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-3 text-[12px] font-medium text-[#991B1B] hover:bg-[#FEE2E2] cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-[12px]">
                  <div>
                    <span className="text-[#6B7280]">Authenticated as:</span>
                    <div className="font-mono font-medium text-[#111827]">{user?.email || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">User ID:</span>
                    <div className="font-mono text-[#111827]">{user?._id || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Role:</span>
                    <div className="font-mono font-semibold text-[#1D4ED8]">admin</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
