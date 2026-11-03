const { getNvidiaClient, getNvidiaModel } = require("./nvidiaClient");

const buildFallbackInsights = ({
    scope,
    businessName,
    businessCategory,
    totalDeals = 0,
    activeDeals = 0,
    totalUsers = 0,
    totalTransactions = 0,
    totalVouchersClaimed = 0,
    totalRedemptions = 0,
    totalRevenue = 0,
    popularCategories = [],
    topDeals = [],
    fraudStats = {},
    foodSafetyStats = {},
}) => {
    const storeLabel = businessName ? `${businessName}` : "your store";
    const topCat =
        popularCategories?.[0]?.category ||
        businessCategory ||
        topDeals?.[0]?.category ||
        "Flash Deals";

    const avgDiscount =
        topDeals.length > 0
            ? Math.round(
                  topDeals.reduce(
                      (sum, d) =>
                          sum + (Number(d.discountPercentage ?? d.discount) || 0),
                      0
                  ) / topDeals.length
              )
            : 0;

    return {
        summary:
            scope === "seller"
                ? `${storeLabel} currently has ${totalDeals} deal(s) (${activeDeals} active), ${totalVouchersClaimed} voucher claim(s), ${totalRedemptions} POS redemption(s), and LKR ${Number(totalRevenue || 0).toLocaleString()} in tracked order revenue.`
                : `Marketplace overview across ${totalDeals} deals, ${totalUsers} users, and ${totalTransactions} transactions.`,
        topCategory: topCat,
        customerTrend:
            totalVouchersClaimed > 0
                ? `${totalUsers || totalVouchersClaimed} customer(s) have engaged with ${storeLabel}'s deals, with ${totalRedemptions} completed in-store redemptions.`
                : `Customers on HitMeUp respond fastest to time-limited offers in ${topCat} with clear savings and pinned store locations.`,
        dealTrend:
            totalDeals > 0
                ? `${activeDeals} of ${totalDeals} deal(s) for ${storeLabel} are currently active.`
                : `No active deals published yet for ${storeLabel}. Launching your first flash deal will unlock live conversion tracking.`,
        discountInsight:
            avgDiscount > 0
                ? `Your average discount across recent deals is ${avgDiscount}%. Deals between 20% and 40% off typically drive the highest voucher redemption rates.`
                : `Offering 20%–35% off on an entry item is recommended to attract first-time buyers to ${storeLabel}.`,
        riskInsight:
            (fraudStats?.suspicious || 0) > 0
                ? `${fraudStats.suspicious} suspicious activity flag(s) detected across ${fraudStats.totalChecks || 0} check(s). Verify voucher QR codes at POS before redeeming.`
                : `No suspicious fraud flags detected for ${storeLabel} (${fraudStats?.totalChecks || 0} check(s) run).`,
        foodSafetyInsight:
            (foodSafetyStats?.potentialUnsafe || 0) > 0
                ? `${foodSafetyStats.potentialUnsafe} product(s) flagged for review out of ${foodSafetyStats.totalChecked || 0} food safety checks.`
                : `All ${foodSafetyStats?.totalChecked || 0} checked items for ${storeLabel} passed food safety screening.`,
        opportunities: [
            `Launch peak-hour flash deals for ${storeLabel} in the ${topCat} category to boost local discovery.`,
            `Ensure your store pin is set on the Discovery Map so nearby buyers can navigate directly to ${storeLabel}.`,
        ],
        recommendations: [
            totalDeals === 0
                ? `Create your first active flash deal for ${storeLabel} with a 25%+ discount.`
                : `Promote your top deal ("${topDeals[0]?.title || topCat}") during evening rush hours.`,
            `Use the POS Voucher Redemption scanner to convert claimed vouchers into verified store visits.`,
            `Run AI Targeting on new deals to tailor descriptions for local buyers.`,
        ],
    };
};

