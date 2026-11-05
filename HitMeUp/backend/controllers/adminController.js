const mongoose = require("mongoose");
const User = require("../models/user");
const Business = require("../models/Business");
const Deal = require("../models/Deal");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Voucher = require("../models/Voucher");
const Review = require("../models/Review");
const AdminActivityLog = require("../models/AdminActivityLog");
const PlatformSettings = require("../models/PlatformSettings");

/**
 * Safely escape user search input before constructing RegExp
 */
const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Resolve effective applicationStatus for legacy Business records
 * created before applicationStatus was introduced.
 */
const resolveApplicationStatus = (business) => {
  if (!business) return "pending";
  if (
    business.applicationStatus &&
    ["pending", "under_review", "approved", "rejected"].includes(
      business.applicationStatus
    )
  ) {
    // If legacy doc defaulted in memory but isVerified is already true, honour approved
    if (business.isVerified && business.applicationStatus === "pending" && !business.reviewedAt) {
      return "approved";
    }
    return business.applicationStatus;
  }
  if (business.isVerified) return "approved";
  if (business.rejectionReason) return "rejected";
  return "pending";
};

/**
 * Build MongoDB filter matching effective application status,
 * accounting for legacy Business documents without stored applicationStatus.
 */
const buildApplicationStatusFilter = (status) => {
  if (!status || status === "all") return null;
  const normalized = status.toLowerCase();
  if (normalized === "pending") {
    return {
      $or: [
        { applicationStatus: "pending", isVerified: { $ne: true } },
        {
          applicationStatus: { $exists: false },
          isVerified: { $ne: true },
          $or: [{ rejectionReason: { $exists: false } }, { rejectionReason: "" }]
        }
      ]
    };
  }
  if (normalized === "under_review") {
    return { applicationStatus: "under_review" };
  }
  if (normalized === "approved") {
    return {
      $or: [{ applicationStatus: "approved" }, { isVerified: true }]
    };
  }
  if (normalized === "rejected") {
    return { applicationStatus: "rejected" };
  }
  return null;
};

/**
 * Record an authenticated admin action to AdminActivityLog
 */
const recordAdminActivity = async ({
  req,
  action,
  targetType,
  targetId = "",
  targetName = "",
  summary,
  metadata = {}
}) => {
  try {
    if (!req?.user?._id) return null;
    return await AdminActivityLog.create({
      actorId: req.user._id,
      actorName: req.user.name || "Administrator",
      actorEmail: req.user.email || "admin@hitmeup.lk",
      action,
      targetType,
      targetId: String(targetId || ""),
      targetName: String(targetName || ""),
      summary,
      metadata
    });
  } catch (err) {
    console.error("Failed to record admin activity:", err.message);
    return null;
  }
};

/**
 * Compute date range window & time-bucket configuration for 7d | 30d | 90d | 12m
 */
const resolveRangeConfig = (range = "30d") => {
  const now = new Date();
  let days = 30;
  let granularity = "day"; // "day" | "week" | "month"

  if (range === "7d") {
    days = 7;
    granularity = "day";
  } else if (range === "90d") {
    days = 90;
    granularity = "week";
  } else if (range === "12m") {
    days = 365;
    granularity = "month";
  } else {
    days = 30;
    granularity = "day";
  }

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

  return { now, days, granularity, startDate, prevStartDate, range };
};

/**
 * Compute honest period comparison only when historical records exist
 */
const computePeriodDelta = (currentVal, previousVal, rangeLabel) => {
  if (previousVal === null || previousVal === undefined) return null;
  if (previousVal === 0 && currentVal === 0) return null;
  if (previousVal === 0 && currentVal > 0) {
    return {
      deltaCount: currentVal,
      deltaPercent: null,
      direction: "up",
      label: `+${currentVal} in last ${rangeLabel}`
    };
  }
  const pct = Math.round(((currentVal - previousVal) / previousVal) * 100);
  return {
    deltaCount: currentVal - previousVal,
    deltaPercent: pct,
    direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
    label: `${pct > 0 ? "+" : ""}${pct}% vs prior ${rangeLabel}`
  };
};

/**
 * Build chronological buckets and populate counts/sums from documents
 */
