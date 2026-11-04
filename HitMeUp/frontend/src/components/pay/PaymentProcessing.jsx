import { Loader2, ShieldCheck } from "lucide-react";

export default function PaymentProcessing({ scenario }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF8F6] text-[#E8503A]">
          <Loader2 size={36} className="animate-spin text-[#E8503A]" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-neutral-900">
          Processing Payment
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Communicating with HitMeUp Pay Simulation Network...
        </p>

        <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-left">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>Simulation Trigger:</span>
            <span className="font-mono font-semibold text-neutral-900">{scenario}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-neutral-600">
            <span>Cryptographic Proof:</span>
            <span className="font-mono text-emerald-600 font-medium">HMAC-SHA256</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Do not refresh or close this window</span>
        </div>
      </div>
    </div>
  );
}

