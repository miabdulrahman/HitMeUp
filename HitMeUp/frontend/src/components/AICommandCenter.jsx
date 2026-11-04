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
  CheckCircle2,
  Code2,
  Compass,
  FileEdit,
  SearchCheck,
  ShieldAlert,
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

  const sellerName = user?.businessName || user?.name || "Your store";

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
          "Analysis request could not be completed"
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
            label: "Store insights",
            description: `Performance summary for ${sellerName}`,
            icon: BarChart3,
          },
          {
            key: "deal-generation",
            label: "Deal composer",
            description: "Draft a timed offer title and copy",
            icon: FileEdit,
          },
          {
            key: "targeting",
            label: "Audience segments",
            description: "Identify likely customer groups",
            icon: UsersRound,
          },
          {
            key: "food-safety",
            label: "Food safety check",
            description: "Review allergen and storage notes",
            icon: SearchCheck,
          },
          {
            key: "fraud",
            label: "Redemption risk check",
            description: "Evaluate unusual voucher activity",
            icon: ShieldAlert,
          },
        ]
      : [
          {
            key: "recommendations",
            label: "Deal suggestions",
            description: "Match active offers to your preferences",
            icon: Compass,
          },
        ];

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
  const fraudPayload = activeTool === "fraud" ? result?.result || null : null;
  const recommendationsList =
    result?.recommendations?.recommendations ||
    (Array.isArray(result?.recommendations) ? result.recommendations : null);

  return (
    <section className="rounded-xl border border-[#E4E4E7] bg-white p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#E4E4E7] pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[12px] font-medium text-[#737373]">
            {mode === "seller" ? "Store intelligence" : "Shopper assistant"}
          </p>
          <h2 className="mt-1 text-[20px] font-medium tracking-[-0.02em] text-[#171717]">
            {mode === "seller"
              ? `${sellerName} — Store analysis & drafting`
              : "Deal finder assistant"}
          </h2>
          <p className="mt-1 max-w-xl text-[13px] text-[#525252]">
            {mode === "seller"
              ? `Scoped exclusively to ${sellerName}'s deals, claimed vouchers, counter redemptions, and safety checks.`
              : "Describe what you are looking for to filter active marketplace passes."}
          </p>
        </div>

        {mode === "seller" && (
          <div className="inline-flex items-center gap-1.5 self-start rounded-md border border-[#E4E4E7] bg-[#F4F4F5] px-2.5 py-1 text-[12px] font-medium text-[#525252] sm:self-auto">
            <Store size={13} strokeWidth={1.5} className="text-[#166534]" />
            <span>Seller-scoped ledger</span>
          </div>
        )}
      </div>

      {/* Tool Selector Tabs */}
      {tools.length > 1 && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {tools.map(({ key, label, description, icon: Icon }) => {
            const isActive = activeTool === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTool(key);
                  setResult(null);
                  setError("");
                }}
                className={`flex flex-col justify-between rounded-lg border p-3 text-left transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#E4E4E7] bg-[#FAFAFA] text-[#171717] hover:bg-[#F4F4F5]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className={isActive ? "text-[#D94832]" : "text-[#737373]"}
                  />
                </div>
                <div className="mt-3">
                  <span className="block text-[13px] font-medium">{label}</span>
                  <span
                    className={`mt-0.5 block truncate text-[11px] ${
                      isActive ? "text-[#A1A1AA]" : "text-[#737373]"
                    }`}
                  >
                    {description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Tool Form */}
      <div className="mt-5 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">Selected tool</p>
            <h3 className="mt-0.5 text-[15px] font-medium text-[#171717]">
              {tools.find((tool) => tool.key === activeTool)?.label}
            </h3>
          </div>
          {result && (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#166534]">
              <CheckCircle2 size={14} strokeWidth={1.5} />
              <span>Ready</span>
            </span>
          )}
        </div>

        {activeTool === "insights" && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-lg text-[13px] leading-relaxed text-[#525252]">
              Compile store metrics and recommendations for{" "}
              <span className="font-medium text-[#171717]">{sellerName}</span> (
              <span className="font-mono tabular-nums">{deals.length}</span>{" "}
              store deal{deals.length === 1 ? "" : "s"} loaded).
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
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#D94832] px-4 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#C23B26] disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading ? "Analyzing store ledger..." : "Run store analysis"}
              </span>
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {activeTool === "deal-generation" && (
          <form
            className="mt-3 grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(() =>
                generateDeals({
                  businessName:
                    user?.businessName || user?.name || "Merchant store",
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
              placeholder="Item or service (e.g. Woodfired Pizza Combo)"
              value={dealDraft.productOrService}
              onChange={(event) =>
                setDealDraft({
                  ...dealDraft,
                  productOrService: event.target.value,
                })
              }
              className="h-10 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
            />
            <input
              required
              min="0"
              type="number"
              placeholder="Regular price (Rs.)"
              value={dealDraft.originalPrice}
              onChange={(event) =>
                setDealDraft({
                  ...dealDraft,
                  originalPrice: event.target.value,
                })
              }
              className="h-10 rounded-lg border border-[#E4E4E7] bg-white px-3 font-mono text-[13px] text-[#171717] placeholder:font-sans placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
            />
            <input
              placeholder="Target audience (optional, e.g. office lunch crowd, students)"
              value={dealDraft.targetCustomers}
              onChange={(event) =>
                setDealDraft({
                  ...dealDraft,
                  targetCustomers: event.target.value,
                })
              }
              className="h-10 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none sm:col-span-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-fit rounded-lg bg-[#171717] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Drafting offer..." : "Draft deal copy"}
            </button>
          </form>
        )}

        {activeTool === "targeting" && (
          <div className="mt-3 space-y-3">
            {deals.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-[#737373]">
                  Prefill from store deals:
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
                    className="rounded-md border border-[#E4E4E7] bg-white px-2.5 py-1 text-[12px] font-medium text-[#525252] hover:border-[#171717] hover:text-[#171717] cursor-pointer"
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
                    ["price", "discount"].includes(field) ? "number" : "text"
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
                  className="h-10 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
                />
              ))}
              <button
                type="submit"
                disabled={loading}
                className="h-9 w-fit rounded-lg bg-[#171717] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Analyzing segments..." : "Identify segments"}
              </button>
            </form>
          </div>
        )}

        {activeTool === "food-safety" && (
          <form
            className="mt-3 grid gap-3"
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
              placeholder="Item name (e.g. Fresh Seafood Platter)"
              value={product.productName}
              onChange={(event) =>
                setProduct({ ...product, productName: event.target.value })
              }
              className="h-10 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
            />
            <textarea
              placeholder="Ingredients, preparation window, allergens, or storage notes"
              value={product.productDescription}
              onChange={(event) =>
                setProduct({
                  ...product,
                  productDescription: event.target.value,
                })
              }
              className="min-h-20 rounded-lg border border-[#E4E4E7] bg-white p-3 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-fit rounded-lg bg-[#171717] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Checking..." : "Run food safety check"}
            </button>
          </form>
        )}

        {activeTool === "fraud" && (
          <form
            className="mt-3 grid gap-3"
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
              className="h-10 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
            />
            <textarea
              required
              placeholder='Activity JSON or notes, e.g. {"attempts": 5, "code": "HMU-1234"}'
              value={activity.activityData}
              onChange={(event) =>
                setActivity({ ...activity, activityData: event.target.value })
              }
              className="min-h-20 rounded-lg border border-[#E4E4E7] bg-white p-3 font-mono text-[12px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-fit rounded-lg bg-[#171717] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Checking..." : "Run risk check"}
            </button>
          </form>
        )}

        {activeTool === "recommendations" && (
          <form
            className="mt-3 grid gap-3"
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
              placeholder="Describe what you want (e.g. afternoon coffee, bakery, or lunch near Colombo under Rs. 2,000)"
              value={preferences}
              onChange={(event) => setPreferences(event.target.value)}
              className="min-h-20 rounded-lg border border-[#E4E4E7] bg-white p-3 text-[13px] text-[#171717] placeholder:text-[#737373] focus:border-[#D94832] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-fit rounded-lg bg-[#171717] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Matching deals..." : "Find matching passes"}
            </button>
          </form>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-[#B91C1C]/25 bg-[#B91C1C]/5 p-3 text-[13px] text-[#B91C1C]"
        >
          {error}
        </p>
      )}

      {/* Structured Seller Insights & Analytics View */}
      {result &&
        activeTool === "insights" &&
        (insightsPayload || analyticsPayload) && (
          <div className="mt-5 space-y-4">
            {analyticsPayload && (
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Store size={15} strokeWidth={1.5} className="text-[#525252]" />
                    <span className="text-[14px] font-medium text-[#171717]">
                      {analyticsPayload.businessName || sellerName} — Store ledger
                    </span>
                  </div>
                  <span className="rounded-md bg-[#166534]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#166534]">
                    Scoped to logged-in seller
                  </span>
                </div>

                {/* Numbers-only stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                    <span className="text-[12px] text-[#737373]">
                      Store deals
                    </span>
                    <p className="mt-1 font-mono text-[24px] font-medium text-[#171717] tabular-nums">
                      {analyticsPayload.totalDeals ?? 0}
                    </p>
                    <span className="text-[11px] text-[#166534]">
                      {analyticsPayload.activeDeals ?? 0} active
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                    <span className="text-[12px] text-[#737373]">
                      Passes claimed
                    </span>
                    <p className="mt-1 font-mono text-[24px] font-medium text-[#171717] tabular-nums">
                      {analyticsPayload.totalVouchersClaimed ??
                        analyticsPayload.totalTransactions ??
                        0}
                    </p>
                    <span className="text-[11px] text-[#737373]">
                      {analyticsPayload.totalUsers ?? 0} unique shoppers
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                    <span className="text-[12px] text-[#737373]">
                      POS redemptions
                    </span>
                    <p className="mt-1 font-mono text-[24px] font-medium text-[#171717] tabular-nums">
                      {analyticsPayload.totalRedemptions ?? 0}
                    </p>
                    <span className="text-[11px] text-[#737373]">
                      Verified at counter
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4">
                    <span className="text-[12px] text-[#737373]">
                      Tracked revenue
                    </span>
                    <p className="mt-1 font-mono text-[24px] font-medium text-[#171717] tabular-nums">
                      Rs. {Number(analyticsPayload.totalRevenue || 0).toLocaleString()}
                    </p>
                    <span className="text-[11px] text-[#737373]">
                      Primary: {insightsPayload?.topCategory || "General"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {insightsPayload && (
              <div className="space-y-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
                <div>
                  <span className="text-[12px] font-medium text-[#737373]">
                    Summary
                  </span>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#171717]">
                    {insightsPayload.summary}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
                    <p className="text-[12px] font-medium text-[#171717]">
                      Shopper behavior
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#525252]">
                      {insightsPayload.customerTrend}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
                    <p className="text-[12px] font-medium text-[#171717]">
                      Deal &amp; markdown performance
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#525252]">
                      {insightsPayload.dealTrend}{" "}
                      {insightsPayload.discountInsight}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
                    <p className="text-[12px] font-medium text-[#171717]">
                      Redemption risk status
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#525252]">
                      {insightsPayload.riskInsight}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
                    <p className="text-[12px] font-medium text-[#171717]">
                      Food safety status
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#525252]">
                      {insightsPayload.foodSafetyInsight}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.isArray(insightsPayload.opportunities) &&
                    insightsPayload.opportunities.length > 0 && (
                      <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
                        <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#171717]">
                          <TrendingUp size={14} strokeWidth={1.5} className="text-[#166534]" />
                          <span>Opportunities</span>
                        </p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px] text-[#525252]">
                          {insightsPayload.opportunities.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {Array.isArray(insightsPayload.recommendations) &&
                    insightsPayload.recommendations.length > 0 && (
                      <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
                        <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#171717]">
                          <ArrowRight size={14} strokeWidth={1.5} className="text-[#D94832]" />
                          <span>Recommended actions</span>
                        </p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px] text-[#525252]">
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
        <div className="mt-5 space-y-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-[#737373]">
              Drafted flash deal
            </span>
            <span className="rounded-md bg-[#D94832]/10 px-2.5 py-0.5 font-mono text-[12px] font-medium text-[#D94832] tabular-nums">
              Suggested discount: {generatedDealPayload.suggestedDiscount}
            </span>
          </div>
          <h4 className="text-[17px] font-medium text-[#171717]">
            {generatedDealPayload.title}
          </h4>
          <p className="text-[13px] leading-relaxed text-[#525252]">
            {generatedDealPayload.description}
          </p>
          {generatedDealPayload.marketingMessage && (
            <p className="rounded-lg border border-[#E4E4E7] bg-white p-3 text-[13px] text-[#171717]">
              Counter note: &ldquo;{generatedDealPayload.marketingMessage}&rdquo;
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
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#D94832] px-4 text-[13px] font-medium text-white hover:bg-[#C23B26] cursor-pointer"
            >
              <Tag size={14} strokeWidth={1.5} />
              <span>Load into deal form</span>
            </button>
          )}
        </div>
      )}

      {/* Structured Targeting View */}
      {result && activeTool === "targeting" && targetingPayload && (
        <div className="mt-5 space-y-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
          <span className="text-[12px] font-medium text-[#737373]">
            Suggested customer segments
          </span>
          <p className="text-[13px] leading-relaxed text-[#525252]">
            {targetingPayload.reason}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E4E4E7] bg-white p-3.5">
              <span className="text-[11px] font-medium text-[#737373]">
                Audience groups
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(targetingPayload.targetAudience || []).map((t, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-2 py-0.5 text-[12px] text-[#171717]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#E4E4E7] bg-white p-3.5">
              <span className="text-[11px] font-medium text-[#737373]">
                Related interests
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(targetingPayload.interests || []).map((t, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-2 py-0.5 text-[12px] text-[#171717]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#E4E4E7] bg-white p-3.5">
              <span className="text-[11px] font-medium text-[#737373]">
                Visit patterns
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(targetingPayload.customerType || []).map((t, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-2 py-0.5 text-[12px] text-[#171717]"
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
        <div className="mt-5 space-y-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-[#737373]">
              Food safety review
            </span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-[12px] font-medium ${
                foodSafetyPayload.isPotentiallyUnsafe
                  ? "bg-[#B91C1C]/10 text-[#B91C1C]"
                  : "bg-[#166534]/10 text-[#166534]"
              }`}
            >
              Risk: {foodSafetyPayload.riskLevel} ·{" "}
              {foodSafetyPayload.isPotentiallyUnsafe
                ? "Needs attention"
                : "Clear"}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-[#171717]">
            {foodSafetyPayload.reason}
          </p>
          {Array.isArray(foodSafetyPayload.recommendations) &&
            foodSafetyPayload.recommendations.length > 0 && (
              <ul className="list-disc space-y-1 pl-4 text-[13px] text-[#525252]">
                {foodSafetyPayload.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
        </div>
      )}

      {/* Structured Fraud View */}
      {result && activeTool === "fraud" && fraudPayload && (
        <div className="mt-5 space-y-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-[#737373]">
              Redemption risk evaluation
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[12px] font-medium ${
                fraudPayload.isSuspicious
                  ? "bg-[#B91C1C]/10 text-[#B91C1C]"
                  : "bg-[#166534]/10 text-[#166534]"
              }`}
            >
              {fraudPayload.isSuspicious && (
                <AlertTriangle size={12} strokeWidth={1.5} />
              )}
              Risk: {fraudPayload.riskLevel} ·{" "}
              {fraudPayload.isSuspicious ? "Review required" : "Normal"}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-[#171717]">
            {fraudPayload.reason}
          </p>
        </div>
      )}

      {/* Structured Customer Recommendations View */}
      {result && activeTool === "recommendations" && recommendationsList && (
        <div className="mt-5 space-y-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
          <span className="text-[12px] font-medium text-[#737373]">
            Matched deals
          </span>
          {recommendationsList.length === 0 ? (
            <p className="text-[13px] text-[#525252]">
              No matching deals found right now. Try broadening your request.
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
                    className="flex flex-col justify-between gap-2 rounded-lg border border-[#E4E4E7] bg-white p-4"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-[#171717]">
                        {matchedDeal?.title ||
                          rec.title ||
                          `Deal #${idx + 1}`}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#525252]">
                        {rec.reason}
                      </p>
                    </div>
                    {matchedDeal && onSelectRecommendedDeal && (
                      <button
                        type="button"
                        onClick={() => onSelectRecommendedDeal(matchedDeal)}
                        className="mt-2 inline-flex items-center gap-1 self-start text-[12px] font-medium text-[#D94832] hover:underline cursor-pointer"
                      >
                        <span>Open deal</span>
                        <ArrowRight size={12} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Raw JSON inspection toggle */}
      {result && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowRawJson((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            <Code2 size={13} strokeWidth={1.5} />
            <span>{showRawJson ? "Hide JSON payload" : "Inspect JSON payload"}</span>
          </button>
          {showRawJson && (
            <div className="mt-2 overflow-hidden rounded-lg border border-[#E4E4E7] bg-[#FAFAFA]">
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[12px] leading-relaxed text-[#525252]">
                {resultText(result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
