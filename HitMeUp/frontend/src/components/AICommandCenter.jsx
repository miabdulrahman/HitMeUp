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
    ArrowRight,
    BarChart3,
    BrainCircuit,
    CheckCircle2,
    Lightbulb,
    SearchCheck,
    ShieldAlert,
    Sparkles,
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

export default function AICommandCenter({ mode = "seller", deals = [], user }) {
    const [activeTool, setActiveTool] = useState(mode === "seller" ? "insights" : "recommendations");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [targeting, setTargeting] = useState(initialTargeting);
    const [product, setProduct] = useState({ productName: "", productDescription: "" });
    const [activity, setActivity] = useState({
        activityType: "voucher_redemption",
        activityData: "",
    });
    const [preferences, setPreferences] = useState("");
    const [dealDraft, setDealDraft] = useState({
        productOrService: "",
        originalPrice: "",
        targetCustomers: "",
    });

    const run = async (action) => {
        setLoading(true);
        setError("");
        setResult(null);
        try {
            setResult(await action());
        } catch (requestError) {
            setError(requestError.message || "AI request failed");
        } finally {
            setLoading(false);
        }
    };

    const tools = mode === "seller"
        ? [
            { key: "insights", label: "Insights", description: "Understand marketplace performance", icon: BarChart3, color: "bg-orange-50 text-[#E8503A]" },
            { key: "deal-generation", label: "Deal studio", description: "Create a polished flash deal", icon: Sparkles, color: "bg-amber-50 text-amber-600" },
            { key: "targeting", label: "Targeting", description: "Find your best customer segments", icon: UsersRound, color: "bg-emerald-50 text-emerald-700" },
            { key: "food-safety", label: "Food safety", description: "Review product safety signals", icon: SearchCheck, color: "bg-sky-50 text-sky-700" },
            { key: "fraud", label: "Fraud check", description: "Review suspicious activity", icon: ShieldAlert, color: "bg-rose-50 text-rose-700" },
        ]
        : [{ key: "recommendations", label: "Recommendations", description: "Discover deals matched to you", icon: Lightbulb, color: "bg-amber-50 text-amber-600" }];

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
                    <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Make smarter decisions</h2>
                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-300">
                        {mode === "seller" ? "One focused workspace for creating deals, understanding customers, and protecting your marketplace." : "Personalized deal discovery powered by your preferences and live marketplace data."}
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-[#FFD19A] sm:self-auto">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> NVIDIA powered
                </span>
                </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map(({ key, label, description, icon: Icon, color }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => { setActiveTool(key); setResult(null); setError(""); }}
                        className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            activeTool === key ? "border-[#E8503A] bg-white shadow-sm" : "border-[#E6E1DA] bg-white/70 hover:border-[#E8503A]/50"
                        }`}
                    >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                            <Icon size={18} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-xs font-black text-gray-900">{label}</span>
                            <span className="mt-0.5 block truncate text-[10px] font-medium text-gray-500">{description}</span>
                        </span>
                        <ArrowRight size={14} className="ml-auto shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#E8503A]" />
                    </button>
                ))}
            </div>

            <div className="mt-5 rounded-2xl border border-[#E6E1DA] bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E8503A]">Active tool</p>
                    <h3 className="mt-1 text-base font-black text-gray-900">{tools.find((tool) => tool.key === activeTool)?.label}</h3>
                </div>
                {result && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 size={13} /> Complete</span>}
            </div>

            {activeTool === "insights" && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="max-w-lg text-xs leading-relaxed text-gray-500">Generate a concise view of deal performance, customer behavior, risk, and growth opportunities.</p>
                    <button
                        type="button"
                        onClick={() => run(async () => {
                            const [insights, analytics] = await Promise.all([generateInsights(), getAIAnalytics()]);
                            return { insights, analytics };
                        })}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#E8503A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#D43A26] disabled:opacity-50"
                    >
                        {loading ? "Analyzing..." : "Generate insights"} <ArrowRight size={14} />
                    </button>
                </div>
            )}

            {activeTool === "deal-generation" && (
                <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
                    event.preventDefault();
                    run(() => generateDeals({
                        businessName: user?.businessName || user?.name || "Merchant Store",
                        businessType: user?.businessType || "Business",
                        productOrService: dealDraft.productOrService,
                        originalPrice: Number(dealDraft.originalPrice),
                        targetCustomers: dealDraft.targetCustomers || "General shoppers",
                    }));
                }}>
                    <input
                        required
                        placeholder="Product or service"
                        value={dealDraft.productOrService}
                        onChange={(event) => setDealDraft({ ...dealDraft, productOrService: event.target.value })}
                        className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                    />
                    <input
                        required
                        min="0"
                        type="number"
                        placeholder="Original price"
                        value={dealDraft.originalPrice}
                        onChange={(event) => setDealDraft({ ...dealDraft, originalPrice: event.target.value })}
                        className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                    />
                    <input
                        placeholder="Target customers (optional)"
                        value={dealDraft.targetCustomers}
                        onChange={(event) => setDealDraft({ ...dealDraft, targetCustomers: event.target.value })}
                        className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 sm:col-span-2"
                    />
                    <button type="submit" disabled={loading} className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                        {loading ? "Generating..." : "Generate AI deal"}
                    </button>
                </form>
            )}

            {activeTool === "targeting" && (
                <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
                    event.preventDefault();
                    run(() => generateTargeting({ ...targeting, price: Number(targeting.price), discount: Number(targeting.discount) }));
                }}>
                    {Object.keys(initialTargeting).map((field) => (
                        <input
                            key={field}
                            required={["dealTitle", "category"].includes(field)}
                            type={["price", "discount"].includes(field) ? "number" : "text"}
                            placeholder={field.replace(/([A-Z])/g, " $1")}
                            value={targeting[field]}
                            onChange={(event) => setTargeting({ ...targeting, [field]: event.target.value })}
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900"
                        />
                    ))}
                    <button type="submit" disabled={loading} className="rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                        {loading ? "Finding customers..." : "Find target customers"}
                    </button>
                </form>
            )}

            {activeTool === "food-safety" && (
                <form className="mt-5 grid gap-3" onSubmit={(event) => {
                    event.preventDefault();
                    run(() => detectFoodSafety(product.productName, product.productDescription));
                }}>
                    <input required placeholder="Product name" value={product.productName} onChange={(event) => setProduct({ ...product, productName: event.target.value })} className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900" />
                    <textarea placeholder="Product description, ingredients, or storage details" value={product.productDescription} onChange={(event) => setProduct({ ...product, productDescription: event.target.value })} className="min-h-20 rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900" />
                    <button type="submit" disabled={loading} className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                        {loading ? "Checking..." : "Run food safety check"}
                    </button>
                </form>
            )}

            {activeTool === "fraud" && (
                <form className="mt-5 grid gap-3" onSubmit={(event) => {
                    event.preventDefault();
                    let parsedData;
                    try {
                        parsedData = JSON.parse(activity.activityData);
                    } catch {
                        setError("Activity data must be valid JSON.");
                        return;
                    }
                    run(() => detectFraud(activity.activityType, parsedData, user?._id || user?.id));
                }}>
                    <input required placeholder="Activity type" value={activity.activityType} onChange={(event) => setActivity({ ...activity, activityType: event.target.value })} className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900" />
                    <textarea required placeholder='Activity JSON, e.g. {"attempts": 5}' value={activity.activityData} onChange={(event) => setActivity({ ...activity, activityData: event.target.value })} className="min-h-20 rounded-xl border border-gray-200 bg-white p-2.5 font-mono text-xs text-gray-900" />
                    <button type="submit" disabled={loading} className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                        {loading ? "Checking..." : "Run fraud check"}
                    </button>
                </form>
            )}

            {activeTool === "recommendations" && (
                <form className="mt-5 grid gap-3" onSubmit={(event) => {
                    event.preventDefault();
                    run(() => recommendDeals(preferences || "Find relevant deals for me", deals));
                }}>
                    <textarea placeholder="Tell AI what you like (e.g. vegetarian food near Colombo under LKR 1500)" value={preferences} onChange={(event) => setPreferences(event.target.value)} className="min-h-20 rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900" />
                    <button type="submit" disabled={loading} className="w-fit rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                        {loading ? "Finding deals..." : "Get personalized recommendations"}
                    </button>
                </form>
            )}

            </div>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
            {result && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#DDE8E4] bg-[#F4FAF8]">
                    <div className="flex items-center justify-between border-b border-[#DDE8E4] px-4 py-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">AI result</span>
                        <span className="text-[10px] font-medium text-gray-400">Live response</span>
                    </div>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-gray-700">{resultText(result)}</pre>
                </div>
            )}
        </section>
    );
}
