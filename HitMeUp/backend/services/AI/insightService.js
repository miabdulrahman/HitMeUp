require("dotenv").config();
const OpenAI = require("openai");

const Nvidia = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
})

const generateInsights = async ({
    totalDeals,
    totalUsers,
    totalTransactions,
    popularCategories,
    topDeals,
    fraudStats,
    foodSafetyStats,
}) => {
    try {
        const prompt = `
        You are an AI business analytics assistant for HitMeUp,
        a real-time flash deal marketplace.

        Analyze the following marketplace data and generate useful
        business insights.

        Marketplace Data:

        Total Deals:
        ${totalDeals ?? 0}

        Total Users:
        ${totalUsers ?? 0}

        Total Transactions:
        ${totalTransactions ?? 0}

        Popular Categories:
        ${JSON.stringify(popularCategories ?? [])}

        Top Deals:
        ${JSON.stringify(topDeals ?? [])}

        Fraud Statistics:
        ${JSON.stringify(fraudStats ?? {})}

        Food Safety Statistics:
        ${JSON.stringify(foodSafetyStats ?? {})}

        Analyze:

        - Most popular deal categories
        - Customer behavior and trends
        - Deal performance
        - Discount trends
        - Fraud/risk patterns
        - Food safety patterns
        - Business opportunities
        - Recommended actions

        Return ONLY valid JSON in this exact format:

        {
            "summary": "Short overall marketplace summary",
            "topCategory": "Most popular category",
            "customerTrend": "Important customer behavior trend",
            "dealTrend": "Important deal performance trend",
            "discountInsight": "Insight about discounts",
            "riskInsight": "Insight about fraud or risk",
            "foodSafetyInsight": "Insight about food safety",
            "opportunities": [
                "Business opportunity 1",
                "Business opportunity 2"
            ],
            "recommendations": [
                "Recommended action 1",
                "Recommended action 2",
                "Recommended action 3"
            ]
        }`;

        const response = await Nvidia.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",
            messages: [{
                role: "user",
                content: prompt,
            }],
            temperature: 0.2,
            max_tokens: 700,
            reasoning_effort: "none",
        })

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
            opportunities: insightResult.opportunities || [],
            recommendations: insightResult.recommendations || [],
        }
    } catch (error) {
        console.error("insights service error ", error);
        throw error;
    }
}

module.exports = {
    generateInsights,
}