const buildTimeSeries = ({ startDate, now, granularity, orders, businesses, customers, deals }) => {
  const buckets = [];
  const cursor = new Date(startDate);

  if (granularity === "month") {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= now) {
      const bucketStart = new Date(cursor);
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      buckets.push({
        key: `${bucketStart.getFullYear()}-${String(bucketStart.getMonth() + 1).padStart(2, "0")}`,
        label: bucketStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        start: bucketStart,
        end: next,
        orders: 0,
        paidOrders: 0,
        revenue: 0,
        sellers: 0,
        customers: 0,
        deals: 0
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else if (granularity === "week") {
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= now) {
      const bucketStart = new Date(cursor);
      const next = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
      buckets.push({
        key: bucketStart.toISOString().slice(0, 10),
        label: bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        start: bucketStart,
        end: next,
        orders: 0,
        paidOrders: 0,
        revenue: 0,
        sellers: 0,
        customers: 0,
        deals: 0
      });
      cursor.setTime(next.getTime());
    }
  } else {
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= now) {
      const bucketStart = new Date(cursor);
      const next = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      buckets.push({
        key: bucketStart.toISOString().slice(0, 10),
        label: bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        start: bucketStart,
        end: next,
        orders: 0,
        paidOrders: 0,
        revenue: 0,
        sellers: 0,
        customers: 0,
        deals: 0
      });
      cursor.setTime(next.getTime());
    }
  }

  const findBucket = (dateVal) => {
    if (!dateVal) return null;
    const t = new Date(dateVal).getTime();
    return buckets.find((b) => t >= b.start.getTime() && t < b.end.getTime()) || null;
  };

  orders.forEach((o) => {
    const b = findBucket(o.createdAt);
    if (b) {
      b.orders += 1;
      if (o.status === "PAID" || o.status === "COMPLETED") {
        b.paidOrders += 1;
        b.revenue += Number(o.amount || 0);
      }
    }
  });

  businesses.forEach((biz) => {
    const b = findBucket(biz.createdAt);
    if (b) b.sellers += 1;
  });

  customers.forEach((c) => {
    const b = findBucket(c.createdAt);
    if (b) b.customers += 1;
  });

  deals.forEach((d) => {
    const b = findBucket(d.createdAt);
    if (b) b.deals += 1;
  });

  return buckets.map(({ key, label, orders: o, paidOrders, revenue, sellers, customers: c, deals: d }) => ({
    key,
    label,
    orders: o,
    paidOrders,
    revenue,
    sellers,
    customers: c,
    deals: d
  }));
};

/**
 * Compile recent activity events from AdminActivityLog + real entity timestamps
 */
const buildUnifiedActivityFeed = async (limit = 12) => {
  const [auditLogs, recentBusinesses, recentDeals, recentOrders] = await Promise.all([
    AdminActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean(),
    Business.find()
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Deal.find()
      .populate("businessId", "name")
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    Order.find()
      .populate("customerId", "name email")
      .populate("dealId", "title")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
  ]);

  const events = [];

  auditLogs.forEach((log) => {
    events.push({
      id: `audit-${log._id}`,
      source: "audit",
      action: log.action,
      actor: log.actorName || "Administrator",
      actorEmail: log.actorEmail || "",
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName,
      description: log.summary,
      metadata: log.metadata || {},
      timestamp: log.createdAt
    });
  });

  recentBusinesses.forEach((biz) => {
    events.push({
      id: `biz-${biz._id}`,
      source: "marketplace",
      action: "SELLER_APPLICATION_SUBMITTED",
      actor: biz.ownerId?.name || biz.name,
      actorEmail: biz.ownerId?.email || biz.email || "",
      targetType: "business",
      targetId: String(biz._id),
      targetName: biz.name,
      description: `${biz.name} registered a merchant profile (${biz.category})`,
      metadata: { category: biz.category, status: resolveApplicationStatus(biz) },
      timestamp: biz.createdAt
    });
  });

  recentDeals.forEach((deal) => {
    const isExpired =
      deal.status === "expired" || (deal.endDate && new Date(deal.endDate) <= new Date());
    events.push({
      id: `deal-${deal._id}`,
      source: "marketplace",
      action: isExpired ? "DEAL_EXPIRED" : "DEAL_PUBLISHED",
      actor: deal.businessId?.name || "Merchant",
      actorEmail: "",
      targetType: "deal",
      targetId: String(deal._id),
      targetName: deal.title,
      description: isExpired
        ? `Deal "${deal.title}" reached expiration`
        : `${deal.businessId?.name || "Merchant"} published "${deal.title}" (${deal.discountPercentage}% off)`,
      metadata: { status: isExpired ? "expired" : deal.status },
      timestamp: isExpired ? deal.endDate || deal.updatedAt : deal.createdAt
    });
  });

  recentOrders.forEach((order) => {
    events.push({
      id: `order-${order._id}`,
      source: "marketplace",
      action: "ORDER_PLACED",
      actor: order.customerId?.name || "Customer",
      actorEmail: order.customerId?.email || "",
      targetType: "order",
      targetId: String(order._id),
      targetName: order.orderNumber,
      description: `Order ${order.orderNumber} (${order.status}) for "${order.dealId?.title || "Flash deal"}" — Rs. ${Number(order.amount || 0).toLocaleString()}`,
      metadata: { status: order.status, amount: order.amount, currency: order.currency || "LKR" },
      timestamp: order.createdAt
    });
  });

  return events
    .filter((e) => e.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

// ============================================================================
// 1. OVERVIEW DASHBOARD
// GET /api/admin/overview?range=30d
// ============================================================================
const getOverview = async (req, res) => {
  try {
    const { range = "30d" } = req.query;
    const { now, startDate, prevStartDate } = resolveRangeConfig(range);
    const rangeLabel =
      range === "7d" ? "7 days" : range === "90d" ? "90 days" : range === "12m" ? "12 months" : "30 days";

    // Auto-expire deals whose endDate has elapsed so counts reflect true state
    await Deal.updateMany(
      { status: "active", endDate: { $lte: now } },
      { $set: { status: "expired" } }
    ).exec();

    const [
      allCustomers,
      allBusinesses,
      allDeals,
      allOrders,
      pendingPreviewDocs,
      recentActivity
    ] = await Promise.all([
      User.find({ role: { $in: ["customer", "buyer"] } })
        .select("createdAt isActive")
        .lean(),
      Business.find()
        .populate("ownerId", "name email phone")
        .lean(),
      Deal.find()
        .select("title status startDate endDate createdAt claimedQuantity availableQuantity discountPercentage")
        .lean(),
      Order.find()
        .select("amount currency status createdAt")
        .lean(),
      Business.find(buildApplicationStatusFilter("pending"))
        .populate("ownerId", "name email phone")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      buildUnifiedActivityFeed(10)
    ]);

    const normalizedBusinesses = allBusinesses.map((b) => ({
      ...b,
      effectiveApplicationStatus: resolveApplicationStatus(b)
    }));

    const totalCustomers = allCustomers.length;
    const registeredSellers = normalizedBusinesses.filter(
      (b) => b.effectiveApplicationStatus !== "rejected"
    ).length;
    const approvedSellers = normalizedBusinesses.filter(
      (b) => b.effectiveApplicationStatus === "approved"
    ).length;
    const pendingApplications = normalizedBusinesses.filter(
      (b) =>
        b.effectiveApplicationStatus === "pending" ||
        b.effectiveApplicationStatus === "under_review"
    ).length;

    const activeDeals = allDeals.filter(
      (d) => d.status === "active" && (!d.endDate || new Date(d.endDate) > now)
    ).length;
    const expiredDeals = allDeals.filter((d) => d.status === "expired").length;
    const draftDeals = allDeals.filter((d) => d.status === "draft").length;
    const cancelledDeals = allDeals.filter((d) => d.status === "cancelled").length;

    const totalOrders = allOrders.length;
    const paidOrders = allOrders.filter(
      (o) => o.status === "PAID" || o.status === "COMPLETED"
    );
    const marketplaceRevenue = paidOrders.reduce(
      (sum, o) => sum + Number(o.amount || 0),
      0
    );

    // Period comparisons using real timestamps
    const inCurrent = (d) => d && new Date(d) >= startDate && new Date(d) <= now;
    const inPrev = (d) => d && new Date(d) >= prevStartDate && new Date(d) < startDate;

    const curCustomers = allCustomers.filter((c) => inCurrent(c.createdAt)).length;
    const prevCustomers = allCustomers.filter((c) => inPrev(c.createdAt)).length;

    const curSellers = normalizedBusinesses.filter((b) => inCurrent(b.createdAt)).length;
    const prevSellers = normalizedBusinesses.filter((b) => inPrev(b.createdAt)).length;

    const curOrders = allOrders.filter((o) => inCurrent(o.createdAt)).length;
    const prevOrders = allOrders.filter((o) => inPrev(o.createdAt)).length;

    const curRevenue = paidOrders
      .filter((o) => inCurrent(o.createdAt))
      .reduce((s, o) => s + Number(o.amount || 0), 0);
    const prevRevenue = paidOrders
      .filter((o) => inPrev(o.createdAt))
      .reduce((s, o) => s + Number(o.amount || 0), 0);

    const { granularity } = resolveRangeConfig(range);
    const timeSeries = buildTimeSeries({
      startDate,
      now,
      granularity,
      orders: allOrders,
      businesses: normalizedBusinesses,
      customers: allCustomers,
      deals: allDeals
    });

    const applicationBreakdown = {
      pending: normalizedBusinesses.filter((b) => b.effectiveApplicationStatus === "pending").length,
      under_review: normalizedBusinesses.filter((b) => b.effectiveApplicationStatus === "under_review").length,
      approved: approvedSellers,
      rejected: normalizedBusinesses.filter((b) => b.effectiveApplicationStatus === "rejected").length
    };

    const dealBreakdown = {
      total: allDeals.length,
      active: activeDeals,
      draft: draftDeals,
      expired: expiredDeals,
      cancelled: cancelledDeals,
      totalClaimedVouchers: allDeals.reduce((s, d) => s + Number(d.claimedQuantity || 0), 0)
    };

    const pendingApplicationsPreview = pendingPreviewDocs.map((b) => ({
      _id: b._id,
      name: b.name,
      category: b.category,
      applicantName: b.ownerId?.name || "Merchant owner",
      email: b.email || b.ownerId?.email || "",
      phone: b.phone || b.ownerId?.phone || "",
      city: b.address?.city || "Colombo",
      submittedAt: b.createdAt,
      applicationStatus: resolveApplicationStatus(b),
      isVerified: !!b.isVerified
    }));

    return res.status(200).json({
      success: true,
      range,
      kpis: {
        totalCustomers: {
          value: totalCustomers,
          comparison: computePeriodDelta(curCustomers, prevCustomers, rangeLabel)
        },
        registeredSellers: {
          value: registeredSellers,
          approvedCount: approvedSellers,
          comparison: computePeriodDelta(curSellers, prevSellers, rangeLabel)
        },
        pendingApplications: {
          value: pendingApplications,
          underReviewCount: applicationBreakdown.under_review
        },
        activeDeals: {
          value: activeDeals,
          totalPublished: allDeals.length
        },
        totalOrders: {
          value: totalOrders,
          paidCount: paidOrders.length,
          comparison: computePeriodDelta(curOrders, prevOrders, rangeLabel)
        },
        marketplaceRevenue: {
          value: marketplaceRevenue,
          currency: "LKR",
          paidOrdersCount: paidOrders.length,
          comparison: computePeriodDelta(curRevenue, prevRevenue, rangeLabel)
        }
      },
      charts: {
        timeSeries,
        applicationBreakdown,
        dealBreakdown
      },
      pendingApplicationsPreview,
      recentActivity
    });
  } catch (error) {
    console.error("Admin Overview Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load platform overview",
      error: error.message
    });
  }
};

// ============================================================================
// 2. SELLER APPLICATION MANAGEMENT
// ============================================================================
const getSellerApplications = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      category = "all",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const allDocs = await Business.find()
      .populate("ownerId", "name email phone isActive createdAt avatar")
      .populate("reviewedBy", "name email")
      .lean();

    const normalized = allDocs.map((doc) => {
      const appStatus = resolveApplicationStatus(doc);
      return {
        ...doc,
        applicationStatus: appStatus,
        applicantName: doc.ownerId?.name || "Unknown owner",
        applicantEmail: doc.email || doc.ownerId?.email || ""
      };
    });

    const counts = {
      all: normalized.length,
      pending: normalized.filter((d) => d.applicationStatus === "pending").length,
      under_review: normalized.filter((d) => d.applicationStatus === "under_review").length,
      approved: normalized.filter((d) => d.applicationStatus === "approved").length,
      rejected: normalized.filter((d) => d.applicationStatus === "rejected").length
    };

    let filtered = normalized;

    if (status && status !== "all") {
      filtered = filtered.filter((d) => d.applicationStatus === status);
    }

    if (category && category !== "all") {
      filtered = filtered.filter(
        (d) => (d.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (d) =>
          (d.name || "").toLowerCase().includes(q) ||
          (d.applicantName || "").toLowerCase().includes(q) ||
          (d.applicantEmail || "").toLowerCase().includes(q) ||
          (d.category || "").toLowerCase().includes(q) ||
          (d.address?.city || "").toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      if (!isNaN(fromTime)) {
        filtered = filtered.filter((d) => new Date(d.createdAt).getTime() >= fromTime);
      }
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (!isNaN(endOfDay.getTime())) {
        filtered = filtered.filter(
          (d) => new Date(d.createdAt).getTime() <= endOfDay.getTime()
        );
      }
    }

    const dir = sortOrder === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "") * dir;
      if (sortBy === "applicantName")
        return (a.applicantName || "").localeCompare(b.applicantName || "") * dir;
      if (sortBy === "category")
        return (a.category || "").localeCompare(b.category || "") * dir;
      if (sortBy === "applicationStatus")
        return (a.applicationStatus || "").localeCompare(b.applicationStatus || "") * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      counts,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      applications: paginated
    });
  } catch (error) {
    console.error("Get Seller Applications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve seller applications",
      error: error.message
    });
  }
};

const getSellerApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID" });
    }

    const business = await Business.findById(id)
      .populate("ownerId", "name email phone role isActive createdAt avatar")
      .populate("reviewedBy", "name email")
      .lean();

    if (!business) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const [dealsCount, auditHistory] = await Promise.all([
      Deal.countDocuments({ businessId: business._id }),
      AdminActivityLog.find({ targetType: "business", targetId: String(business._id) })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      application: {
        ...business,
        applicationStatus: resolveApplicationStatus(business),
        dealsCount,
        auditHistory
      }
    });
  } catch (error) {
    console.error("Get Application Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load application details",
      error: error.message
    });
  }
};

const markApplicationUnderReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID" });
    }

    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    business.applicationStatus = "under_review";
    business.reviewedBy = req.user._id;
    business.reviewedAt = new Date();
    await business.save();

    await recordAdminActivity({
      req,
      action: "APPLICATION_UNDER_REVIEW",
      targetType: "business",
      targetId: business._id,
      targetName: business.name,
      summary: `Marked seller application "${business.name}" as under review`
    });

    const populated = await Business.findById(id)
      .populate("ownerId", "name email phone isActive createdAt avatar")
      .populate("reviewedBy", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      message: `${business.name} marked as under review`,
      application: {
        ...populated,
        applicationStatus: "under_review"
      }
    });
  } catch (error) {
    console.error("Mark Under Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update application status",
      error: error.message
    });
  }
};

const approveSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID" });
    }

    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    business.applicationStatus = "approved";
    business.isVerified = true;
    business.status = "active";
    business.rejectionReason = "";
    business.suspensionReason = "";
    business.reviewedBy = req.user._id;
    business.reviewedAt = new Date();
    await business.save();

    await recordAdminActivity({
      req,
      action: "SELLER_APPROVED",
      targetType: "business",
      targetId: business._id,
      targetName: business.name,
      summary: `Approved seller application for "${business.name}"`,
      metadata: { category: business.category }
    });

    const populated = await Business.findById(id)
      .populate("ownerId", "name email phone isActive createdAt avatar")
      .populate("reviewedBy", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      message: `Seller application for "${business.name}" has been approved`,
      application: {
        ...populated,
        applicationStatus: "approved"
      }
    });
  } catch (error) {
    console.error("Approve Application Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve seller application",
      error: error.message
    });
  }
};

const rejectSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID" });
    }

    if (!reason || !String(reason).trim() || String(reason).trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "A clear rejection reason (at least 5 characters) is required"
      });
    }

    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const cleanReason = String(reason).trim();
    business.applicationStatus = "rejected";
    business.isVerified = false;
    business.status = "inactive";
    business.rejectionReason = cleanReason;
    business.reviewedBy = req.user._id;
    business.reviewedAt = new Date();
    await business.save();

    await recordAdminActivity({
      req,
      action: "SELLER_REJECTED",
      targetType: "business",
      targetId: business._id,
      targetName: business.name,
      summary: `Rejected seller application for "${business.name}"`,
      metadata: { reason: cleanReason, category: business.category }
    });

    const populated = await Business.findById(id)
      .populate("ownerId", "name email phone isActive createdAt avatar")
      .populate("reviewedBy", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      message: `Application for "${business.name}" rejected`,
      application: {
        ...populated,
        applicationStatus: "rejected"
      }
    });
  } catch (error) {
    console.error("Reject Application Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject seller application",
      error: error.message
    });
  }
};

// ============================================================================
// 3. SELLER MANAGEMENT
// ============================================================================
const getSellers = async (req, res) => {
  try {
    const {
      search = "",
      category = "all",
      status = "all",
      verification = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const [businesses, dealStats] = await Promise.all([
      Business.find({ applicationStatus: { $ne: "rejected" } })
        .populate("ownerId", "name email phone isActive createdAt avatar")
        .lean(),
      Deal.aggregate([
        {
          $group: {
            _id: "$businessId",
            totalDeals: { $sum: 1 },
            activeDeals: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
            },
            totalClaimed: { $sum: { $ifNull: ["$claimedQuantity", 0] } }
          }
        }
      ])
    ]);

    const statsMap = new Map(dealStats.map((s) => [String(s._id), s]));

    let enriched = businesses.map((b) => {
      const ds = statsMap.get(String(b._id)) || {
        totalDeals: 0,
        activeDeals: 0,
        totalClaimed: 0
      };
      return {
        ...b,
        applicationStatus: resolveApplicationStatus(b),
        ownerName: b.ownerId?.name || "Unknown owner",
        ownerEmail: b.email || b.ownerId?.email || "",
        totalDeals: ds.totalDeals,
        activeDeals: ds.activeDeals,
        totalClaimed: ds.totalClaimed
      };
    });

    const summary = {
      total: enriched.length,
      active: enriched.filter((b) => b.status === "active").length,
      suspended: enriched.filter((b) => b.status === "inactive").length,
      verified: enriched.filter((b) => b.isVerified).length
    };

    if (status && status !== "all") {
      if (status === "suspended") {
        enriched = enriched.filter((b) => b.status === "inactive");
      } else {
        enriched = enriched.filter((b) => b.status === status);
      }
    }

    if (verification === "verified") {
      enriched = enriched.filter((b) => b.isVerified);
    } else if (verification === "unverified") {
      enriched = enriched.filter((b) => !b.isVerified);
    }

    if (category && category !== "all") {
      enriched = enriched.filter(
        (b) => (b.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(
        (b) =>
          (b.name || "").toLowerCase().includes(q) ||
          (b.ownerName || "").toLowerCase().includes(q) ||
          (b.ownerEmail || "").toLowerCase().includes(q) ||
          (b.category || "").toLowerCase().includes(q) ||
          (b.address?.city || "").toLowerCase().includes(q)
      );
    }

    const dir = sortOrder === "asc" ? 1 : -1;
    enriched.sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "") * dir;
      if (sortBy === "totalDeals") return (a.totalDeals - b.totalDeals) * dir;
      if (sortBy === "category")
        return (a.category || "").localeCompare(b.category || "") * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const total = enriched.length;
    const sellers = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      summary,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      sellers
    });
  } catch (error) {
    console.error("Get Sellers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sellers",
      error: error.message
    });
  }
};

const getSellerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid seller ID" });
    }

    const seller = await Business.findById(id)
      .populate("ownerId", "name email phone isActive createdAt avatar")
      .lean();

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const [deals, reviews, auditHistory] = await Promise.all([
      Deal.find({ businessId: seller._id }).sort({ createdAt: -1 }).lean(),
      Review.find({ businessId: seller._id }).lean(),
      AdminActivityLog.find({ targetType: "business", targetId: String(seller._id) })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const dealIds = deals.map((d) => d._id);
    const orders = dealIds.length
      ? await Order.find({ dealId: { $in: dealIds } }).select("amount status").lean()
      : [];

    const paidOrders = orders.filter(
      (o) => o.status === "PAID" || o.status === "COMPLETED"
    );
    const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const averageRating =
      reviews.length > 0
        ? Number(
            (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
          )
        : null;

    return res.status(200).json({
      success: true,
      seller: {
        ...seller,
        applicationStatus: resolveApplicationStatus(seller),
        deals,
        metrics: {
          totalDeals: deals.length,
          activeDeals: deals.filter((d) => d.status === "active").length,
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          totalRevenue,
          reviewCount: reviews.length,
          averageRating
        },
        auditHistory
      }
    });
  } catch (error) {
    console.error("Get Seller Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve seller details",
      error: error.message
    });
  }
};

const suspendSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid seller ID" });
    }

    const seller = await Business.findById(id);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const cleanReason = String(reason).trim() || "Administrative suspension";
    seller.status = "inactive";
    seller.suspensionReason = cleanReason;
    await seller.save();

    await recordAdminActivity({
      req,
      action: "SELLER_SUSPENDED",
      targetType: "business",
      targetId: seller._id,
      targetName: seller.name,
      summary: `Suspended seller "${seller.name}"`,
      metadata: { reason: cleanReason }
    });

    return res.status(200).json({
      success: true,
      message: `Seller "${seller.name}" has been suspended`,
      seller
    });
  } catch (error) {
    console.error("Suspend Seller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to suspend seller",
      error: error.message
    });
  }
};

const reactivateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid seller ID" });
    }

    const seller = await Business.findById(id);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    seller.status = "active";
    seller.suspensionReason = "";
    await seller.save();

    await recordAdminActivity({
      req,
      action: "SELLER_REACTIVATED",
      targetType: "business",
      targetId: seller._id,
      targetName: seller.name,
      summary: `Reactivated seller "${seller.name}"`
    });

    return res.status(200).json({
      success: true,
      message: `Seller "${seller.name}" reactivated`,
      seller
    });
  } catch (error) {
    console.error("Reactivate Seller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reactivate seller",
      error: error.message
    });
  }
};

// ============================================================================
// 4. CUSTOMER MANAGEMENT
// ============================================================================
const getCustomers = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const [users, orderStats] = await Promise.all([
      User.find({ role: { $in: ["customer", "buyer"] } })
        .select("name email phone role isActive avatar createdAt")
        .lean(),
      Order.aggregate([
        {
          $group: {
            _id: "$customerId",
            orderCount: { $sum: 1 },
            paidOrders: {
              $sum: {
                $cond: [{ $in: ["$status", ["PAID", "COMPLETED"]] }, 1, 0]
              }
            },
            totalSpent: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["PAID", "COMPLETED"]] },
                  { $ifNull: ["$amount", 0] },
                  0
                ]
              }
            },
            lastOrderAt: { $max: "$createdAt" }
          }
        }
      ])
    ]);

    const orderMap = new Map(orderStats.map((o) => [String(o._id), o]));

    let customers = users.map((u) => {
      const os = orderMap.get(String(u._id)) || {
        orderCount: 0,
        paidOrders: 0,
        totalSpent: 0,
        lastOrderAt: null
      };
      return {
        ...u,
        orderCount: os.orderCount,
        paidOrders: os.paidOrders,
        totalSpent: os.totalSpent,
        lastOrderAt: os.lastOrderAt
      };
    });

    const summary = {
      total: customers.length,
      active: customers.filter((c) => c.isActive).length,
      deactivated: customers.filter((c) => !c.isActive).length,
      withOrders: customers.filter((c) => c.orderCount > 0).length
    };

    if (status === "active") {
      customers = customers.filter((c) => c.isActive);
    } else if (status === "inactive" || status === "deactivated") {
      customers = customers.filter((c) => !c.isActive);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      customers = customers.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
      );
    }

    const dir = sortOrder === "asc" ? 1 : -1;
    customers.sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "") * dir;
      if (sortBy === "orderCount") return (a.orderCount - b.orderCount) * dir;
      if (sortBy === "totalSpent") return (a.totalSpent - b.totalSpent) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const total = customers.length;
    const paginated = customers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      summary,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      customers: paginated
    });
  } catch (error) {
    console.error("Get Customers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
      error: error.message
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const customer = await User.findOne({
      _id: id,
      role: { $in: ["customer", "buyer"] }
    })
      .select("name email role isActive avatar createdAt")
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const [orders, voucherCount] = await Promise.all([
      Order.find({ customerId: customer._id })
        .populate("dealId", "title discountedPrice category")
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
      Voucher.countDocuments({ customerId: customer._id })
    ]);

    const totalSpent = orders
      .filter((o) => o.status === "PAID" || o.status === "COMPLETED")
      .reduce((s, o) => s + Number(o.amount || 0), 0);

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        orderCount: orders.length,
        voucherCount,
        totalSpent,
        recentOrders: orders
      }
    });
  } catch (error) {
    console.error("Get Customer Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer details",
      error: error.message
    });
  }
};

