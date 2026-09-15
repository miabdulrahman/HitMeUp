const { generateDeal } = require("../services/AI/dealCreationService");

const generateDealController = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      productOrService,
      originalPrice,
      targetCustomers,
    } = req.body;

    console.log(req.body)
    if (
      !businessName ||
      !businessType ||
      !productOrService ||
      !originalPrice ||
      !targetCustomers
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const deal = await generateDeal({
      businessName,
      businessType,
      productOrService,
      originalPrice,
      targetCustomers,
    });

    res.status(200).json({
      success: true,
      message: "Deal generated successfully",
      deal,
    });
  } catch (error) {
    console.error("Generate deal error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate deal",
    });
  }
};

const recommendDealsController = async (req , res) => {
    try {
        const {userPreferences, availableDeals,} = req.body;

        if(!userPreferences || !availableDeals){
            return res.status(400).json({
                message: "userPreferences and availableDeals are required",
            });
        }

        const recommendations = await recommendDeals({
            userPreferences,
            availableDeals,
        });

        return res.status(200).json({
            success:true,
            recommendations,
        })

    }catch(error){
        console.log("Reccomment Deal Error: ", error);

        return res.status(500).json({
            success:false,
            message:"Failed to generate deal recommendations",
        })

    }
}

module.exports = {
  generateDealController,
  recommendDealsController,
};