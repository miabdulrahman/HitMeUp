import { useState } from "react";
import { Smartphone, CheckCircle2 } from "lucide-react";

const WALLET_PROVIDERS = [
  { id: "GENIE", name: "Dialog Genie", color: "from-blue-600 to-indigo-600" },
  { id: "FRIMI", name: "Nations Trust FriMi", color: "from-red-600 to-orange-600" },
  { id: "EZCASH", name: "eZ Cash", color: "from-amber-500 to-yellow-600" },
  { id: "MCASH", name: "Mobitel mCash", color: "from-emerald-600 to-teal-600" },
];

export default function WalletPaymentForm({ onSubmit, disabled }) {
  const [selectedWallet, setSelectedWallet] = useState("GENIE");
  const [mobileNumber, setMobileNumber] = useState("077 123 4567");
  const [demoOutcome, setDemoOutcome] = useState("SUCCESS");

  const handleSubmit = (e) => {
    e.preventDefault();
    const wallet = WALLET_PROVIDERS.find((w) => w.id === selectedWallet);
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    onSubmit({
      paymentMethod: "WALLET",
      requestedScenario: demoOutcome,
      brand: wallet?.name || "Mobile Wallet",
      last4: cleanMobile.slice(-4) || "4567",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Wallet Selector */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700">
          Select Sri Lankan Mobile Wallet
        </label>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WALLET_PROVIDERS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setSelectedWallet(w.id)}
              className={`flex flex-col items-center rounded-xl border p-3 text-center transition-all cursor-pointer ${
                selectedWallet === w.id
                  ? "border-[#E8503A] bg-[#FFF8F6] ring-1 ring-[#E8503A]"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr ${w.color} text-white shadow-xs`}
              >
                <Smartphone size={18} />
              </div>
              <span className="mt-2 text-xs font-semibold text-neutral-800">{w.name}</span>
              {selectedWallet === w.id && (
                <CheckCircle2 size={13} className="mt-1 text-[#E8503A]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-700">
          Registered Mobile Number
        </label>
        <div className="relative mt-1">
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="077 123 4567"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 font-mono text-sm text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
            required
          />
        </div>
      </div>

      {/* Demo Outcome Selector */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-800 flex items-center space-x-1.5">
            <Smartphone size={14} className="text-[#E8503A]" />
            <span>Simulated Demo Outcome</span>
          </label>
          <span className="text-[10px] uppercase font-bold text-neutral-500">Demo Testing</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { id: "SUCCESS", label: "Approved (00)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            { id: "PENDING", label: "Hold / Pending (09)", color: "text-blue-700 bg-blue-50 border-blue-200" },
            { id: "FAILED", label: "Declined (05)", color: "text-red-700 bg-red-50 border-red-200" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDemoOutcome(item.id)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium text-center transition-all cursor-pointer ${
                demoOutcome === item.id
                  ? `${item.color} ring-2 ring-neutral-900 font-bold shadow-xs`
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-xl bg-[#E8503A] py-3 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#d4432f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {disabled ? "Simulating Wallet Authorization..." : `Authorize with ${WALLET_PROVIDERS.find(w => w.id === selectedWallet)?.name} (${demoOutcome})`}
      </button>
    </form>
  );
}

