const AIActivityLog = require("../models/AIActivityLog");
const FraudFlag = require("../models/froudFlag");
const FoodFlag = require("../models/FoodFlag");

const { generateDeal } = require("../services/AI/dealCreationService");
const { recommendDeals } = require("../services/AI/recommandationService");
const { detectFraud } = require("../services/AI/fraudDetectionService");
const { detectFoodSafety } = require("../services/AI/foodSafetyService");
const { generateTarget } = require("../services/AI/targettingService");
const { logAIActivity } = require("../services/AI/aiLogService");

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

    await logAIActivity({
      feature: "deal_generation",
      userId: req.user?.id || null,
      input: req.body,
      output: deal,
      status: "success",
    });

    res.status(200).json({
      success: true,
      message: "Deal generated successfully",
      deal,
    });
  } catch (error) {
    console.error("Generate deal error:", error);

    await logAIActivity({
      feature: "deal_generation",
      userId: req.user?.id || null,
      input,
      output: {},
      status: "failed",
      errorMessage: error.message,
    });

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

    await logAIActivity({
      feature: "recommendation",
      userId: req.user?.id || null,

      input: {
        userPreferences,
        availableDeals,
      },

      output: recommendations,

      status: "success",
    });

    return res.status(200).json({
      success: true,
      recommendations,
    })

  } catch (error) {
    console.log("Reccomment Deal Error: ", error);

    await logAIActivity({
      feature: "recommendation",
      userId: req.user?.id || null,

      input: req.body,

      output: {},

      status: "failed",
      errorMessage: error.message,
    });

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

const detectFoodSafetyController = async (req, res) => {
  try {
    const { dealId, productName, productDescription } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Productname is required",
      })
    }

    const foodResult = await detectFoodSafety({
      productName,
      productDescription,
    })

    const foodFlag = await FoodFlag.create({
      dealId,
      productName,
      isFood: foodResult.isFood,
      isPotentiallyUnsafe: foodResult.isPotentiallyUnsafe,
      riskLevel: foodResult.riskLevel,
      reason: foodResult.reason,
      recommendations: foodResult.recommendations,
    })

    return res.status(201).json({
      success: true,
      message: "Food safety analysis completed",
      result: foodResult,
      foodFlag,
    })
  } catch (error) {
    console.error("Food safety controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Food safety detection failed",
      error: error.message,
    })
  }
}

const generateTargetingController = async (req, res) => {
  try {
    const {
      dealTitle,
      dealDescription,
      category,
      price,
      discount,
    } = req.body;

    if (!dealTitle) {
      return res.status(400).json({
        success: flase,
        message: "Deal title is required",
      })
    }

    const targetingResult = await generateTarget({
      dealTitle,
      dealDescription,
      category,
      price,
      discount,
    })

    return res.status(200).json({
      success: true,
      message: "Target audience generated successfully",
      targetting: targetingResult,
    })
  } catch (error) {
    console.error("Targetting controller error", error);
    return res.status(500).json({
      success: false,
      message: "Targeting generation failed",
      error: error.message,
    })
  }
}



module.exports = {
  generateDealController,
  recommendDealsController,
  detectFraudController,
  detectFoodSafetyController,
  generateTarget,
};