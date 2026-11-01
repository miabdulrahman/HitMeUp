import { useState } from "react";
import {
    detectFoodSafety,
    detectFraud,
    generateInsights,
    generateTargeting,
    getAIAnalytics,
    recommendDeals,
} from "../services/aiService";

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
            ["insights", "Business insights"],
            ["targeting", "Customer targeting"],
            ["food-safety", "Food safety"],
            ["fraud", "Fraud check"],
        ]
        : [["recommendations", "Deal recommendations"]];

    return (
        <section className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">AI Command Center</p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">Make smarter decisions with HitMeUp AI</h2>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-800">NVIDIA powered</span>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {tools.map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => { setActiveTool(key); setResult(null); setError(""); }}
                        className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
                            activeTool === key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTool === "insights" && (
                <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => run(async () => {
                            const [insights, analytics] = await Promise.all([generateInsights(), getAIAnalytics()]);
                            return { insights, analytics };
                        })}
                        disabled={loading}
                        className="rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                        {loading ? "Analyzing..." : "Generate marketplace insights"}
                    </button>
                </div>
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

            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
            {result && <pre className="mt-5 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-950 p-4 text-xs text-blue-100">{resultText(result)}</pre>}
        </section>
    );
}
