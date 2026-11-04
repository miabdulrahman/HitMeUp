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
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Wallet,
  WifiOff,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { gatewayApi, voucherApi } from "../../services/api";

export default function ResultPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      setError("");
      setErrorStatus(null);

      // Clean ID for lookup
      const cleanId = String(transactionId).trim();
      const res = await gatewayApi.getTransactionById(cleanId);
      const txn = res.transaction || res.data;
      setTransaction(txn);

      // If backend returned attached voucher, use it directly
      if (res.voucher) {
        setVoucher(res.voucher);
      } else if (txn?.transactionStatus === "SUCCESS" && txn?.orderId) {
        // Fallback: query user's vouchers
        try {
          const vouchersRes = await voucherApi.getMyVouchers();
          const list = vouchersRes.vouchers || vouchersRes.data || [];
          const orderIdStr = String(txn.orderId?._id || txn.orderId);
          const matched = list.find(
            (v) => String(v.orderId?._id || v.orderId) === orderIdStr
          );
          if (matched) setVoucher(matched);
        } catch {
          // non-critical prefetch
        }
      }
    } catch (err) {
      console.error("Failed to load transaction:", err);
      setError(err.message || "Failed to load transaction details");
      setErrorStatus(err.status || 500);
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

  const handleCopy = (text, type = "code") => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="text-center p-6">
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
            <div className="absolute h-14 w-14 animate-ping rounded-full bg-[#E8503A]/20" />
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-[#E8503A] border-t-transparent" />
          </div>
          <h3 className="mt-4 text-base font-bold text-neutral-900">
            Verifying Transaction
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-xs mx-auto">
            Contacting HitMeUp Pay cryptographic ledger and retrieving receipt data...
          </p>
        </div>
      </div>
    );
  }

  // 2. Error States (401/403, 404, or 500/Network)
  if (error || !transaction) {
    const isNotFound = errorStatus === 404;
    const isAuthError = errorStatus === 401 || errorStatus === 403;
    const isServerError = !isNotFound && !isAuthError;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-7 text-center shadow-lg">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              isAuthError
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : isNotFound
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-neutral-100 text-neutral-600 border border-neutral-200"
            }`}
          >
            {isAuthError ? (
              <ShieldAlert size={32} />
            ) : isNotFound ? (
              <XCircle size={32} />
            ) : (
              <AlertTriangle size={32} />
            )}
          </div>

          <h2 className="mt-5 text-xl font-bold tracking-tight text-neutral-900">
            {isAuthError
              ? "Access Restricted"
              : isNotFound
              ? "Transaction Not Found"
              : "Unable to Load Transaction"}
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            {isAuthError
              ? "You do not have authorization to view this payment receipt. Please log in with the customer account that performed the transaction."
              : isNotFound
              ? `We couldn't locate any record for transaction ID "${transactionId}". Please check the URL or view your purchase history in the dashboard.`
              : error || "A network or server communication error occurred while retrieving this transaction record."}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {isServerError && (
              <button
                type="button"
                onClick={fetchDetails}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8503A] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#d4432f] cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retry Connection</span>
              </button>
            )}

            {isAuthError && (
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8503A] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#d4432f]"
              >
                <span>Sign In to Account</span>
              </Link>
            )}

            <Link
              to="/customer/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50"
            >
              <Ticket size={14} className="text-[#E8503A]" />
              <span>Go to My Vouchers</span>
            </Link>

            <Link
              to="/deals"
              className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              <span>Return to Deals Marketplace</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Transaction Status
  const status = transaction.transactionStatus;
  const isSuccess = status === "SUCCESS";
  const isPending = status === "PENDING";
  const isFailed = status === "FAILED" || status === "CANCELLED";

  const responseCode = String(transaction.responseCode || "");
  const isInsufficientFunds = responseCode === "51";
  const isNetworkTimeout = responseCode === "91";

  const orderData = transaction.orderId || {};
  const dealData = orderData.dealId || {};
  const dealTitle = dealData.title || orderData.dealSnapshot?.title || "Flash Deal Voucher";
  const dealImage = dealData.images?.[0] || orderData.dealSnapshot?.image;
  const orderNumber = orderData.orderNumber;
  const orderId = orderData._id || orderData;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 sm:py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-lg">
        {/* Top Mini Brand Navigation */}
        <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
          <Link
            to="/deals"
            className="inline-flex items-center gap-1 text-neutral-600 hover:text-[#E8503A] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Marketplace</span>
          </Link>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-neutral-800">
            <span>HitMeUp</span>
            <span className="text-[#E8503A]">Pay</span>
            <span className="rounded-full bg-[#E8503A]/10 px-1.5 py-0.2 text-[9px] text-[#E8503A]">
              GATEWAY
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SUCCESS OUTCOME                                             */}
        {/* ============================================================ */}
        {isSuccess && (
          <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            {/* Top Green Accent Banner */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-6 text-center text-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                <CheckCircle2 size={36} className="text-white" />
              </div>
              <h1 className="mt-3.5 text-xl font-bold tracking-tight sm:text-2xl">
                Payment Approved!
              </h1>
              <p className="mt-1 text-xs text-emerald-100 max-w-xs mx-auto">
                Verified cryptographically via HitMeUp Pay HMAC-SHA256 signature.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Deal Card Snippet */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/70 bg-[#FAF8F5] p-3.5">
                {dealImage ? (
                  <img
                    src={dealImage}
                    alt={dealTitle}
                    className="h-14 w-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-200/80 text-neutral-500 shrink-0">
                    <Ticket size={24} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-700 border border-neutral-200">
                    {transaction.merchantName || "HitMeUp Merchant"}
                  </span>
                  <h3 className="mt-1 text-xs sm:text-sm font-bold text-neutral-900 truncate">
                    {dealTitle}
                  </h3>
                  {orderNumber && (
                    <p className="text-[11px] font-mono text-neutral-500">
                      Order: {orderNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Transaction Key Details Card */}
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 space-y-2.5 text-xs shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-neutral-900">
                      {transaction.transactionId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transaction.transactionId, "txn")}
                      className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                      title="Copy Transaction ID"
                    >
                      {copiedTxn ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Amount Paid:</span>
                  <span className="font-bold text-neutral-900 text-sm">
                    {transaction.currency || "LKR"}{" "}
                    {Number(transaction.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Payment Method:</span>
                  <span className="font-medium text-neutral-800">
                    {transaction.paymentMethod}{" "}
                    {transaction.cardLast4 ? `(•••• ${transaction.cardLast4})` : ""}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Status:</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 size={10} />
                    <span>APPROVED (Code 00)</span>
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-100 pt-2 text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>HMAC Signature:</span>
                  </span>
                  <span
                    className="font-mono truncate max-w-[190px]"
                    title={transaction.signature}
                  >
                    {transaction.signature?.slice(0, 18)}...
                  </span>
                </div>
              </div>

              {/* Digital Voucher Display */}
              {voucher && (
                <div className="rounded-2xl border-2 border-dashed border-[#E8503A]/40 bg-[#FFFBF9] p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#E8503A] uppercase tracking-wider">
                    <Sparkles size={14} />
                    <span>Instant Digital Voucher</span>
                  </div>

                  {voucher.qrData && (
                    <div className="mt-3.5 flex justify-center">
                      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-3 shadow-xs">
                        <img
                          src={voucher.qrData}
                          alt="Voucher QR Code"
                          className="h-44 w-44 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3.5 flex items-center justify-center gap-2">
                    <span className="rounded-xl bg-white px-3.5 py-1.5 font-mono text-sm font-bold tracking-wider text-neutral-900 border border-neutral-200 shadow-2xs">
                      {voucher.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(voucher.code, "code")}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 shadow-2xs cursor-pointer transition-colors"
                      title="Copy voucher code"
                    >
                      {copiedCode ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-500">
                    Present this QR code or code at the merchant store to redeem.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/pay/receipt/${
                        transaction.paymentReference || transaction.transactionId
                      }`
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <ReceiptIcon size={16} className="text-[#E8503A]" />
                  <span>View / Print Official Receipt</span>
                </button>

                <Link
                  to="/customer/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8503A] py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#d4432f] transition-colors"
                >
                  <Ticket size={16} />
                  <span>Go to My Vouchers Dashboard</span>
                </Link>

                <Link
                  to="/deals"
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <span>Continue Browsing Marketplace</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PENDING OUTCOME                                              */}
        {/* ============================================================ */}
        {isPending && (
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-center text-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                <Clock size={36} className="text-white animate-pulse" />
              </div>
              <h1 className="mt-3.5 text-xl font-bold tracking-tight sm:text-2xl">
                Payment Pending Settlement
              </h1>
              <p className="mt-1 text-xs text-blue-100 max-w-xs mx-auto">
                Awaiting authorization clearance from the simulated banking node.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {transaction.transactionId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Status:</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold text-blue-700 text-[10px]">
                    PENDING (Code 09)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Message:</span>
                  <span className="text-neutral-800 text-right max-w-[220px]">
                    {transaction.responseMessage || "Pending external settlement"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50/70 p-4 text-xs text-blue-900 leading-relaxed border border-blue-200/50">
                <p>
                  <strong>Simulated Delay Notice:</strong> In this demo gateway,
                  clicking <strong>Check Status & Resolve</strong> below will
                  simulate external bank confirmation and resolve this transaction
                  to Approved.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCheckPendingStatus}
                  disabled={resolving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <RefreshCw
                    size={16}
                    className={resolving ? "animate-spin" : ""}
                  />
                  <span>
                    {resolving
                      ? "Resolving Settlement..."
                      : "Check Status & Resolve"}
                  </span>
                </button>

                <Link
                  to="/deals"
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <span>Return to Deals</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* FAILED / DECLINED OUTCOME                                    */}
        {/* ============================================================ */}
        {isFailed && (
          <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
            <div
              className={`p-6 text-center text-white ${
                isInsufficientFunds
                  ? "bg-gradient-to-br from-amber-600 to-orange-700"
                  : isNetworkTimeout
                  ? "bg-gradient-to-br from-slate-700 to-neutral-800"
                  : "bg-gradient-to-br from-red-600 via-red-600 to-rose-700"
              }`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                {isInsufficientFunds ? (
                  <Wallet size={36} className="text-white" />
                ) : isNetworkTimeout ? (
                  <WifiOff size={36} className="text-white" />
                ) : (
                  <XCircle size={36} className="text-white" />
                )}
              </div>
              <h1 className="mt-3.5 text-xl font-bold tracking-tight sm:text-2xl">
                {isInsufficientFunds
                  ? "Insufficient Funds"
                  : isNetworkTimeout
                  ? "Gateway Timeout"
                  : "Payment Declined"}
              </h1>
              <p className="mt-1 text-xs text-white/80 max-w-xs mx-auto">
                {isInsufficientFunds
                  ? "The simulated issuing card has insufficient credit balance."
                  : isNetworkTimeout
                  ? "Simulated connection to payment clearinghouse timed out."
                  : "The simulated card issuer declined authorization."}
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Transaction ID:</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {transaction.transactionId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Response Code:</span>
                  <span className="font-mono font-bold text-red-700">
                    {transaction.responseCode || "05"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Reason:</span>
                  <span className="font-semibold text-red-800 text-right max-w-[220px]">
                    {transaction.responseMessage ||
                      "Transaction declined by issuing network"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-600 leading-relaxed border border-neutral-200/60">
                <p>
                  <strong>No money was deducted.</strong> No voucher was created
                  and your reserved deal stock remains safe. You may retry payment
                  immediately using a different card (e.g. use demo card{" "}
                  <code className="rounded bg-neutral-200 px-1 font-mono text-[11px]">
                    4242 4242 4242 4242
                  </code>{" "}
                  for guaranteed approval).
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {orderId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/pay/checkout/${orderId}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8503A] py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#d4432f] cursor-pointer transition-colors"
                  >
                    <RotateCcw size={16} />
                    <span>Retry Payment with Another Card</span>
                  </button>
                )}

                <Link
                  to="/deals"
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
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
