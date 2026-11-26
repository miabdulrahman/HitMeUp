const rawBaseUrl = import.meta.env.VITE_API_URL || "/api";
const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const API_BASE_URL = trimmedBaseUrl.endsWith("/api")
    ? trimmedBaseUrl
    : `${trimmedBaseUrl}/api`;

const requestAI = async (endpoint, body) => {
    const headers = {
        "Content-Type": "application/json",
    };

    const response = await fetch(`${API_BASE_URL}/ai/${endpoint}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "AI request failed");
    }

    return result;
};

export const generateDeals = (dealData) => requestAI("generate-deal", dealData);

export const recommendDeals = (userPreferences, availableDeals) =>
    requestAI("recommend-deals", { userPreferences, availableDeals });

export const detectFraud = (activityType, activityData, userId) =>
    requestAI("detect-fraud", { activityType, activityData, userId });

export const detectFoodSafety = (productName, productDescription, dealId) =>
    requestAI("food-safety", { productName, productDescription, dealId });

export const generateTargeting = (dealData) =>
    requestAI("targeting", dealData);

export const generateInsights = () => requestAI("insights", {});

export const getAIAnalytics = async () => {
    const response = await fetch(`${API_BASE_URL}/ai/analytics`, { credentials: "include" });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to load AI analytics");
    }

    return result;
};