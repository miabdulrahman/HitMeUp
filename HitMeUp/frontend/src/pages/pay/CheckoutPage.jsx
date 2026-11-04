import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { gatewayApi } from "../../services/api";
import PaymentMethodSelector from "../../components/pay/PaymentMethodSelector";
import CardPaymentForm from "../../components/pay/CardPaymentForm";
import BankTransferForm from "../../components/pay/BankTransferForm";
import WalletPaymentForm from "../../components/pay/WalletPaymentForm";
import OrderSummary from "../../components/pay/OrderSummary";
import PaymentProcessing from "../../components/pay/PaymentProcessing";

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("CARD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingScenario, setProcessingScenario] = useState("SUCCESS");
  const [isExpired, setIsExpired] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await gatewayApi.getCheckoutSession(orderId);

      if (res.alreadyPaid) {
        // If already paid, redirect straight to receipt or result
        if (res.payment?.gatewayTransactionId) {
          navigate(`/pay/result/${res.payment.gatewayTransactionId}`, { replace: true });
          return;
        }
      }

      setOrder(res.order);
      if (res.order?.status === "EXPIRED" || res.order?.orderStatus === "EXPIRED") {
        setIsExpired(true);
      }
    } catch (err) {
      console.error("Failed to load checkout session:", err);
      if (err.status === 410) {
        setIsExpired(true);
        setError("This checkout session has expired. Reserved inventory has been safely restored.");
      } else {
        setError(err.message || "Failed to load checkout session");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleProcessPayment = async ({
    paymentMethod,
    requestedScenario = "SUCCESS",
    brand,
    last4,
  }) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingScenario(requestedScenario);
    setError("");

    try {
      const idempotencyKey = `IDEM-${orderId}-${Date.now()}`;
      const res = await gatewayApi.processPayment({
        orderId,
        paymentMethod,
        requestedScenario,
        brand,
        last4,
        idempotencyKey,
      });

      const transactionId =
        res.transaction?.transactionId ||
        res.payment?.gatewayTransactionId ||
        orderId;

      // Navigate to comprehensive result page
      navigate(`/pay/result/${transactionId}`, {
        state: {
          resultData: res,
          order,
        },
      });
    } catch (err) {
      console.error("Payment execution error:", err);
      // If error payload has transaction ID, navigate to failure result
      const txnId = err.data?.transaction?.transactionId;
      if (txnId) {
        navigate(`/pay/result/${txnId}`, {
          state: {
            resultData: err.data,
            order,
          },
        });
      } else {
        setError(err.message || "Payment execution could not be completed.");
        setIsProcessing(false);
      }
    }
  };

  const handleExpire = () => {
    setIsExpired(true);
    setError("This checkout window has timed out. Please return to the marketplace to re-select your deal.");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#E8503A] border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-neutral-600">
            Initializing HitMeUp Pay session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-16">
      {/* Top Header */}
      <header className="border-b border-neutral-200/80 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/deals"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              aria-label="Back to deals"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-[#111827]">
                HitMeUp <span className="text-[#E8503A]">Pay</span>
              </span>
              <span className="rounded-full bg-[#E8503A]/10 px-2 py-0.5 text-[10px] font-bold text-[#E8503A]">
                SIMULATED GATEWAY
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-neutral-600">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span className="font-medium hidden sm:inline">Academic Demonstration</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* Demo Mode Banner */}
        <div className="mb-6 flex items-start space-x-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-2xs">
          <Sparkles size={20} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Simulated Sandbox Environment:</span> HitMeUp Pay is an academic demonstration payment platform. No genuine funds, real card numbers, or live banking credentials are processed. Use the trigger pills below to simulate any payment outcome.
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start space-x-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
            <div className="text-xs font-medium">{error}</div>
          </div>
        )}

        {isExpired ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={28} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-neutral-900">
              Checkout Session Expired
            </h2>
            <p className="mt-1 text-sm text-neutral-600 max-w-md mx-auto">
              The 15-minute checkout reservation window for this deal has expired. Stock has been safely returned to the merchant inventory.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Link
                to="/deals"
                className="rounded-xl bg-[#E8503A] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#d4432f]"
              >
                Browse Marketplace Deals
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Payment Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6">
                <PaymentMethodSelector
                  selectedMethod={selectedMethod}
                  onSelectMethod={setSelectedMethod}
                />

                <div className="mt-6 border-t border-neutral-100 pt-6">
                  {selectedMethod === "CARD" && (
                    <CardPaymentForm
                      onSubmit={handleProcessPayment}
                      disabled={isProcessing}
                    />
                  )}

                  {selectedMethod === "BANK_TRANSFER" && (
                    <BankTransferForm
                      onSubmit={handleProcessPayment}
                      disabled={isProcessing}
                    />
                  )}

                  {selectedMethod === "WALLET" && (
                    <WalletPaymentForm
                      onSubmit={handleProcessPayment}
                      disabled={isProcessing}
                    />
                  )}
                </div>
              </div>

              {/* Security Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-neutral-200/60 bg-white/60 p-4 text-xs text-neutral-500">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Zero Real PAN Storage</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>HMAC-SHA256 Signed</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Idempotent Execution</span>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-20">
                <OrderSummary order={order} onExpire={handleExpire} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen processing spinner overlay */}
      {isProcessing && <PaymentProcessing scenario={processingScenario} />}
    </div>
  );
}
