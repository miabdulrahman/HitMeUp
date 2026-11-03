const { getAnalyticService } = require("../services/AI/analyticsService");

const getAnalyticsController = async (req, res) => {
    try {
        // Scope analytics to the logged-in user (seller's own store & deals)
        const analytics = await getAnalyticService(req.user);

        return res.status(200).json({
            success: true,
            message: "Analytics received successfully",
            analytics,
        });
    } catch (error) {
        console.error("Failed to retrieve analytics:", error);

        return res.status(500).json({
            success: false,
            message: "Analytics retrieval failed",
        });
    }
};

module.exports = {
    getAnalyticsController,
};
