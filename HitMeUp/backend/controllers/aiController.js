const { generateDeal } = require("../services/AI/dealCreationService");

const genarateDealController = async (req, res) => {
    try {
        const {
            businessName,
            businessType,
            productOrServices,
            originalPrice,
            targetCustomers,
        } = req.body;

        if (
            !businessName ||
            !businessType ||
            !productOrServices ||
            !originalPrice ||
            !targetCustomers
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required "
            })
        }

        const deal = await {
            businessName,
            businessType,
            productOrServices,
            originalPrice,
            targetCustomers,
        } 
        res.status(200).json({
            success:true,
            message:"AI deal generated successfully",
            deal,
        })
    } catch (error) {
        console.log("Ai controller error", error.message)
        res.status(500).json({
            success:false,
            message:"Failed to generate AI deal",
        })
    }
    module.exports = {
        genarateDealController,
    }
}