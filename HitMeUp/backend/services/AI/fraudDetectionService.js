const { getNvidiaClient, getNvidiaModel } = require("./nvidiaClient");

const detectFraud = async ({
    activityType,
    activityData,
}) => {
    try {
        const prompt = `
        You are an AI fraud detection assistant for HitMeUp,
        a real-time flash deal marketplace.

        Analyze the following user activity and determine whether
        the activity is suspicious.
        
        Activity Type:
        ${activityType}
        
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

        const response = await getNvidiaClient().chat.completions.create({
            model: getNvidiaModel("fraud detection"),
            messages: [
                {
                    role: "user",
                    content: prompt,
                }
            ],
            temperature: 0.1,
            max_tokens: 300,
            reasoning_effort: "none",
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