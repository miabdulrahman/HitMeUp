import { CreditCard, Building2, Smartphone } from "lucide-react";

export default function PaymentMethodSelector({ selectedMethod, onSelectMethod }) {
  const methods = [
    {
      id: "CARD",
      label: "Credit / Debit Card",
      subtitle: "Instant simulation (Visa, Mastercard)",
      icon: CreditCard,
    },
    {
      id: "BANK_TRANSFER",
      label: "Bank Transfer",
      subtitle: "Commercial, Sampath, HNB, BOC",
      icon: Building2,
    },
    {
      id: "WALLET",
      label: "Mobile Wallet",
      subtitle: "Genie, FriMi, eZ Cash, mCash",
      icon: Smartphone,
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Select Payment Method
      </label>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-[#E8503A] bg-[#FFF8F6] shadow-xs ring-1 ring-[#E8503A]"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isSelected ? "bg-[#E8503A] text-white" : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>
                <span
                  className={`h-3 w-3 rounded-full border-2 ${
                    isSelected ? "border-[#E8503A] bg-[#E8503A]" : "border-neutral-300"
                  }`}
                />
              </div>
              <div className="mt-2.5">
                <div className="text-sm font-semibold text-neutral-900">{method.label}</div>
                <div className="text-[11px] text-neutral-500 line-clamp-1">{method.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
