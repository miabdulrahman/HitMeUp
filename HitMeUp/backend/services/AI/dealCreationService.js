const { getNvidiaClient, getNvidiaModel } = require("./nvidiaClient");

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

        const response = await getNvidiaClient().chat.completions.create({
            model: getNvidiaModel("AI deal generation"),
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
            max_tokens: 2000,
            reasoning_effort: "low",
        });

        const aiResponse = response.choices?.[0]?.message?.content;
        if (typeof aiResponse !== "string" || !aiResponse.trim()) {
            throw new Error("NVIDIA returned an empty AI response");
        }

        const cleanResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g,"")
            .trim();

        const deal = JSON.parse(cleanResponse);
        return deal;
    } catch (error) {
        console.error("NVIDIA AI Deal Generation Error:", error.message);
        const aiError = new Error("Failed to generate AI deal");
        aiError.status = error.status || error.statusCode || 502;
        aiError.cause = error;
        throw aiError;
    }
};

module.exports = {
    generateDeal,
};