const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Boolean isActive status is required"
      });
    }

    const customer = await User.findOne({
      _id: id,
      role: { $in: ["customer", "buyer"] }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    customer.isActive = isActive;
    await customer.save();

    await recordAdminActivity({
      req,
      action: isActive ? "CUSTOMER_REACTIVATED" : "CUSTOMER_SUSPENDED",
      targetType: "user",
      targetId: customer._id,
      targetName: customer.name,
      summary: `${isActive ? "Reactivated" : "Deactivated"} customer account "${customer.name}" (${customer.email})`
    });

    return res.status(200).json({
      success: true,
      message: `Customer account ${isActive ? "reactivated" : "deactivated"}`,
      customer: customer.toSafeObject()
    });
  } catch (error) {
    console.error("Update Customer Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update customer account status",
      error: error.message
    });
  }
};

// ============================================================================
// 5. DEAL MANAGEMENT OVERVIEW
// Uses exact Deal model fields: _id, title, businessId, originalPrice,
// discountPercentage, discountedPrice, startDate, endDate, status
// ============================================================================
const getAdminDeals = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      businessId = "all",
      category = "all",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 12
    } = req.query;

    const now = new Date();
    await Deal.updateMany(
      { status: "active", endDate: { $lte: now } },
      { $set: { status: "expired" } }
    ).exec();

    const query = {};
    if (status && status !== "all") {
      query.status = status.toLowerCase();
    }
    if (businessId && businessId !== "all" && mongoose.Types.ObjectId.isValid(businessId)) {
      query.businessId = businessId;
    }
    if (category && category !== "all") {
      query.category = new RegExp(escapeRegex(category), "i");
    }
    if (search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [{ title: rx }, { description: rx }, { category: rx }];
    }
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) query.startDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.startDate.$lte = end;
      }
    }

    const dir = sortOrder === "asc" ? 1 : -1;
    let sortSpec = { createdAt: dir };
    if (sortBy === "discountedPrice") sortSpec = { discountedPrice: dir };
    else if (sortBy === "discountPercentage") sortSpec = { discountPercentage: dir };
    else if (sortBy === "endDate") sortSpec = { endDate: dir };
    else if (sortBy === "title") sortSpec = { title: dir };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [deals, total, statusGroups, businessesList] = await Promise.all([
      Deal.find(query)
        .populate("businessId", "name category address phone email isVerified status")
        .sort(sortSpec)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Deal.countDocuments(query),
      Deal.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Business.find().select("name category").sort({ name: 1 }).lean()
    ]);

    const counts = {
      all: statusGroups.reduce((s, g) => s + g.count, 0),
      active: statusGroups.find((g) => g._id === "active")?.count || 0,
      draft: statusGroups.find((g) => g._id === "draft")?.count || 0,
      expired: statusGroups.find((g) => g._id === "expired")?.count || 0,
      cancelled: statusGroups.find((g) => g._id === "cancelled")?.count || 0
    };

    return res.status(200).json({
      success: true,
      counts,
      businesses: businessesList,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      deals
    });
  } catch (error) {
    console.error("Get Admin Deals Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve deals",
      error: error.message
    });
  }
};

const getAdminDealById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid deal ID" });
    }

    const deal = await Deal.findById(id)
      .populate("businessId", "name category description address phone email openingHours isVerified status ownerId")
      .lean();

    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    const [ordersCount, redeemedVouchers] = await Promise.all([
      Order.countDocuments({ dealId: deal._id }),
      Voucher.countDocuments({ dealId: deal._id, status: "REDEEMED" })
    ]);

    return res.status(200).json({
      success: true,
      deal: {
        ...deal,
        ordersCount,
        redeemedVouchers
      }
    });
  } catch (error) {
    console.error("Get Admin Deal Detail Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve deal details",
      error: error.message
    });
  }
};

const updateAdminDealStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid deal ID" });
    }

    const validStatuses = ["draft", "active", "expired", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: draft, active, expired, cancelled"
      });
    }

    const deal = await Deal.findById(id).populate("businessId", "name");
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    if (status === "active" && deal.endDate && new Date(deal.endDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot set an already past-end-date deal to active"
      });
    }

    const prevStatus = deal.status;
    deal.status = status;
    await deal.save();

    await recordAdminActivity({
      req,
      action: "DEAL_STATUS_UPDATED",
      targetType: "deal",
      targetId: deal._id,
      targetName: deal.title,
      summary: `Updated deal "${deal.title}" status from ${prevStatus} to ${status}`,
      metadata: { previousStatus: prevStatus, newStatus: status, reason }
    });

    return res.status(200).json({
      success: true,
      message: `Deal status updated to ${status}`,
      deal
    });
  } catch (error) {
    console.error("Admin Update Deal Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update deal status",
      error: error.message
    });
  }
};

