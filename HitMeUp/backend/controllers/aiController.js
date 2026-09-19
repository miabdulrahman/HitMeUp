const AIActivityLog = require("../models/AIActivityLog");
const FraudFlag = require("../models/froudFlag");
const foodFlag = require("../models/FoodFlag");

const { generateDeal } = require("../services/AI/dealCreationService");
const { recommendDeals } = require("../services/AI/recommandationService");
const { detectFraud } = require("../services/AI/fraudDetectionService");
const {detectFoodSafety} = require ("../services/AI/foodSafetyService");



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

const recommendDealsController = async (req, res) => {
  try {
    const { userPreferences, availableDeals, } = req.body;

    if (!userPreferences || !availableDeals) {
      return res.status(400).json({
        message: "userPreferences and availableDeals are required",
      });
    }

    const recommendations = await recommendDeals({
      userPreferences,
      availableDeals,
    });

    await AIActivityLog.create({
      feature: "deal-recommandation",
      input: {
        userPreferences,
        availableDeals,
      },
      output: recommendations,
      status: "success",
    })

    return res.status(200).json({
      success: true,
      recommendations,
    })

  } catch (error) {
    console.log("Reccomment Deal Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate deal recommendations",
    })

  }
}

const detectFraudController = async (req, res) => {
  try {
    const {
      userId,
      activityType,
      activityData,
    } = req.body;

    if (!activityType || !activityData) {
      return res.status(400).json({
        success: false,
        message: "ActivityType and Activitydata is required",
      });
    }

    const fraudResult = await detectFraud({
      activityType,
      activityData,
    });

    const fraudfalg = await FraudFlag.create({
      userId: userId || null,
      activityType,
      input: activityData,
      isSuspicious: fraudResult.isSuspicious,
      riskLevel: fraudResult.riskLevel,
      reason: fraudResult.reason,
    })

    await AIActivityLog.create({
      feature: "fraud-detection",
      userId: userId || null,
      input: {
        activityType,
        activityData,
      },
      output: fraudResult,
      status: "success",
    })

    return res.status(200).json({
      success: true,
      message: "Fraud detection completed",
      result: fraudResult,
      fraudfalg,
    });
  } catch (error) {
    console.error("Fraud Detection Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "faild to detect fraud",
    })
  }

}

const detectFoodSafetyController = async (req, res) =>{
  try{
    const{dealId, productName, productDescription} = req.body;

    if(!productName){
      return res.status(400).json({
        success:false,
        message:"Productname is required",
      })
    }

    const foodResult = await detectFoodSafety({
      productName,
      productDescription,
    })

    const foodFlag = await FoodFlag.create({
      dealId,
      productName,
      isFood : foodResult.isFood,
      isPotentiallyUnsafe: foodResult.isPotentiallyUnsafe,
      riskLevel:foodResult.riskLevel,
      reason:foodResult.reason,
      recommendations:foodResult.recommendations,
    })

    return res.status(201).json({
      success:true,
      message: "Food safety analysis completed",
      result:foodResult,
      foodFlag,
    })
  }catch(error){
    console.error("Food safety controller error:", error);

    return res.status(500).json({
      success:false,
      message:"Food safety detection failed",
      error:error.message,
    })
  }
}
module.exports = {
  generateDealController,
  recommendDealsController,
  detectFraudController,
  detectFoodSafetyController,
};