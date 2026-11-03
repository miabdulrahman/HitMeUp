import { useState } from "react";
import {
    detectFoodSafety,
    detectFraud,
    generateDeals,
    generateInsights,
    generateTargeting,
    getAIAnalytics,
    recommendDeals,
} from "../services/aiService";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    BrainCircuit,
    CheckCircle2,
    Code2,
    Lightbulb,
    SearchCheck,
    ShieldAlert,
    Sparkles,
    Store,
    Tag,
    TrendingUp,
    UsersRound,
} from "lucide-react";

const initialTargeting = {
    dealTitle: "",
    dealDescription: "",
    category: "",
    price: "",
    discount: "",
};

const resultText = (value) => JSON.stringify(value, null, 2);

export default function AICommandCenter({
    mode = "seller",
    deals = [],
    user,
    onApplyGeneratedDeal,
    onSelectRecommendedDeal,
}) {
    const [activeTool, setActiveTool] = useState(
        mode === "seller" ? "insights" : "recommendations"
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [showRawJson, setShowRawJson] = useState(false);
    const [targeting, setTargeting] = useState(initialTargeting);
    const [product, setProduct] = useState({
        productName: "",
        productDescription: "",
    });
    const [activity, setActivity] = useState({
        activityType: "voucher_redemption",
        activityData: '{"attempts": 2, "voucherStatus": "ACTIVE", "channel": "POS"}',
    });
    const [preferences, setPreferences] = useState("");
    const [dealDraft, setDealDraft] = useState({
        productOrService: "",
        originalPrice: "",
        targetCustomers: "",
    });

    const sellerName =
        user?.businessName || user?.name || "Your Merchant Store";

    const run = async (action) => {
        setLoading(true);
        setError("");
        setResult(null);
        try {
            setResult(await action());
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                    requestError.message ||
                    "AI request failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const tools =
        mode === "seller"
            ? [
                  {
                      key: "insights",
                      label: "My Store Insights",
                      description: `AI analytics for ${sellerName}`,
                      icon: BarChart3,
                      color: "bg-orange-50 text-[#E8503A]",
                  },
                  {
                      key: "deal-generation",
                      label: "Deal studio",
                      description: "Create a polished flash deal",
                      icon: Sparkles,
                      color: "bg-amber-50 text-amber-600",
                  },
                  {
                      key: "targeting",
                      label: "Targeting",
                      description: "Find your best customer segments",
                      icon: UsersRound,
                      color: "bg-emerald-50 text-emerald-700",
                  },
                  {
                      key: "food-safety",
                      label: "Food safety",
                      description: "Review product safety signals",
                      icon: SearchCheck,
                      color: "bg-sky-50 text-sky-700",
                  },
                  {
                      key: "fraud",
                      label: "Fraud check",
                      description: "Review suspicious activity",
                      icon: ShieldAlert,
                      color: "bg-rose-50 text-rose-700",
                  },
              ]
            : [
                  {
                      key: "recommendations",
                      label: "Recommendations",
                      description: "Discover deals matched to you",
                      icon: Lightbulb,
                      color: "bg-amber-50 text-amber-600",
                  },
              ];

    // Extract structured objects from result depending on activeTool
    const insightsPayload = result?.insights?.insights || result?.insights || null;
    const analyticsPayload =
        result?.analytics?.analytics ||
        result?.insights?.analytics ||
        result?.analytics ||
        null;
    const generatedDealPayload = result?.deal || null;
    const targetingPayload = result?.targetting || result?.targeting || null;
    const foodSafetyPayload =
        activeTool === "food-safety" ? result?.result || null : null;
    const fraudPayload =
        activeTool === "fraud" ? result?.result || null : null;
    const recommendationsList =
        result?.recommendations?.recommendations ||
        (Array.isArray(result?.recommendations) ? result.recommendations : null);

    return (
        <section className="rounded-[28px] border border-[#E6E1DA] bg-[#F8F7F4] p-5 sm:p-8 shadow-[0_14px_35px_rgba(53,42,33,0.06)]">
            <div className="relative overflow-hidden rounded-[24px] bg-[#1E2A2F] p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border-[24px] border-[#E8503A]/30" />
                <div className="pointer-events-none absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-[#FFB703]/10" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FFD19A]">
                            <BrainCircuit size={13} /> AI workspace
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                            {mode === "seller"
                                ? `AI Command Center — ${sellerName}`
                                : "Personalized AI Deal Concierge"}
                        </h2>
                        <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-300">
                            {mode === "seller"
                                ? `Scoped exclusively to ${sellerName}'s deals, vouchers, redemptions, and safety metrics.`
                                : "Personalized deal discovery powered by your preferences and live marketplace data."}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        {mode === "seller" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
                                <Store size={12} /> Seller-Scoped Data
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-[#FFD19A]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> NVIDIA powered
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map(({ key, label, description, icon: Icon, color }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => {
                            setActiveTool(key);
                            setResult(null);
                            setError("");
                        }}
                        className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            activeTool === key
                                ? "border-[#E8503A] bg-white shadow-sm"
                                : "border-[#E6E1DA] bg-white/70 hover:border-[#E8503A]/50"
                        }`}
                    >
                        <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
                        >
                            <Icon size={18} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-xs font-black text-gray-900">
                                {label}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] font-medium text-gray-500">
                                {description}
                            </span>
                        </span>
                        <ArrowRight
                            size={14}
                            className="ml-auto shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#E8503A]"
                        />
                    </button>
                ))}
            </div>

            <div className="mt-5 rounded-2xl border border-[#E6E1DA] bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E8503A]">
                            Active tool
                        </p>
                        <h3 className="mt-1 text-base font-black text-gray-900">
                            {tools.find((tool) => tool.key === activeTool)?.label}
                        </h3>
                    </div>
                    {result && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={13} /> Complete
                        </span>
                    )}
                </div>

                {activeTool === "insights" && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="max-w-lg text-xs leading-relaxed text-gray-500">
                            Generate AI insights and performance metrics scoped exclusively to{" "}
                            <strong className="font-bold text-gray-800">{sellerName}</strong>{" "}
                            ({deals.length} store deal{deals.length === 1 ? "" : "s"} loaded).
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                run(async () => {
                                    const [insightsRes, analyticsRes] = await Promise.all([
                                        generateInsights(),
                                        getAIAnalytics(),
                                    ]);
                                    return {
                                        insights: insightsRes?.insights || insightsRes,
                                        analytics:
                                            analyticsRes?.analytics ||
                                            insightsRes?.analytics ||
                                            analyticsRes,
                                    };
                                })
                            }
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#E8503A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#D43A26] disabled:opacity-50"
                        >
                            {loading ? "Analyzing your store..." : "Generate My Store Insights"}{" "}
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                {activeTool === "deal-generation" && (
                    <form
                        className="mt-5 grid gap-3 sm:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            run(() =>
                                generateDeals({
                                    businessName:
                                        user?.businessName || user?.name || "Merchant Store",
                                    businessType: user?.businessType || "Business",
                                    productOrService: dealDraft.productOrService,
                                    originalPrice: Number(dealDraft.originalPrice),
                                    targetCustomers:
                                        dealDraft.targetCustomers || "General shoppers",
                                })
                            );
                        }}
                    >
                        <input
                            required
                            placeholder="Product or service (e.g. Woodfired Pizza Combo)"
                            value={dealDraft.productOrService}
                            onChange={(event) =>
                                setDealDraft({
                                    ...dealDraft,
                                    productOrService: event.target.value,
                                })
                            }
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                        />
                        <input
                            required
                            min="0"
                            type="number"
                            placeholder="Original price (LKR)"
                            value={dealDraft.originalPrice}
                            onChange={(event) =>
                                setDealDraft({
                                    ...dealDraft,
                                    originalPrice: event.target.value,
                                })
                            }
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                        />
                        <input
                            placeholder="Target customers (optional, e.g. University students, families)"
                            value={dealDraft.targetCustomers}
                            onChange={(event) =>
                                setDealDraft({
                                    ...dealDraft,
                                    targetCustomers: event.target.value,
                                })
                            }
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 sm:col-span-2"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                            {loading ? "Generating..." : "Generate AI deal"}
                        </button>
                    </form>
                )}

                {activeTool === "targeting" && (
                    <div className="mt-3 space-y-3">
                        {deals.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-semibold text-gray-500">
                                    Quick-fill from your deals:
                                </span>
                                {deals.slice(0, 4).map((d) => (
                                    <button
                                        key={d._id}
                                        type="button"
                                        onClick={() =>
                                            setTargeting({
                                                dealTitle: d.title || "",
                                                dealDescription: d.description || "",
                                                category: d.category || "Food",
                                                price: String(
                                                    d.discountedPrice ?? d.originalPrice ?? ""
                                                ),
                                                discount: String(d.discountPercentage ?? ""),
                                            })
                                        }
                                        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-[#E8503A] hover:text-[#E8503A]"
                                    >
                                        {d.title}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form
                            className="grid gap-3 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                run(() =>
                                    generateTargeting({
                                        ...targeting,
                                        price: Number(targeting.price) || 0,
                                        discount: Number(targeting.discount) || 0,
                                    })
                                );
                            }}
                        >
                            {Object.keys(initialTargeting).map((field) => (
                                <input
                                    key={field}
                                    required={["dealTitle", "category"].includes(field)}
                                    type={
                                        ["price", "discount"].includes(field)
                                            ? "number"
                                            : "text"
                                    }
                                    placeholder={field
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (s) => s.toUpperCase())}
                                    value={targeting[field]}
                                    onChange={(event) =>
                                        setTargeting({
                                            ...targeting,
                                            [field]: event.target.value,
                                        })
                                    }
                                    className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                                />
                            ))}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                            >
                                {loading ? "Finding customers..." : "Find target customers"}
                            </button>
                        </form>
                    </div>
                )}

                {activeTool === "food-safety" && (
                    <form
                        className="mt-5 grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            run(() =>
                                detectFoodSafety(
                                    product.productName,
                                    product.productDescription,
                                    deals[0]?._id
                                )
                            );
                        }}
                    >
                        <input
                            required
                            placeholder="Product name (e.g. Fresh Sushi Platter)"
                            value={product.productName}
                            onChange={(event) =>
                                setProduct({ ...product, productName: event.target.value })
                            }
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                        />
                        <textarea
                            placeholder="Product description, ingredients, allergens, or storage details"
                            value={product.productDescription}
                            onChange={(event) =>
                                setProduct({
                                    ...product,
                                    productDescription: event.target.value,
                                })
                            }
                            className="min-h-20 rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                            {loading ? "Checking..." : "Run food safety check"}
                        </button>
                    </form>
                )}

                {activeTool === "fraud" && (
                    <form
                        className="mt-5 grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            let parsedData;
                            try {
                                parsedData = JSON.parse(activity.activityData);
                            } catch {
                                parsedData = { details: activity.activityData };
                            }
                            run(() =>
                                detectFraud(
                                    activity.activityType,
                                    parsedData,
                                    user?._id || user?.id
                                )
                            );
                        }}
                    >
                        <input
                            required
                            placeholder="Activity type (e.g. voucher_redemption, bulk_claim)"
                            value={activity.activityType}
                            onChange={(event) =>
                                setActivity({ ...activity, activityType: event.target.value })
                            }
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                        />
                        <textarea
                            required
                            placeholder='Activity JSON or notes, e.g. {"attempts": 5, "code": "HMU-1234"}'
                            value={activity.activityData}
                            onChange={(event) =>
                                setActivity({ ...activity, activityData: event.target.value })
                            }
                            className="min-h-20 rounded-xl border border-gray-200 bg-white p-2.5 font-mono text-xs text-gray-900"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                            {loading ? "Checking..." : "Run fraud check"}
                        </button>
                    </form>
                )}

                {activeTool === "recommendations" && (
                    <form
                        className="mt-5 grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            run(() =>
                                recommendDeals(
                                    preferences || "Find the best flash deals for me",
                                    deals
                                )
                            );
                        }}
                    >
                        <textarea
                            placeholder="Tell AI what you like (e.g. coffee, dining, or desserts near Colombo under LKR 2000)"
                            value={preferences}
                            onChange={(event) => setPreferences(event.target.value)}
                            className="min-h-20 rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                            {loading ? "Finding deals..." : "Get personalized recommendations"}
                        </button>
                    </form>
                )}
            </div>

            {error && (
                <p
                    role="alert"
                    className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700"
                >
                    {error}
                </p>
            )}

            {/* Structured Seller Insights & Analytics View */}
            {result && activeTool === "insights" && (insightsPayload || analyticsPayload) && (
                <div className="mt-5 space-y-4">
                    {analyticsPayload && (
                        <div className="rounded-2xl border border-[#E6E1DA] bg-white p-4 sm:p-5">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Store size={15} className="text-[#E8503A]" />
                                    <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                                        {analyticsPayload.businessName || sellerName} — Store Metrics
                                    </span>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                    Scoped to Logged-in Seller
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl bg-[#F8F7F4] p-3">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">
                                        My Deals
                                    </span>
                                    <p className="mt-1 text-xl font-black text-gray-900">
                                        {analyticsPayload.totalDeals ?? 0}
                                    </p>
                                    <span className="text-[10px] font-semibold text-emerald-700">
                                        {analyticsPayload.activeDeals ?? 0} active
                                    </span>
                                </div>
                                <div className="rounded-xl bg-[#F8F7F4] p-3">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">
                                        Vouchers Claimed
                                    </span>
                                    <p className="mt-1 text-xl font-black text-gray-900">
                                        {analyticsPayload.totalVouchersClaimed ??
                                            analyticsPayload.totalTransactions ??
                                            0}
                                    </p>
                                    <span className="text-[10px] font-semibold text-gray-500">
                                        {analyticsPayload.totalUsers ?? 0} unique buyers
                                    </span>
                                </div>
                                <div className="rounded-xl bg-[#F8F7F4] p-3">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">
                                        POS Redemptions
                                    </span>
                                    <p className="mt-1 text-xl font-black text-gray-900">
                                        {analyticsPayload.totalRedemptions ?? 0}
                                    </p>
                                    <span className="text-[10px] font-semibold text-gray-500">
                                        Verified in-store
                                    </span>
                                </div>
                                <div className="rounded-xl bg-[#F8F7F4] p-3">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">
                                        Tracked Revenue
                                    </span>
                                    <p className="mt-1 text-xl font-black text-[#E8503A]">
                                        LKR {Number(analyticsPayload.totalRevenue || 0).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] font-semibold text-gray-500">
                                        Top: {insightsPayload?.topCategory || "General"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {insightsPayload && (
                        <div className="rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8] p-4 sm:p-5 space-y-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                                    AI Executive Summary
                                </span>
                                <p className="mt-1 text-sm font-semibold text-gray-900 leading-relaxed">
                                    {insightsPayload.summary}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl bg-white p-3.5 border border-[#DDE8E4]">
                                    <p className="text-[10px] font-bold uppercase text-emerald-700">
                                        Customer Behavior
                                    </p>
                                    <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                                        {insightsPayload.customerTrend}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-3.5 border border-[#DDE8E4]">
                                    <p className="text-[10px] font-bold uppercase text-emerald-700">
                                        Deal & Discount Performance
                                    </p>
                                    <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                                        {insightsPayload.dealTrend}{" "}
                                        {insightsPayload.discountInsight}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-3.5 border border-[#DDE8E4]">
                                    <p className="text-[10px] font-bold uppercase text-emerald-700">
                                        Risk & Fraud Status
                                    </p>
                                    <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                                        {insightsPayload.riskInsight}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-3.5 border border-[#DDE8E4]">
                                    <p className="text-[10px] font-bold uppercase text-emerald-700">
                                        Food Safety Status
                                    </p>
                                    <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                                        {insightsPayload.foodSafetyInsight}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {Array.isArray(insightsPayload.opportunities) &&
                                    insightsPayload.opportunities.length > 0 && (
                                        <div className="rounded-xl bg-white p-3.5 border border-[#DDE8E4]">
                                            <p className="text-[10px] font-bold uppercase text-amber-700 flex items-center gap-1">
                                                <TrendingUp size={12} /> Growth Opportunities
                                            </p>
                                            <ul className="mt-2 space-y-1.5 text-xs text-gray-700 list-disc pl-4">
                                                {insightsPayload.opportunities.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                {Array.isArray(insightsPayload.recommendations) &&
                                    insightsPayload.recommendations.length > 0 && (
                                        <div className="rounded-xl bg-white p-3.5 border border-[#DDE8E4]">
                                            <p className="text-[10px] font-bold uppercase text-[#E8503A] flex items-center gap-1">
                                                <Sparkles size={12} /> Actionable Next Steps
                                            </p>
                                            <ul className="mt-2 space-y-1.5 text-xs text-gray-700 list-disc pl-4">
                                                {insightsPayload.recommendations.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Structured Deal Generation View */}
            {result && activeTool === "deal-generation" && generatedDealPayload && (
                <div className="mt-5 rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8] p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Generated Flash Deal
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                            Suggested Discount: {generatedDealPayload.suggestedDiscount}
                        </span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900">
                        {generatedDealPayload.title}
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                        {generatedDealPayload.description}
                    </p>
                    {generatedDealPayload.marketingMessage && (
                        <p className="rounded-xl bg-white p-3 text-xs font-semibold text-gray-800 border border-[#DDE8E4]">
                            Marketing Hook: “{generatedDealPayload.marketingMessage}”
                        </p>
                    )}
                    {onApplyGeneratedDeal && (
                        <button
                            type="button"
                            onClick={() =>
                                onApplyGeneratedDeal({
                                    ...generatedDealPayload,
                                    originalPrice: dealDraft.originalPrice,
                                })
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#E8503A] px-4 py-2 text-xs font-bold text-white hover:bg-[#D43A26]"
                        >
                            <Tag size={13} /> Open in Deal Creator
                        </button>
                    )}
                </div>
            )}

            {/* Structured Targeting View */}
            {result && activeTool === "targeting" && targetingPayload && (
                <div className="mt-5 rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8] p-5 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                        AI Customer Segments
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                        {targetingPayload.reason}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white p-3 border border-[#DDE8E4]">
                            <span className="text-[10px] font-bold uppercase text-gray-500">
                                Target Audience
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {(targetingPayload.targetAudience || []).map((t, i) => (
                                    <span
                                        key={i}
                                        className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-[#DDE8E4]">
                            <span className="text-[10px] font-bold uppercase text-gray-500">
                                Key Interests
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {(targetingPayload.interests || []).map((t, i) => (
                                    <span
                                        key={i}
                                        className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-[#DDE8E4]">
                            <span className="text-[10px] font-bold uppercase text-gray-500">
                                Buyer Personas
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {(targetingPayload.customerType || []).map((t, i) => (
                                    <span
                                        key={i}
                                        className="rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Structured Food Safety View */}
            {result && activeTool === "food-safety" && foodSafetyPayload && (
                <div className="mt-5 rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8] p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Food Safety Assessment
                        </span>
                        <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                                foodSafetyPayload.isPotentiallyUnsafe
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-800"
                            }`}
                        >
                            Risk: {foodSafetyPayload.riskLevel} •{" "}
                            {foodSafetyPayload.isPotentiallyUnsafe
                                ? "Needs Attention"
                                : "Safe"}
                        </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed">
                        {foodSafetyPayload.reason}
                    </p>
                    {Array.isArray(foodSafetyPayload.recommendations) &&
                        foodSafetyPayload.recommendations.length > 0 && (
                            <ul className="list-disc pl-4 space-y-1 text-xs text-gray-700">
                                {foodSafetyPayload.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        )}
                </div>
            )}

            {/* Structured Fraud View */}
            {result && activeTool === "fraud" && fraudPayload && (
                <div className="mt-5 rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8] p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Fraud Risk Evaluation
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                                fraudPayload.isSuspicious
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-800"
                            }`}
                        >
                            {fraudPayload.isSuspicious && <AlertTriangle size={12} />}
                            Risk: {fraudPayload.riskLevel} •{" "}
                            {fraudPayload.isSuspicious ? "Suspicious" : "Normal"}
                        </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed">
                        {fraudPayload.reason}
                    </p>
                </div>
            )}

            {/* Structured Customer Recommendations View */}
            {result && activeTool === "recommendations" && recommendationsList && (
                <div className="mt-5 rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8] p-5 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                        Recommended For You
                    </span>
                    {recommendationsList.length === 0 ? (
                        <p className="text-xs text-gray-600">
                            No matching deals found right now. Try broadening your preferences!
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {recommendationsList.map((rec, idx) => {
                                const matchedDeal = deals.find(
                                    (d) =>
                                        String(d.dealId || d._id) === String(rec.dealId) ||
                                        d.title === rec.dealId
                                );
                                return (
                                    <div
                                        key={idx}
                                        className="rounded-xl bg-white p-3.5 border border-[#DDE8E4] flex flex-col justify-between gap-2"
                                    >
                                        <div>
                                            <p className="text-xs font-black text-gray-900">
                                                {matchedDeal?.title ||
                                                    rec.title ||
                                                    `Deal #${idx + 1}`}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                                                {rec.reason}
                                            </p>
                                        </div>
                                        {matchedDeal && onSelectRecommendedDeal && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onSelectRecommendedDeal(matchedDeal)
                                                }
                                                className="mt-2 self-start inline-flex items-center gap-1 text-[11px] font-bold text-[#E8503A] hover:underline"
                                            >
                                                View Deal <ArrowRight size={12} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Toggle for Raw JSON inspection */}
            {result && (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setShowRawJson((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-800"
                    >
                        <Code2 size={13} />
                        {showRawJson ? "Hide raw JSON response" : "View raw JSON response"}
                    </button>
                    {showRawJson && (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8]">
                            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-gray-700">
                                {resultText(result)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
