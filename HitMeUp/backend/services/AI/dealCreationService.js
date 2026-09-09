const openAI = require("openai")

const openai = new openAI({
    apikey: process.env.OPENAI_API_KEY,
})

const generateDeal = async ({
    businessName,
    businessType,
    productOrServices,
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
        }`

        const response = await openai.response.create({
            model:"gpt-5.6-luna",
            input:prompt,
        })
        return response.output_text;
    } catch (error) {
        console.log("AI Deal Generation Error", error.message)
        throw new Error("failed to generate AI deal")
    }
};

module.exports = {
    generateDeal,
}