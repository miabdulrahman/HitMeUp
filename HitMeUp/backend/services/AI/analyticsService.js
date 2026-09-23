const Deals = require("../../models/Deal");
const FoodFlag = require("../../models/FoodFlag");
const froud = require("../../models/froudFlag");

const getAnalyticService = async () => {
    try {
        const totalDeals = await Deals.countDocuments();

        const popularCategories = await Deals.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    count: -1,
                },

            },
            {
                $limit: 10,
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    count: 1,
                }
            }
        ]);
        const topDeals = await Deals.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title category discount price");


        const totalFroudChecked = await froud.countDocuments();
        const suspicious = await froud.countDocuments({
            isSuspicious: true,
        });

        const highRisk = await froud.countDocuments({
            riskLevel: "high",
        });

        const froudSts = {
            totalChecks: totalFroudChecked,
            suspicious,
            highRisk,
        }

        const totalFoodChecked = await FoodFlag.countDocuments();
        const potentialUnsafe = await FoodFlag.countDocuments({
            isPotentiallyUnsafe: true,
        });

        const foodSafetyStats = {
            totalChecked: totalFoodChecked,
            potentialUnsafe,
        }

        return {
            totalDeals,
            popularCategories,
            topDeals,
            froudSts,
            foodSafetyStats,
        }

    } catch (error) {
        console.error("Analytics service error, ", error);
        throw error;
    }
}