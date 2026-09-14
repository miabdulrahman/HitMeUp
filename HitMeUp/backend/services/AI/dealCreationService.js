const OpenAI = require("openai");

const nvidia = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
});

const generateDeal = async ({
    businessName,
    businessType,
    productOrService,
    originalPrice,
    targetCustomers,
}) => {
    try {
        const prompt = `
You are an AI assistant for HitMeUp, a real-time flash deal marketplace.

Create a professional and attractive flash deal based on the following information:

Business Name: ${businessName}
Business Type: ${businessType}
Product or Service: ${productOrService}
Original Price: ${originalPrice}
Target Customers: ${targetCustomers}

Return ONLY valid JSON in this format:

{
  "title": "Deal title",
  "description": "Short attractive deal description",
  "suggestedDiscount": "Suggested discount percentage",
  "marketingMessage": "Short marketing message",
  "targetCustomer": "Recommended target customer group"
}
`;

        const response = await nvidia.chat.completions.create({
            model: "nvidia/nemotron-3-super-120b-a12b",
            messages: [
                {
                    role: "system",
                    content: "You generate marketing deals for the HitMeUp platform.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const aiResponse = response.choices[0].message.content;
        const cleanResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g,"")
            .trim();

        const deal = JSON.parse(cleanResponse);
        return deal;
    } catch (error) {
        console.error("NVIDIA AI Deal Generation Error:", error.message);
        throw new Error("Failed to generate AI deal");
    }
};

module.exports = {
    generateDeal,
};