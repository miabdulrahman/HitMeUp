import { useState } from "react";
import { Building2, Info, CheckCircle2 } from "lucide-react";

const SRI_LANKA_BANKS = [
  { id: "COMBANK", name: "Commercial Bank of Ceylon", acc: "8001 9283 1001" },
  { id: "SAMPATH", name: "Sampath Bank PLC", acc: "0029 1000 8392" },
  { id: "HNB", name: "Hatton National Bank", acc: "0390 2004 8192" },
  { id: "BOC", name: "Bank of Ceylon", acc: "7001 8492 1032" },
];

export default function BankTransferForm({ onSubmit, disabled }) {
  const [selectedBank, setSelectedBank] = useState("COMBANK");
  const [depositorName, setDepositorName] = useState("KUMAR PERERA");
  const [referenceNote, setReferenceNote] = useState("VOUCHER-PAYMENT");
  const [demoOutcome, setDemoOutcome] = useState("SUCCESS");

  const handleSubmit = (e) => {
    e.preventDefault();
    const bank = SRI_LANKA_BANKS.find((b) => b.id === selectedBank);
    onSubmit({
      paymentMethod: "BANK_TRANSFER",
      requestedScenario: demoOutcome,
      brand: bank?.name || "Bank Transfer",
      last4: bank?.acc.slice(-4) || "0000",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bank Selector */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700">
          Select Sri Lankan Bank (Simulated)
        </label>
        <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SRI_LANKA_BANKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBank(b.id)}
              className={`flex flex-col rounded-xl border p-3 text-left transition-all cursor-pointer ${
                selectedBank === b.id
                  ? "border-[#E8503A] bg-[#FFF8F6] ring-1 ring-[#E8503A]"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">{b.name}</span>
                {selectedBank === b.id && (
                  <CheckCircle2 size={14} className="text-[#E8503A]" />
                )}
              </div>
              <span className="mt-1 text-[11px] font-mono text-neutral-500">
                Acc: {b.acc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Depositor / Account Name
          </label>
          <input
            type="text"
            value={depositorName}
            onChange={(e) => setDepositorName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm uppercase text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Payment Reference / Note
          </label>
          <input
            type="text"
            value={referenceNote}
            onChange={(e) => setReferenceNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
            required
          />
        </div>
      </div>

      {/* Demo Outcome Selector (Non-Negotiable Rule from Section 7) */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-800 flex items-center space-x-1.5">
            <Building2 size={14} className="text-[#E8503A]" />
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

      <div className="flex items-start space-x-2 rounded-xl bg-neutral-100 p-2.5 text-[11px] text-neutral-600">
        <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <span>
          Instant bank clearance simulation. No paper deposit slip upload required during demo mode.
        </span>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-xl bg-[#E8503A] py-3 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#d4432f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {disabled ? "Simulating Bank Transfer..." : `Submit Bank Transfer Simulation (${demoOutcome})`}
      </button>
    </form>
  );
}

