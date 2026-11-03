require("dotenv").config();
const Deals = require("../../models/Deal");
const Business = require("../../models/Business");
const Order = require("../../models/Order");
const Voucher = require("../../models/Voucher");
const Redemption = require("../../models/Redemption");
const FoodFlag = require("../../models/FoodFlag");
const FraudFlag = require("../../models/froudFlag");
const User = require("../../models/user");
const Transaction = require("../../models/Transaction");

/**
 * Compute analytics scoped to the logged-in seller (when a seller/business user is authenticated)
 * or marketplace-wide analytics for admin/anonymous requests.
 */
const getAnalyticService = async (user = null) => {
    try {
        const userId = user?._id || user?.id || null;
        const userRole = String(user?.role || "").toLowerCase();

        // Determine if request is from a logged-in seller / business owner
        let business = null;
        if (userId) {
            if (user?.businessId) {
                business = await Business.findById(user.businessId).lean();
            }
            if (!business) {
                business = await Business.findOne({ ownerId: userId }).lean();
            }
        }

        const isSellerScoped = Boolean(
            business || userRole === "seller" || userRole === "business"
        );

        // If seller-scoped, filter exclusively by this seller's businessId
        // If seller hasn't created a Business document yet, match no deals rather than leaking all users' deals
        const dealFilter = isSellerScoped
            ? { businessId: business?._id || null }
            : {};

        const sellerDeals = await Deals.find(dealFilter)
            .sort({ createdAt: -1 })
            .select(
                "title category discountPercentage originalPrice discountedPrice availableQuantity claimedQuantity status createdAt"
            )
            .lean();

        const dealIds = sellerDeals.map((d) => d._id);
        const totalDeals = sellerDeals.length;
        const activeDeals = sellerDeals.filter((d) => d.status === "active").length;

        const popularCategories = await Deals.aggregate([
            { $match: dealFilter },
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
                },
            },
        ]);

        const topDeals = sellerDeals.slice(0, 10).map((d) => ({
            _id: d._id,
            title: d.title,
            category: d.category,
            discountPercentage: d.discountPercentage,
            discount: d.discountPercentage,
            originalPrice: d.originalPrice,
            discountedPrice: d.discountedPrice,
            price: d.discountedPrice,
            availableQuantity: d.availableQuantity,
            claimedQuantity: d.claimedQuantity || 0,
            status: d.status,
        }));

        let totalUsers = 0;
        let totalTransactions = 0;
        let totalVouchersClaimed = 0;
        let totalRedemptions = 0;
        let totalRevenue = 0;

        if (isSellerScoped) {
            // Seller-scoped orders, vouchers, redemptions, and unique customers
            const [orders, vouchersCount, redemptionsCount] = await Promise.all([
                dealIds.length > 0
                    ? Order.find({ dealId: { $in: dealIds } })
                          .select("customerId amount status")
                          .lean()
                    : [],
                dealIds.length > 0
                    ? Voucher.countDocuments({ dealId: { $in: dealIds } })
                    : 0,
                business?._id
                    ? Redemption.countDocuments({ businessId: business._id })
                    : 0,
            ]);

            const uniqueCustomerIds = new Set(
                orders
                    .map((o) => (o.customerId ? String(o.customerId) : null))
                    .filter(Boolean)
            );

            const claimedFromDeals = sellerDeals.reduce(
                (sum, d) => sum + (Number(d.claimedQuantity) || 0),
                0
            );

            totalVouchersClaimed = Math.max(vouchersCount, claimedFromDeals);
            totalRedemptions = redemptionsCount;
            totalTransactions = Math.max(orders.length, totalVouchersClaimed);
            totalUsers = uniqueCustomerIds.size;
            totalRevenue = orders
                .filter((o) => o.status === "PAID" || o.status === "COMPLETED")
                .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        } else {
            totalUsers = await User.countDocuments();
            const txCount = await Transaction.countDocuments();
            const ordCount = await Order.countDocuments();
            totalTransactions = txCount || ordCount;
            totalVouchersClaimed = await Voucher.countDocuments();
            totalRedemptions = await Redemption.countDocuments();
        }

        // Scope fraud checks and food safety checks to the logged-in seller when seller-scoped
        const fraudFilter = isSellerScoped && userId ? { userId } : {};
        const [totalFraudChecked, suspicious, highRisk] = await Promise.all([
            FraudFlag.countDocuments(fraudFilter),
            FraudFlag.countDocuments({ ...fraudFilter, isSuspicious: true }),
            FraudFlag.countDocuments({ ...fraudFilter, riskLevel: "high" }),
        ]);

        const fraudStats = {
            totalChecks: totalFraudChecked,
            suspicious,
            highRisk,
        };

        const foodFilter = isSellerScoped
            ? { dealId: { $in: dealIds } }
            : {};
        const [totalFoodChecked, potentialUnsafe] = await Promise.all([
            FoodFlag.countDocuments(foodFilter),
            FoodFlag.countDocuments({
                ...foodFilter,
                isPotentiallyUnsafe: true,
            }),
        ]);

        const foodSafetyStats = {
            totalChecked: totalFoodChecked,
            potentialUnsafe,
        };

        return {
            scope: isSellerScoped ? "seller" : "marketplace",
            sellerId: userId ? String(userId) : null,
            businessId: business?._id ? String(business._id) : null,
            businessName: business?.name || user?.businessName || user?.name || null,
            businessCategory: business?.category || null,
            totalDeals,
            activeDeals,
            popularCategories,
            topDeals,
            totalUsers,
            totalTransactions,
            totalVouchersClaimed,
            totalRedemptions,
            totalRevenue,
            fraudStats,
            froudSts: fraudStats, // preserve legacy key for compatibility
            foodSafetyStats,
        };
    } catch (error) {
        console.error("Analytics service error: ", error);
        throw error;
    }
};

module.exports = {
    getAnalyticService,
};
