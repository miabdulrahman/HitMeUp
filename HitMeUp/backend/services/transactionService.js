const mongoose = require("mongoose");
const GatewayTransaction = require("../models/GatewayTransaction");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Deal = require("../models/Deal");
const Business = require("../models/Business");

/**
 * Record immutable gateway transaction record
 */
async function recordTransaction(data, session = null) {
  const transactionData = {
    transactionId: data.transactionId,
    paymentReference: data.paymentReference,
    orderId: data.orderId,
    customerId: data.customerId,
    merchantName: data.merchantName || "HitMeUp Merchant Partner",
    amount: Number(data.amount),
    currency: data.currency || "LKR",
    paymentMethod: data.paymentMethod || "CARD",
    transactionStatus: data.transactionStatus,
    responseCode: data.responseCode,
    responseMessage: data.responseMessage,
    processingTimeMs: data.processingTimeMs || 0,
    simulatedResponseType: data.simulatedResponseType || "SUCCESS",
    signature: data.signature,
    cardBrand: data.cardBrand || null,
    cardLast4: data.cardLast4 || null,
    idempotencyKey: data.idempotencyKey || null
  };

  if (session) {
    const created = await GatewayTransaction.create([transactionData], { session });
    return created[0];
  }
  return await GatewayTransaction.create(transactionData);
}

/**
 * Build role-based scope filter for orders/payments
 */
async function getRoleFilter(user) {
  if (!user) return { _id: null }; // block if not authenticated

  if (user.role === "admin") {
    return {}; // Full marketplace visibility
  }

  if (user.role === "business" || user.role === "seller") {
    let businessId = user.businessId;
    if (!businessId) {
      const biz = await Business.findOne({ ownerId: user._id });
      if (biz) businessId = biz._id;
    }
    if (!businessId) {
      return { _id: null }; // No business profile linked
    }

    const businessDeals = await Deal.find({ businessId }, "_id");
    const dealIds = businessDeals.map((d) => d._id);
    const businessOrders = await Order.find({ dealId: { $in: dealIds } }, "_id");
    const orderIds = businessOrders.map((o) => o._id);

    return { orderId: { $in: orderIds } };
  }

  // Customer role: strictly own records
  return { customerId: user._id };
}

/**
 * Query transactions with pagination, filters, and role-scoping
 */
async function getTransactions({
  user,
  page = 1,
  limit = 10,
  status,
  method,
  search,
  startDate,
  endDate
}) {
  const roleFilter = await getRoleFilter(user);
  const filter = { ...roleFilter };

  if (status && status !== "ALL") {
    filter.transactionStatus = status.toUpperCase();
  }

  if (method && method !== "ALL") {
    filter.paymentMethod = method.toUpperCase();
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { transactionId: regex },
      { paymentReference: regex },
      { merchantName: regex }
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const parsedLimit = Math.min(100, Math.max(1, Number(limit)));

  const [transactions, totalCount] = await Promise.all([
    GatewayTransaction.find(filter)
      .populate("customerId", "name email")
      .populate("orderId", "orderNumber dealSnapshot")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    GatewayTransaction.countDocuments(filter)
  ]);

  return {
    transactions,
    totalCount,
    totalPages: Math.ceil(totalCount / parsedLimit),
    currentPage: Number(page),
    limit: parsedLimit
  };
}

/**
 * Compute real-time dashboard analytics via MongoDB aggregation pipelines
 */
async function getDashboardSummary(user) {
  const roleFilter = await getRoleFilter(user);

  // Status metrics aggregation on Payment collection
  const statusPipeline = [
    { $match: roleFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$amount" }
      }
    }
  ];

  // Method distribution aggregation
  const methodPipeline = [
    { $match: roleFilter },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        totalValue: { $sum: "$amount" }
      }
    }
  ];

  // Timeline / Daily volume aggregation (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const timelinePipeline = [
    {
      $match: {
        ...roleFilter,
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        totalTransactions: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] }
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "SUCCESS"] }, "$amount", 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const [statusResults, methodResults, timelineResults] = await Promise.all([
    Payment.aggregate(statusPipeline),
    Payment.aggregate(methodPipeline),
    Payment.aggregate(timelinePipeline)
  ]);

  let totalTransactions = 0;
  let successfulTransactions = 0;
  let failedTransactions = 0;
  let pendingTransactions = 0;
  let refundedTransactions = 0;
  let totalVolume = 0; // Total value of successful transactions

  statusResults.forEach((item) => {
    totalTransactions += item.count;
    if (item._id === "SUCCESS") {
      successfulTransactions = item.count;
      totalVolume = item.totalValue;
    } else if (item._id === "FAILED") {
      failedTransactions = item.count;
    } else if (item._id === "PENDING" || item._id === "PROCESSING") {
      pendingTransactions += item.count;
    } else if (item._id === "REFUNDED") {
      refundedTransactions = item.count;
    }
  });

  const successRate =
    totalTransactions > 0
      ? Number(((successfulTransactions / totalTransactions) * 100).toFixed(1))
      : 0;

  return {
    metrics: {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      refundedTransactions,
      totalVolume,
      successRate,
      currency: "LKR"
    },
    methodDistribution: methodResults.map((m) => ({
      method: m._id || "CARD",
      count: m.count,
      totalValue: m.totalValue
    })),
    timeline: timelineResults.map((t) => ({
      date: t._id,
      total: t.totalTransactions,
      success: t.successCount,
      failed: t.failedCount,
      revenue: t.revenue
    }))
  };
}

module.exports = {
  recordTransaction,
  getRoleFilter,
  getTransactions,
  getDashboardSummary
};
