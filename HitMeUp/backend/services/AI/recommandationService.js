const OpenAI = require("openai");

const openai = new OpenAI({
    apikey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
});

const recommendDeals = async ({
    userPreferences,
    availableDeals,
}) => {
    try {
        const prompt = `
        You are an AI recommendation assistant for HitMeUp,
        a real-time flash deal marketplace.
        
        recommend the most relavent deals for the user.
        
        User Preferences:
        ${JSON.stringify(userPreferences, null, 2)}
        
        Available Deals:
        ${JSON.stringify(availableDeals, null, 2)}
        
        return ONLY valid JSON:
        
        {
            "recommendations" : [
                {
                    "dealId" : "deal_id",
                    "reason" : "short explanation"
                }
            ]
        }
        Rcommend a maximum of 3 deals.
        `;

        const response = await openai.chat.completions.create({
            model: "meta/llama-3.1-70b-instruct",
            message: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        const result = response.choices[0].message.content;
        return JSON.parse(result);
    } catch (error) {
        console.error("AI Deal Recommendation Error:", error);
        throw error;
    }

    module.exports = {
        recommendDeals,
    }
}