const generateInsights = async (analyticsData = {}) => {
    const {
        scope = "seller",
        businessName,
        businessCategory,
        totalDeals = 0,
        activeDeals = 0,
        totalUsers = 0,
        totalTransactions = 0,
        totalVouchersClaimed = 0,
        totalRedemptions = 0,
        totalRevenue = 0,
        popularCategories = [],
        topDeals = [],
        fraudStats,
        froudSts,
        foodSafetyStats = {},
    } = analyticsData;

    const resolvedFraudStats = fraudStats || froudSts || {};

    try {
        const contextHeader =
            scope === "seller"
                ? `Analyze the following private store data EXCLUSIVELY for the logged-in merchant "${businessName || "Seller Store"}" (Category: ${businessCategory || "General"}) and generate personalized business insights for this seller only.`
                : `Analyze the following marketplace data and generate useful business insights.`;

        const prompt = `
        You are an AI business analytics assistant for HitMeUp,
        a real-time flash deal marketplace.

        ${contextHeader}

        Store / Seller Data:
        Merchant Name: ${businessName || "Logged-in Seller"}
        Merchant Category: ${businessCategory || "General"}
        Total Seller Deals: ${totalDeals ?? 0}
        Active Seller Deals: ${activeDeals ?? 0}
        Unique Customers Engaged: ${totalUsers ?? 0}
        Total Seller Transactions / Orders: ${totalTransactions ?? 0}
        Total Vouchers Claimed: ${totalVouchersClaimed ?? 0}
        Total POS Redemptions: ${totalRedemptions ?? 0}
        Tracked Revenue (LKR): ${totalRevenue ?? 0}

        Seller Categories Breakdown:
        ${JSON.stringify(popularCategories ?? [])}

        Seller Deals List:
        ${JSON.stringify(topDeals ?? [])}

        Seller Fraud Statistics:
        ${JSON.stringify(resolvedFraudStats)}

        Seller Food Safety Statistics:
        ${JSON.stringify(foodSafetyStats ?? {})}

        Analyze specifically for this seller:
        - Their most popular deal categories
        - Customer engagement and voucher redemption behavior for their store
        - Their deal performance and inventory movement
        - Their discount pricing trends
        - Fraud/risk patterns on their account
        - Food safety patterns on their deals
        - Specific growth opportunities for their store
        - Actionable recommendations for this seller

        Return ONLY valid JSON in this exact format:

        {
            "summary": "Short personalized summary for this seller's store",
            "topCategory": "Most popular category for this seller",
            "customerTrend": "Customer engagement and voucher claim/redemption trend for this seller",
            "dealTrend": "Deal performance trend for this seller",
            "discountInsight": "Insight about this seller's discounts and pricing",
            "riskInsight": "Insight about fraud or risk for this seller",
            "foodSafetyInsight": "Insight about food safety for this seller",
            "opportunities": [
                "Business opportunity 1 for this seller",
                "Business opportunity 2 for this seller"
            ],
            "recommendations": [
                "Recommended action 1 for this seller",
                "Recommended action 2 for this seller",
                "Recommended action 3 for this seller"
            ]
        }`;

        const response = await getNvidiaClient().chat.completions.create({
            model: getNvidiaModel("AI insights"),
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.2,
            max_tokens: 700,
            reasoning_effort: "none",
        });

        const result = response.choices[0].message.content;

        const cleanResult = result
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const insightResult = JSON.parse(cleanResult);
        return {
            summary: insightResult.summary || "",
            topCategory: insightResult.topCategory || "",
            customerTrend: insightResult.customerTrend || "",
            dealTrend: insightResult.dealTrend || "",
            discountInsight: insightResult.discountInsight || "",
            riskInsight: insightResult.riskInsight || "",
            foodSafetyInsight: insightResult.foodSafetyInsight || "",
            opportunities: Array.isArray(insightResult.opportunities)
                ? insightResult.opportunities
                : [],
            recommendations: Array.isArray(insightResult.recommendations)
                ? insightResult.recommendations
                : [],
        };
    } catch (error) {
        console.warn(
            "AI insights LLM fallback triggered (returning seller-scoped computed insights):",
            error.message
        );
        return buildFallbackInsights({
            scope,
            businessName,
            businessCategory,
            totalDeals,
            activeDeals,
            totalUsers,
            totalTransactions,
            totalVouchersClaimed,
            totalRedemptions,
            totalRevenue,
            popularCategories,
            topDeals,
            fraudStats: resolvedFraudStats,
            foodSafetyStats,
        });
    }
};

module.exports = {
    generateInsights,
};
