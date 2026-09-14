const { recommendDeals,} = require("../services/AI/recommandationService");

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
    recommendDealsController,
}