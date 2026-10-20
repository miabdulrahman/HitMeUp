const rawBaseUrl = import.meta.env.VITE_API_URL || "/api";
const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const API_BASE_URL = trimmedBaseUrl.endsWith("/api")
    ? trimmedBaseUrl
    : `${trimmedBaseUrl}/api`;

export const generateDeals = async(dealData) => {
    const response = await fetch(
        `${API_BASE_URL}/ai/generate-deal`,
        {
            method:"POST",
            headers:{
                "Content-Type" : "application/json",
            },
            body:JSON.stringify(dealData),
        }
    );

    const result = await response.json();

    if(!response.ok){
        throw new Error(
            result.message || "Failed to generate deal"
        )
    }

    return result;
}