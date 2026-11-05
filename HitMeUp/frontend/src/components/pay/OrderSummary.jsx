import { useState, useEffect } from "react";
import { Clock, ShieldCheck, Store, Tag } from "lucide-react";

export default function OrderSummary({ order, onExpire }) {
  const [timeLeft, setTimeLeft] = useState({
    minutes: 15,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!order?.expiresAt) return;

    const targetTime = new Date(order.expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order?.expiresAt, onExpire]);

  if (!order) return null;

  const dealSnapshot = order.dealSnapshot || {};
  const deal = order.dealId || {};
  const title = dealSnapshot.title || deal.title || "Flash Deal Digital Voucher";
  const merchantName = dealSnapshot.merchantName || "HitMeUp Verified Merchant";
  const imageUrl = dealSnapshot.imageUrl || deal.imageUrl || "";

  const unitPrice = order.unitPrice || order.amount || 0;
  const quantity = order.quantity || 1;
  const subtotal = order.subtotal || unitPrice * quantity;
  const fees = order.fees || 0;
  const totalAmount = order.totalAmount || order.amount || subtotal + fees;

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold tracking-tight text-[#111827]">
              HitMeUp <span className="text-[#E8503A]">Pay</span>
            </span>
            <span className="rounded-full bg-[#E8503A]/10 px-2 py-0.5 text-[10px] font-bold text-[#E8503A]">
              SIMULATED
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">Fast. Secure. Seamless.</p>
        </div>
        <div className="flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
          <ShieldCheck size={14} />
          <span>256-bit Encrypted</span>
        </div>
      </div>

      {/* Countdown Timer */}
      <div
        className={`mt-4 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-colors ${
          timeLeft.isExpired
            ? "bg-red-50 text-red-700 border border-red-200"
            : timeLeft.minutes < 3
            ? "bg-amber-50 text-amber-800 border border-amber-200"
            : "bg-neutral-50 text-neutral-700 border border-neutral-200/60"
        }`}
      >
        <div className="flex items-center space-x-1.5 font-medium">
          <Clock size={15} />
          <span>
            {timeLeft.isExpired ? "Checkout session expired" : "Stock reserved for"}
          </span>
        </div>
        <div className="font-mono font-bold text-sm">
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Deal Item Summary */}
      <div className="mt-4 flex space-x-3.5 border-b border-neutral-100 pb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-16 w-16 shrink-0 rounded-xl object-cover border border-neutral-200"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 border border-neutral-200">
            <Tag size={24} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-neutral-900 line-clamp-1">{title}</h4>
          <div className="mt-1 flex items-center space-x-1 text-xs text-neutral-500">
            <Store size={12} />
            <span className="truncate">{merchantName}</span>
          </div>
          <div className="mt-1 text-xs font-medium text-neutral-700">
            Qty: {quantity} × LKR {Number(unitPrice).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span className="font-medium text-neutral-900">
            LKR {Number(subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Processing Fee (Simulated 0%)</span>
          <span className="font-medium text-neutral-900">
            LKR {Number(fees).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between border-t border-neutral-100 pt-3 text-sm font-bold text-neutral-900">
          <span>Total Payable</span>
          <span className="text-base text-[#E8503A]">
            LKR {Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Order Reference */}
      <div className="mt-4 rounded-xl bg-neutral-50 p-2.5 text-center text-[11px] text-neutral-500">
        Order ref: <span className="font-mono font-medium text-neutral-700">{order.orderNumber}</span>
      </div>
    </div>
  );
}

