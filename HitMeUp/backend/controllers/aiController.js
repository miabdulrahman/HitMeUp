const mongoose = require("mongoose");
const AIActivityLog = require("../models/AIActivityLog");
const FraudFlag = require("../models/froudFlag");
const FoodFlag = require("../models/FoodFlag");
const Deal = require("../models/Deal");

const { generateDeal } = require("../services/AI/dealCreationService");
const { recommendDeals } = require("../services/AI/recommandationService");
const { detectFraud } = require("../services/AI/fraudDetectionService");
const { detectFoodSafety } = require("../services/AI/foodSafetyService");
const { generateTarget } = require("../services/AI/targettingService");
const { logAIActivity } = require("../services/AI/aiLogService");
const { generateInsights } = require("../services/AI/insightService");
const { getAnalyticService } = require("../services/AI/analyticsService");

const generateDealController = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      productOrService,
      originalPrice,
      targetCustomers,
    } = req.body;

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
      userId: req.user?.id || req.user?._id || null,
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

    try {
      await logAIActivity({
        feature: "deal_generation",
        userId: req.user?.id || req.user?._id || null,
        input: req.body,
        output: {},
        status: "failed",
        errorMessage: error.message,
      });
    } catch (loggingError) {
      console.error("Failed to log AI deal generation error:", loggingError);
    }

    res.status(error.status >= 400 && error.status < 600 ? error.status : 502).json({
      success: false,
      message: error.message || "Failed to generate deal",
    });
  }
};

const recommendDealsController = async (req, res) => {
  try {
    const { userPreferences, availableDeals } = req.body;

    if (!userPreferences) {
      return res.status(400).json({
        success: false,
        message: "userPreferences is required",
      });
    }

    // If availableDeals is empty or not provided, load active marketplace deals from DB
    let dealsPool = Array.isArray(availableDeals) ? availableDeals : [];
    if (dealsPool.length === 0) {
      const activeDbDeals = await Deal.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(15)
        .select("_id title category description discountedPrice originalPrice discountPercentage")
        .lean();

      dealsPool = activeDbDeals.map((d) => ({
        dealId: String(d._id),
        title: d.title,
        category: d.category,
        description: d.description,
        price: d.discountedPrice ?? d.originalPrice,
        discountPercentage: d.discountPercentage,
      }));
    }

    const recommendations = await recommendDeals({
      userPreferences,
      availableDeals: dealsPool,
    });

    await logAIActivity({
      feature: "recommendation",
      userId: req.user?.id || req.user?._id || null,
      input: {
        userPreferences,
        availableDealsCount: dealsPool.length,
      },
      output: recommendations,
      status: "success",
    });

    return res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Recommend Deal Error: ", error);

    await logAIActivity({
      feature: "recommendation",
      userId: req.user?.id || req.user?._id || null,
      input: req.body,
      output: {},
      status: "failed",
      errorMessage: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to generate deal recommendations",
    });
  }
};

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
        message: "activityType and activityData are required",
      });
    }

    const fraudResult = await detectFraud({
      activityType,
      activityData,
    });

    const validUserId =
      req.user.role === "admin" && userId && mongoose.Types.ObjectId.isValid(userId)
        ? userId
        : req.user._id;

    const fraudfalg = await FraudFlag.create({
      userId: validUserId,
      activityType,
      input: activityData,
      isSuspicious: Boolean(fraudResult.isSuspicious),
      riskLevel: ["low", "medium", "high"].includes(fraudResult.riskLevel)
        ? fraudResult.riskLevel
        : "low",
      reason: fraudResult.reason || "Evaluated by AI Fraud Detection",
    });

    await logAIActivity({
      feature: "fraud_detection",
      userId: validUserId,
      input: {
        userId: validUserId,
        activityType,
        activityData,
      },
      output: fraudResult,
      status: "success",
    });

    return res.status(200).json({
      success: true,
      message: "Fraud detection completed",
      result: fraudResult,
      fraudfalg,
    });
  } catch (error) {
    console.error("Fraud Detection Controller Error:", error);
    await logAIActivity({
      feature: "fraud_detection",
      userId: req.user?.id || req.user?._id || null,
      input: req.body,
      output: {},
      status: "failed",
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to detect fraud",
    });
  }
};

const detectFoodSafetyController = async (req, res) => {
  try {
    const { dealId, productName, productDescription } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const foodResult = await detectFoodSafety({
      productName,
      productDescription,
    });

    const validDealId =
      dealId && mongoose.Types.ObjectId.isValid(dealId) ? dealId : undefined;

    const foodFlag = await FoodFlag.create({
      ...(validDealId ? { dealId: validDealId } : {}),
      productName,
      isFood: Boolean(foodResult.isFood),
      isPotentiallyUnsafe: Boolean(foodResult.isPotentiallyUnsafe),
      riskLevel: ["low", "medium", "high", "large"].includes(foodResult.riskLevel)
        ? foodResult.riskLevel
        : "low",
      reason: foodResult.reason || "Evaluated by AI Food Safety",
      recommendations: Array.isArray(foodResult.recommendations)
        ? foodResult.recommendations
        : [],
    });

    await logAIActivity({
      feature: "food_safety",
      userId: req.user?.id || req.user?._id || null,
      input: {
        dealId: validDealId,
        productName,
        productDescription,
      },
      output: foodResult,
      status: "success",
    });

    return res.status(201).json({
      success: true,
      message: "Food safety analysis completed",
      result: foodResult,
      foodFlag,
    });
  } catch (error) {
    console.error("Food safety controller error:", error);
    await logAIActivity({
      feature: "food_safety",
      userId: req.user?.id || req.user?._id || null,
      input: req.body,
      output: {},
      status: "failed",
      errorMessage: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Food safety detection failed",
      error: error.message,
    });
  }
};

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
        success: false,
        message: "Deal title is required",
      });
    }

    const targetingResult = await generateTarget({
      dealTitle,
      dealDescription,
      category,
      price,
      discount,
    });

    await logAIActivity({
      feature: "targeting",
      userId: req.user?.id || req.user?._id || null,
      input: {
        dealTitle,
        dealDescription,
        category,
        price,
        discount,
      },
      output: targetingResult,
      status: "success",
    });

    return res.status(200).json({
      success: true,
      message: "Target audience generated successfully",
      targetting: targetingResult,
    });
  } catch (error) {
    console.error("Targeting controller error:", error);

    await logAIActivity({
      feature: "targeting",
      userId: req.user?.id || req.user?._id || null,
      input: req.body,
      output: {},
      status: "failed",
      errorMessage: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Targeting generation failed",
      error: error.message,
    });
  }
};

const generateInsightsController = async (req, res) => {
  try {
    // Pass req.user so analytics and AI insights are generated specifically for the logged-in seller
    const analytics = await getAnalyticService(req.user);
    const insights = await generateInsights(analytics);

    await logAIActivity({
      feature: "insights",
      userId: req.user?.id || req.user?._id || null,
      input: analytics,
      output: insights,
      status: "success",
    });

    return res.status(200).json({
      success: true,
      message: "AI insights generated successfully",
      analytics,
      insights,
    });
  } catch (error) {
    console.error("Insights controller error:", error);

    await logAIActivity({
      feature: "insights",
      userId: req.user?.id || req.user?._id || null,
      input: {},
      output: {},
      status: "failed",
      errorMessage: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI insights",
    });
  }
};

module.exports = {
  generateDealController,
  recommendDealsController,
  detectFraudController,
  detectFoodSafetyController,
  generateTargetingController,
  generateInsightsController,
};
