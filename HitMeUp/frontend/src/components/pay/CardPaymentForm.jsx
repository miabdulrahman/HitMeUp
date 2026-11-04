import { useState } from "react";
import { CreditCard, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

const DEMO_CARDS = [
  {
    number: "4242 4242 4242 4242",
    scenario: "SUCCESS",
    label: "Success",
    badge: "Approved (00)",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    number: "4000 0000 0000 0002",
    scenario: "FAILED",
    label: "Declined",
    badge: "Decline (05)",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    number: "4000 0000 0000 9995",
    scenario: "INSUFFICIENT_FUNDS",
    label: "Low Balance",
    badge: "Low Funds (51)",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    number: "4000 0000 0000 0259",
    scenario: "PENDING",
    label: "Pending",
    badge: "Hold (09)",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    number: "4000 0000 0000 0119",
    scenario: "NETWORK_ERROR",
    label: "Timeout",
    badge: "Timeout (91)",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export default function CardPaymentForm({ onSubmit, disabled }) {
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardHolder, setCardHolder] = useState("KUMAR PERERA");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [selectedScenario, setSelectedScenario] = useState("SUCCESS");

  const detectBrand = (num) => {
    const clean = num.replace(/\s+/g, "");
    if (/^4/.test(clean)) return "visa";
    if (/^5[1-5]/.test(clean)) return "mastercard";
    if (/^3[47]/.test(clean)) return "amex";
    return "visa";
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);

    // Map entered number to scenario
    const match = DEMO_CARDS.find(
      (c) => c.number.replace(/\s+/g, "") === val
    );
    if (match) {
      setSelectedScenario(match.scenario);
    } else {
      setSelectedScenario("SUCCESS");
    }
  };

  const selectDemoTrigger = (demo) => {
    setCardNumber(demo.number);
    setSelectedScenario(demo.scenario);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanNumber = cardNumber.replace(/\s+/g, "");
    const last4 = cleanNumber.slice(-4) || "4242";
    const brand = detectBrand(cleanNumber);

    // Non-negotiable Rule: PAN, CVV, expiry are NEVER sent.
    // Send ONLY sanitized metadata and local scenario mapping
    onSubmit({
      paymentMethod: "CARD",
      requestedScenario: selectedScenario,
      brand,
      last4,
    });
  };

  const brand = detectBrand(cardNumber);

  return (
    <div className="space-y-5">
      {/* Interactive Card Preview */}
      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-tr from-[#111827] via-[#1E293B] to-[#334155] p-5 text-white shadow-lg transition-transform duration-300 hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            HitMeUp Pay Virtual Card
          </span>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
            {brand.toUpperCase()}
          </span>
        </div>

        {/* EMV Chip & Contactless */}
        <div className="mt-4 flex items-center space-x-2">
          <div className="h-6 w-9 rounded-md bg-amber-400/80 shadow-xs" />
          <div className="h-3 w-3 rounded-full border border-white/40" />
        </div>

        {/* Card Number */}
        <div className="mt-4 font-mono text-base tracking-widest text-neutral-100 sm:text-lg">
          {cardNumber || "•••• •••• •••• ••••"}
        </div>

        {/* Cardholder & Expiry */}
        <div className="mt-4 flex items-end justify-between text-xs">
          <div>
            <div className="text-[10px] uppercase text-neutral-400">Cardholder</div>
            <div className="font-medium tracking-wide uppercase">{cardHolder || "VALUED CUSTOMER"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-400">Expires</div>
            <div className="font-medium font-mono">{expiry || "MM/YY"}</div>
          </div>
        </div>
      </div>

      {/* Demo Scenario Quick-Select Pills */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-700 flex items-center space-x-1.5">
            <Sparkles size={14} className="text-[#E8503A]" />
            <span>Test Scenario Triggers (Simulation)</span>
          </label>
          <span className="text-[11px] text-neutral-500">Click to autofill trigger card</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DEMO_CARDS.map((demo) => {
            const isSelected = selectedScenario === demo.scenario;
            return (
              <button
                key={demo.scenario}
                type="button"
                onClick={() => selectDemoTrigger(demo)}
                className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  demo.color
                } ${isSelected ? "ring-2 ring-neutral-900 shadow-xs" : "opacity-80 hover:opacity-100"}`}
              >
                <span>{demo.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({demo.number.slice(-4)})</span>
                {isSelected && <CheckCircle2 size={13} className="ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Card Number (Demo)
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4242 4242 4242 4242"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 pl-10 text-sm font-mono text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
              required
            />
            <CreditCard
              size={18}
              className="absolute left-3.5 top-3 text-neutral-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              placeholder="Full Name"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm uppercase text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-neutral-700">
                Expires
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 font-mono text-sm text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700">
                CVV
              </label>
              <input
                type="password"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="•••"
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 font-mono text-sm text-neutral-900 focus:border-[#E8503A] focus:outline-hidden focus:ring-1 focus:ring-[#E8503A]"
                required
              />
            </div>
          </div>
        </div>

        {/* Security / Privacy disclaimer */}
        <div className="flex items-start space-x-2 rounded-xl bg-neutral-100 p-2.5 text-[11px] text-neutral-600">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Client Privacy Guard:</strong> Full card numbers and CVV codes are never transmitted over the network or saved to database. Only simulated scenario tokens are processed.
          </span>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-xl bg-[#E8503A] py-3 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#d4432f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {disabled ? "Processing Simulation..." : `Confirm & Pay with HitMeUp Pay (${selectedScenario})`}
        </button>
      </form>
    </div>
  );
}