// ============================================================================
// 6. ORDERS & TRANSACTIONS OVERVIEW (Read-only administrative view)
// ============================================================================
const getAdminOrders = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      paymentStatus = "all",
      dateFrom = "",
      dateTo = "",
      page = 1,
      limit = 12
    } = req.query;

    const allOrders = await Order.find()
      .populate("customerId", "name email")
      .populate({
        path: "dealId",
        select: "title businessId discountedPrice originalPrice discountPercentage",
        populate: {
          path: "businessId",
          select: "name category"
        }
      })
      .populate("paymentId", "status provider transactionId paidAt amount")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = allOrders.map((o) => {
      const derivedPaymentStatus =
        o.paymentId?.status ||
        (o.status === "PAID" || o.status === "COMPLETED"
          ? "SUCCESS"
          : o.status === "FAILED"
          ? "FAILED"
          : "PENDING");

      return {
        _id: o._id,
        orderNumber: o.orderNumber,
        customer: o.customerId
          ? { _id: o.customerId._id, name: o.customerId.name, email: o.customerId.email }
          : { name: "Customer", email: "" },
        deal: o.dealId
          ? { _id: o.dealId._id, title: o.dealId.title }
          : { title: "Deleted or unavailable deal" },
        business: o.dealId?.businessId
          ? {
              _id: o.dealId.businessId._id,
              name: o.dealId.businessId.name,
              category: o.dealId.businessId.category
            }
          : { name: "Merchant", category: "" },
        amount: Number(o.amount || 0),
        currency: o.currency || "LKR",
        status: o.status,
        paymentStatus: derivedPaymentStatus,
        paymentProvider: o.paymentId?.provider || null,
        transactionId: o.paymentId?.transactionId || null,
        paidAt: o.paymentId?.paidAt || null,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt
      };
    });

    const summary = {
      totalOrders: formatted.length,
      paidOrders: formatted.filter((o) => o.status === "PAID" || o.status === "COMPLETED").length,
      pendingOrders: formatted.filter((o) => o.status === "PENDING").length,
      cancelledOrFailed: formatted.filter(
        (o) => o.status === "CANCELLED" || o.status === "FAILED"
      ).length,
      grossPaidVolume: formatted
        .filter((o) => o.status === "PAID" || o.status === "COMPLETED")
        .reduce((s, o) => s + o.amount, 0),
      currency: "LKR"
    };

    let filtered = formatted;

    if (status && status !== "all") {
      filtered = filtered.filter((o) => o.status === status.toUpperCase());
    }
    if (paymentStatus && paymentStatus !== "all") {
      filtered = filtered.filter(
        (o) => o.paymentStatus === paymentStatus.toUpperCase()
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          (o.orderNumber || "").toLowerCase().includes(q) ||
          (o.customer.name || "").toLowerCase().includes(q) ||
          (o.customer.email || "").toLowerCase().includes(q) ||
          (o.business.name || "").toLowerCase().includes(q) ||
          (o.deal.title || "").toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const fromT = new Date(dateFrom).getTime();
      if (!isNaN(fromT)) {
        filtered = filtered.filter((o) => new Date(o.createdAt).getTime() >= fromT);
      }
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(end.getTime())) {
        filtered = filtered.filter((o) => new Date(o.createdAt).getTime() <= end.getTime());
      }
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 12));
    const total = filtered.length;
    const orders = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      summary,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      orders
    });
  } catch (error) {
    console.error("Get Admin Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve marketplace orders",
      error: error.message
    });
  }
};

