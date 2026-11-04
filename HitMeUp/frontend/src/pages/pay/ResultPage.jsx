import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Receipt as ReceiptIcon,
  Ticket,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { gatewayApi, paymentApi, voucherApi } from "../../services/api";

export default function ResultPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      setError("");
      const res = await gatewayApi.getTransactionById(transactionId);
      const txn = res.transaction || res.data;
      setTransaction(txn);

      // If transaction was SUCCESS, fetch linked voucher
      if (txn?.transactionStatus === "SUCCESS" && txn?.orderId) {
        try {
          const vouchersRes = await voucherApi.getMyVouchers();
          const list = vouchersRes.vouchers || vouchersRes.data || [];
          const orderIdStr = String(txn.orderId?._id || txn.orderId);
          const matched = list.find(
            (v) => String(v.orderId?._id || v.orderId) === orderIdStr
          );
          if (matched) setVoucher(matched);
        } catch {
          // ignore non-critical voucher prefetch
        }
      }
    } catch (err) {
      console.error("Failed to load transaction:", err);
      setError(err.message || "Failed to load transaction details");
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleCheckPendingStatus = async () => {
    if (resolving || !transactionId) return;
    setResolving(true);
    try {
      await gatewayApi.resolveTransaction(transactionId);
      await fetchDetails();
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setResolving(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#E8503A] border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-neutral-600">
            Verifying transaction status with HitMeUp Pay...
          </p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle size={28} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-neutral-900">
            Transaction Not Found
          </h2>
          <p className="mt-1 text-xs text-neutral-600">
            {error || "The requested transaction record could not be located."}
          </p>
          <div className="mt-6">
            <Link
              to="/deals"
              className="inline-flex items-center rounded-xl bg-[#E8503A] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#d4432f]"
            >
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = transaction.transactionStatus;
  const isSuccess = status === "SUCCESS";
  const isPending = status === "PENDING";
  const isFailed = status === "FAILED" || status === "CANCELLED";

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-lg">
        {/* SUCCESS OUTCOME */}
        {isSuccess && (
          <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            {/* Top Green Accent Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center text-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                <CheckCircle2 size={36} className="text-white" />
              </div>
              <h1 className="mt-3 text-xl font-bold tracking-tight">Payment Approved!</h1>
              <p className="text-xs text-emerald-100">
                Your transaction was verified via HitMeUp Pay HMAC signature.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction Key Details */}
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {transaction.transactionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Amount Paid:</span>
                  <span className="font-bold text-neutral-900 text-sm">
                    {transaction.currency} {Number(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Merchant:</span>
                  <span className="font-medium text-neutral-800">
                    {transaction.merchantName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment Method:</span>
                  <span className="font-medium text-neutral-800">
                    {transaction.paymentMethod} {transaction.cardLast4 ? `(•••• ${transaction.cardLast4})` : ""}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-200/60 pt-2 text-[11px] text-neutral-400">
                  <span>Cryptographic Proof:</span>
                  <span className="font-mono truncate max-w-[200px]" title={transaction.signature}>
                    {transaction.signature?.slice(0, 20)}...
                  </span>
                </div>
              </div>

              {/* Digital Voucher Display */}
              {voucher && (
                <div className="rounded-2xl border-2 border-dashed border-[#E8503A]/40 bg-[#FFFBF9] p-5 text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-[#E8503A] uppercase tracking-wider">
                    <Ticket size={16} />
                    <span>Your Instant Digital Voucher</span>
                  </div>

                  {voucher.qrData && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={voucher.qrData}
                        alt="Voucher QR Code"
                        className="h-44 w-44 rounded-xl border border-neutral-200 bg-white p-2 shadow-xs"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-center space-x-2">
                    <span className="rounded-lg bg-white px-3 py-1 font-mono text-sm font-bold tracking-wider text-neutral-900 border border-neutral-200">
                      {voucher.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(voucher.code)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                      title="Copy voucher code"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-500">
                    Present this QR code or code at the merchant store to redeem.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/pay/receipt/${transaction.paymentReference || transactionId}`)}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 cursor-pointer"
                >
                  <ReceiptIcon size={16} className="text-[#E8503A]" />
                  <span>View / Print Official Receipt</span>
                </button>

                <Link
                  to="/customer/dashboard"
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#E8503A] py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#d4432f]"
                >
                  <Ticket size={16} />
                  <span>Go to My Vouchers Dashboard</span>
                </Link>

                <Link
                  to="/deals"
                  className="flex w-full items-center justify-center space-x-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  <span>Continue Browsing Marketplace</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PENDING OUTCOME */}
        {isPending && (
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center text-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                <Clock size={36} className="text-white animate-pulse" />
              </div>
              <h1 className="mt-3 text-xl font-bold tracking-tight">Payment Pending Settlement</h1>
              <p className="text-xs text-blue-100">
                Awaiting authorization clearance from the simulated banking node.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Transaction Ref:</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {transaction.transactionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status:</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-700 text-[10px]">
                    PENDING (Code 09)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Message:</span>
                  <span className="text-neutral-800 text-right max-w-[240px]">
                    {transaction.responseMessage || "Pending external settlement"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/70 p-3.5 text-xs text-blue-900 leading-relaxed border border-blue-200/50">
                <strong>Simulated Delay Notice:</strong> In a production environment, pending transactions are settled via asynchronous webhooks or bank reconciliations. In this demo, clicking <strong>Check Status</strong> below will resolve the simulated pending transaction.
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCheckPendingStatus}
                  disabled={resolving}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={16} className={resolving ? "animate-spin" : ""} />
                  <span>{resolving ? "Checking Status..." : "Check Status & Refresh"}</span>
                </button>

                <Link
                  to="/deals"
                  className="flex w-full items-center justify-center space-x-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  <span>Return to Deals</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* FAILED / DECLINED OUTCOME */}
        {isFailed && (
          <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-center text-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                <XCircle size={36} className="text-white" />
              </div>
              <h1 className="mt-3 text-xl font-bold tracking-tight">Payment Declined</h1>
              <p className="text-xs text-red-100">
                The simulated transaction could not be processed.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {transaction.transactionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Decline Code:</span>
                  <span className="font-mono font-bold text-red-700">
                    {transaction.responseCode || "05"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Reason:</span>
                  <span className="font-semibold text-red-800 text-right max-w-[240px]">
                    {transaction.responseMessage || "Transaction declined by issuing network"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                <p>
                  <strong>No money was deducted.</strong> No voucher was created and stock remains protected. You may retry payment with a different simulation card (e.g. <code>4242 4242 4242 4242</code> for Success).
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {transaction.orderId && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/pay/checkout/${
                          transaction.orderId?._id || transaction.orderId
                        }`
                      )
                    }
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#E8503A] py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#d4432f] cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    <span>Retry Payment with Another Card</span>
                  </button>
                )}

                <Link
                  to="/deals"
                  className="flex w-full items-center justify-center space-x-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  <span>Return to Deals Marketplace</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
