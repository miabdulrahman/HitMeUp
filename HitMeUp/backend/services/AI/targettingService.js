const OpenAI = require("openai");

const Nvidia = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
})

const generateTarget = async ({
    dealTitle,
    dealDescription,
    category,
    price,
    discount,
}) => {
    try {
        const prompt = `
        You are an AI customer targeting assistant for HitMeUp,
        a real-time flash deal marketplace.

        Analyze the following deal and identify the most relevant
        customer segments who are likely to be interested in it.

        Deal Title:
        ${dealTitle}

        Deal Description:
        ${dealDescription || "No description provided"}

        Category:
        ${category || "Unknown"}

        Price:
        ${price || "Unknown"}

        Discount:
        ${discount || "Unknown"}

        Analyze:
        - Suitable age groups
        - Customer interests
        - Likely customer segments
        - Shopping preferences
        - Potential customer motivation

        Return ONLY valid JSON in this exact format:

        {
            "targetAudience": [
                "Students",
                "Young adults"
            ],
            "interests": [
                "Food",
                "Discounts"
            ],
            "customerType": [
                "Budget-conscious customers",
                "Food lovers"
            ],
            "reason": "Short explanation of why these customers are suitable"
        }`;

        const response = Nvidia.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",

            messages: [{
                role: "user",
                content: prompt,
            }],

            temperature: 0.2,
            max_tokens: 400,
            reasoning_effort: "none",
        });

        const result = response.choices[0].message.content;

        const cleanResult = result
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const targetingResult = JSON.parse(cleanResult);
        return {
            targetAudience: targetingResult.targetAudience || [],
            interests: targetingResult.interests || [],
            customerType: targetingResult.customerType || [],
            reason: targetingResult.reason || "",
        }
    } catch (error) {
        console.error("failed to generate target", error);
        throw error;
    }
}

module.exports = {
    generateTarget,
}