// ============================================================================
// 7. ANALYTICS PAGE
// ============================================================================
const getAdminAnalytics = async (req, res) => {
  try {
    const { range = "30d" } = req.query;
    const { now, startDate, granularity } = resolveRangeConfig(range);

    const [customers, businesses, deals, orders, vouchers] = await Promise.all([
      User.find({ role: { $in: ["customer", "buyer"] } })
        .select("createdAt isActive")
        .lean(),
      Business.find()
        .select("name category status isVerified applicationStatus createdAt")
        .lean(),
      Deal.find()
        .populate("businessId", "name category")
        .select("title businessId category status discountPercentage discountedPrice claimedQuantity availableQuantity createdAt endDate")
        .lean(),
      Order.find()
        .populate({
          path: "dealId",
          select: "title businessId",
          populate: { path: "businessId", select: "name category" }
        })
        .select("dealId amount status createdAt")
        .lean(),
      Voucher.find().select("dealId status redeemedAt").lean()
    ]);

    const timeSeries = buildTimeSeries({
      startDate,
      now,
      granularity,
      orders,
      businesses,
      customers,
      deals
    });

    // Seller registration & approval breakdown
    const sellerFunnel = {
      total: businesses.length,
      approved: businesses.filter((b) => resolveApplicationStatus(b) === "approved").length,
      pending: businesses.filter((b) => resolveApplicationStatus(b) === "pending").length,
      under_review: businesses.filter((b) => resolveApplicationStatus(b) === "under_review").length,
      rejected: businesses.filter((b) => resolveApplicationStatus(b) === "rejected").length
    };

    // Category distribution of deals
    const categoryMap = new Map();
    deals.forEach((d) => {
      const cat = d.category || "General";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    const dealsByCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Top-performing businesses by actual paid orders & revenue
    const bizPerfMap = new Map();
    businesses.forEach((b) => {
      bizPerfMap.set(String(b._id), {
        _id: b._id,
        name: b.name,
        category: b.category,
        paidOrders: 0,
        revenue: 0,
        activeDeals: 0,
        claimedVouchers: 0
      });
    });

    deals.forEach((d) => {
      const bid = String(d.businessId?._id || d.businessId || "");
      const entry = bizPerfMap.get(bid);
      if (entry) {
        if (d.status === "active") entry.activeDeals += 1;
        entry.claimedVouchers += Number(d.claimedQuantity || 0);
      }
    });

    orders.forEach((o) => {
      if (o.status === "PAID" || o.status === "COMPLETED") {
        const bid = String(o.dealId?.businessId?._id || o.dealId?.businessId || "");
        const entry = bizPerfMap.get(bid);
        if (entry) {
          entry.paidOrders += 1;
          entry.revenue += Number(o.amount || 0);
        }
      }
    });

    const topBusinesses = Array.from(bizPerfMap.values())
      .filter((b) => b.paidOrders > 0 || b.claimedVouchers > 0 || b.activeDeals > 0)
      .sort((a, b) => b.revenue - a.revenue || b.paidOrders - a.paidOrders || b.claimedVouchers - a.claimedVouchers)
      .slice(0, 6);

    // Top-performing deals by actual orders & voucher claims
    const dealOrderMap = new Map();
    orders.forEach((o) => {
      const did = String(o.dealId?._id || o.dealId || "");
      if (!dealOrderMap.has(did)) {
        dealOrderMap.set(did, { orders: 0, paidOrders: 0, revenue: 0 });
      }
      const stat = dealOrderMap.get(did);
      stat.orders += 1;
      if (o.status === "PAID" || o.status === "COMPLETED") {
        stat.paidOrders += 1;
        stat.revenue += Number(o.amount || 0);
      }
    });

    const topDeals = deals
      .map((d) => {
        const st = dealOrderMap.get(String(d._id)) || {
          orders: 0,
          paidOrders: 0,
          revenue: 0
        };
        return {
          _id: d._id,
          title: d.title,
          businessName: d.businessId?.name || "Merchant",
          category: d.category,
          status: d.status,
          discountPercentage: d.discountPercentage,
          discountedPrice: d.discountedPrice,
          claimedQuantity: Number(d.claimedQuantity || 0),
          ordersCount: st.orders,
          paidOrders: st.paidOrders,
          revenue: st.revenue
        };
      })
      .filter((d) => d.paidOrders > 0 || d.claimedQuantity > 0 || d.ordersCount > 0)
      .sort((a, b) => b.revenue - a.revenue || b.claimedQuantity - a.claimedQuantity)
      .slice(0, 6);

    const voucherStats = {
      totalIssued: vouchers.length,
      redeemed: vouchers.filter((v) => v.status === "REDEEMED").length,
      active: vouchers.filter((v) => v.status === "ACTIVE").length,
      expired: vouchers.filter((v) => v.status === "EXPIRED").length
    };

    const paidOrdersTotal = orders.filter(
      (o) => o.status === "PAID" || o.status === "COMPLETED"
    );

    return res.status(200).json({
      success: true,
      range,
      summary: {
        totalCustomers: customers.length,
        newCustomersInRange: customers.filter((c) => new Date(c.createdAt) >= startDate).length,
        totalSellers: businesses.length,
        newSellersInRange: businesses.filter((b) => new Date(b.createdAt) >= startDate).length,
        totalDeals: deals.length,
        activeDeals: deals.filter((d) => d.status === "active").length,
        totalOrders: orders.length,
        paidOrders: paidOrdersTotal.length,
        grossRevenue: paidOrdersTotal.reduce((s, o) => s + Number(o.amount || 0), 0),
        currency: "LKR"
      },
      timeSeries,
      sellerFunnel,
      dealsByCategory,
      voucherStats,
      topBusinesses,
      topDeals
    });
  } catch (error) {
    console.error("Get Admin Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load marketplace analytics",
      error: error.message
    });
  }
};

// ============================================================================
// 8. ACTIVITY LOGS
// ============================================================================
const getActivityLogs = async (req, res) => {
  try {
    const {
      search = "",
      source = "all", // "all" | "audit" | "marketplace"
      action = "all",
      page = 1,
      limit = 15
    } = req.query;

    const [auditLogs, marketplaceFeed] = await Promise.all([
      AdminActivityLog.find().sort({ createdAt: -1 }).limit(200).lean(),
      buildUnifiedActivityFeed(50)
    ]);

    const auditItems = auditLogs.map((log) => ({
      id: `audit-${log._id}`,
      source: "audit",
      action: log.action,
      actor: log.actorName,
      actorEmail: log.actorEmail,
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName,
      description: log.summary,
      metadata: log.metadata || {},
      timestamp: log.createdAt
    }));

    const marketplaceOnly = marketplaceFeed.filter((item) => item.source === "marketplace");

    let combined = [];
    if (source === "audit") combined = auditItems;
    else if (source === "marketplace") combined = marketplaceOnly;
    else {
      combined = [...auditItems, ...marketplaceOnly].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    if (action && action !== "all") {
      combined = combined.filter((item) => item.action === action);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter(
        (item) =>
          (item.actor || "").toLowerCase().includes(q) ||
          (item.actorEmail || "").toLowerCase().includes(q) ||
          (item.targetName || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.action || "").toLowerCase().includes(q)
      );
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 15));
    const total = combined.length;
    const logs = combined.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      success: true,
      counts: {
        auditCount: auditItems.length,
        marketplaceCount: marketplaceOnly.length
      },
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      logs
    });
  } catch (error) {
    console.error("Get Activity Logs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve activity logs",
      error: error.message
    });
  }
};

// ============================================================================
// 9. PLATFORM SETTINGS
// ============================================================================
const getPlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({ key: "global" })
      .populate("updatedBy", "name email")
      .lean();

    if (!settings) {
      const created = await PlatformSettings.create({ key: "global" });
      settings = created.toObject();
    }

    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Get Platform Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve platform settings",
      error: error.message
    });
  }
};

const updatePlatformSettings = async (req, res) => {
  try {
    const allowedFields = [
      "marketplaceName",
      "supportEmail",
      "defaultDiscoveryRadiusKm",
      "requireSellerVerification",
      "autoExpireDeals",
      "maxDealDurationHours",
      "maxDiscountPercentage",
      "notifyOnNewApplication",
      "notifyOnSellerSuspension",
      "notifyOnDealCancellation"
    ];

    const updates = { updatedBy: req.user._id };
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const settings = await PlatformSettings.findOneAndUpdate(
      { key: "global" },
      { $set: updates },
      { upsert: true, new: true, runValidators: true }
    ).populate("updatedBy", "name email");

    await recordAdminActivity({
      req,
      action: "SETTINGS_UPDATED",
      targetType: "settings",
      targetId: "global",
      targetName: "Platform configuration",
      summary: "Updated platform operational settings"
    });

    return res.status(200).json({
      success: true,
      message: "Platform settings saved",
      settings
    });
  } catch (error) {
    console.error("Update Platform Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update platform settings"
    });
  }
};

module.exports = {
  getOverview,
  getSellerApplications,
  getSellerApplicationById,
  markApplicationUnderReview,
  approveSellerApplication,
  rejectSellerApplication,
  getSellers,
  getSellerById,
  suspendSeller,
  reactivateSeller,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getAdminDeals,
  getAdminDealById,
  updateAdminDealStatus,
  getAdminOrders,
  getAdminAnalytics,
  getActivityLogs,
  getPlatformSettings,
  updatePlatformSettings
};

