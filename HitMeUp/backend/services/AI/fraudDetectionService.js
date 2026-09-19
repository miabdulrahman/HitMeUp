const OpenAI = require("openai");
const { modelName } = require("../../models/AIActivityLog");
const { Messages } = require("openai/resources/chat/completions.js");

const openai = new OpenAI({
    apikey: process.env.OpenAI,
    baseURL: "https://integrate.api.nvidia.com/v1",
    timout: 120000,
    maxRetries: 2,
})

const detectFraud = async ({
    activitiType,
    activityData,
}) => {
    try {
        const prompt = `
        You are an AI fraud detection assistant for HitMeUp,
        a real-time flash deal marketplace.

        Analyze the following user activity and determine whether
        the activity is suspicious.
        
        Activity Type:
        ${activitiType}
        
        Activity Data:
        ${JSON.stringify(activityData, null, 2)}
        Analyze:
        - Unusual activity patterns
        - Excessive or repeated actions
        - Suspicious transaction behavior
        - Potential abuse of the platform
        - Other indicators of fraudulent behavior

        Return ONLY valid JSON in this exact format:

        {
            "isSuspicious": true,
            "riskLevel": "low",
            "reason": "Short explanation of why the activity is or is not suspicious"
        }

        riskLevel must be exactly one of:
        "low", "medium", "high"
    `;

        const response = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",
            Messages: [
                {
                    role: "user",
                    content: prompt,
                }
            ],
            temparature: 0.1,
            max_tokens: 300,
            reasoning_effor: "none",
        })

        const result = response.choices[0].message.content;

        return JSON.parse(result);
    } catch (error) {
        console.error("AI Fraud Detection Error:", error);
        throw error;
    }
}

module.exports = {
    detectFraud,
}