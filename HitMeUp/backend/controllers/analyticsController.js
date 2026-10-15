const {getAnalyticService} = require("../services/AI/analyticsService");

const getAnalyticsController = async (req, res) => {
    try{
        const analytics = await getAnalyticService();

        return res.status(200).json({
            success:true,
            message:"Analytics received Successfully",
            analytics,
        })
    }catch(error){
        console.error("Failed retrived the analytics, ",error);

        return res.status(500).json({
            success:true,
            message:"Analytics retrive failed",
        })
    }
}

module.exports = {
    getAnalyticsController,
}