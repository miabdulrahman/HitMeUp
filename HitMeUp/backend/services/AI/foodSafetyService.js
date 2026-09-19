const OpenAI = require("openai");
const { Content } = require("openai/resources/skills/content.js");

const Nvidia = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
})

const detectFoodSafety = async ({
    productName,
    productDescription,
}) => {
    try {
        const prompt = `
        You are an AI food safety assistant for HitMeUp,
        a real-time flash deal marketplace.

        Analyze the following product and determine whether
        it is a food product and whether there are potential
        food safety concerns.

        Product Name:
        ${productName}

        Product Description:
        ${productDescription || "No description provided"}

        Analyze:
        - Whether the product is food
        - Possible food safety concerns
        - Spoilage or contamination indicators
        - Unsafe handling or storage concerns
        - Potential allergens or ingredients that may require attention
        - Other relevant safety indicators

        Return ONLY valid JSON in this exact format:

        {
            "isFood": true,
            "isPotentiallyUnsafe": false,
            "riskLevel": "low",
            "reason": "Short explanation",
            "recommendations": [
                "Recommendation 1",
                "Recommendation 2"
            ]
        }

        riskLevel must be exactly one of:
        "low", "medium", "high"
    `;

        const response = await Nvidia.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",

            messages: [
                role = "user",
                Content = prompt,
            ],

            temperature: 0.1,
            max_tokens: 400,
            reasoning_effort: "none",
        })

        const result = response.choices[0].message.content;
        const cleanResult = result
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const foodResult = JSON.parse(cleanResult);
        return {
            isFood: foodResult.isFood,
            isPotentiallyUnsafe: foodResult.isPotentiallyUnsafe,
            riskLevel: foodResult.riskLevel,
            reason: foodResult.reason,
            recommendations: foodResult.recommendations || [],
        }

    } catch (error) {
        console.log("Food safety detection failed");
        throw error;
    }
}

module.exports = {
    detectFoodSafety,
}