import { apiRequest } from "./api";

/**
 * ============================================================================
 * HITMEUP PLATFORM ADMIN API SERVICE LAYER
 * ============================================================================
 * Expected Backend Contract (all endpoints require Bearer JWT with role === "admin"):
 * - GET    /api/admin/overview?range=7d|30d|90d|12m
 * - GET    /api/admin/applications?search=&status=&category=&dateFrom=&dateTo=&sortBy=&sortOrder=&page=&limit=
 * - GET    /api/admin/applications/:id
 * - PATCH  /api/admin/applications/:id/review
 * - PATCH  /api/admin/applications/:id/approve
 * - PATCH  /api/admin/applications/:id/reject          { reason: string }
 * - GET    /api/admin/sellers?search=&category=&status=&verification=&sortBy=&sortOrder=&page=&limit=
 * - GET    /api/admin/sellers/:id
 * - PATCH  /api/admin/sellers/:id/suspend              { reason?: string }
 * - PATCH  /api/admin/sellers/:id/reactivate
 * - GET    /api/admin/customers?search=&status=&sortBy=&sortOrder=&page=&limit=
 * - GET    /api/admin/customers/:id
 * - PATCH  /api/admin/customers/:id/status             { isActive: boolean }
 * - GET    /api/admin/deals?search=&status=&businessId=&category=&dateFrom=&dateTo=&sortBy=&sortOrder=&page=&limit=
 * - GET    /api/admin/deals/:id
 * - PATCH  /api/admin/deals/:id/status                 { status: "active"|"cancelled"|"expired"|"draft", reason?: string }
 * - GET    /api/admin/orders?search=&status=&paymentStatus=&dateFrom=&dateTo=&page=&limit=
 * - GET    /api/admin/analytics?range=7d|30d|90d|12m
 * - GET    /api/admin/activity-logs?search=&source=&action=&page=&limit=
 * - GET    /api/admin/settings
 * - PUT    /api/admin/settings
 * ============================================================================
 */

const buildQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "all") {
      sp.append(key, String(val));
    } else if (val === "all" && (key === "status" || key === "source")) {
      sp.append(key, "all");
    }
  });
  const str = sp.toString();
  return str ? `?${str}` : "";
};

// ----------------------------------------------------------------------------
// Explicitly Labelled Development Demo Dataset (ONLY used when Demo Mode ON)
// ----------------------------------------------------------------------------
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const hoursFromNow = (h) => new Date(Date.now() + h * 3600000).toISOString();

const createInitialDemoStore = () => ({
  businesses: [
    {
      _id: "demo-biz-101",
      name: "Ceylon Crust & Roastery",
      category: "Cafe",
      description: "Small-batch specialty arabica roastery and sourdough bakery in Bambalapitiya.",
      phone: "+94 77 412 8890",
      email: "hello@ceyloncrust.lk",
      address: { street: "42 Galle Road", city: "Colombo 04", country: "Sri Lanka" },
      location: { type: "Point", coordinates: [79.8562, 6.8935] },
      openingHours: "07:30 AM - 08:30 PM",
      isVerified: false,
      status: "active",
      applicationStatus: "pending",
      rejectionReason: "",
      suspensionReason: "",
      ownerId: {
        _id: "demo-usr-201",
        name: "Kasun Perera",
        email: "kasun@ceyloncrust.lk",
        phone: "+94 77 412 8890",
        isActive: true,
        createdAt: daysAgo(2)
      },
      createdAt: daysAgo(2)
    },
    {
      _id: "demo-biz-102",
      name: "Verve Botanics & Spa",
      category: "Health & Beauty",
      description: "Ayurvedic urban wellness studio offering weekday off-peak treatment passes.",
      phone: "+94 71 908 3312",
      email: "bookings@vervespa.lk",
      address: { street: "18 Park Street", city: "Colombo 02", country: "Sri Lanka" },
      location: { type: "Point", coordinates: [79.8578, 6.9167] },
      openingHours: "10:00 AM - 08:00 PM",
      isVerified: false,
      status: "active",
      applicationStatus: "under_review",
      rejectionReason: "",
      suspensionReason: "",
      ownerId: {
        _id: "demo-usr-202",
        name: "Nadeesha Fernando",
        email: "nadeesha@vervespa.lk",
        phone: "+94 71 908 3312",
        isActive: true,
        createdAt: daysAgo(4)
      },
      createdAt: daysAgo(4)
    },
    {
      _id: "demo-biz-103",
      name: "Galle Face Hoppers Kitchen",
      category: "Restaurant",
      description: "Contemporary Sri Lankan dining counter featuring evening hopper platters.",
      phone: "+94 76 225 4910",
      email: "ops@hopperskitchen.lk",
      address: { street: "105 Marine Drive", city: "Colombo 03", country: "Sri Lanka" },
      location: { type: "Point", coordinates: [79.8489, 6.9061] },
      openingHours: "11:30 AM - 10:30 PM",
      isVerified: true,
      status: "active",
      applicationStatus: "approved",
      rejectionReason: "",
      suspensionReason: "",
      reviewedAt: daysAgo(12),
      ownerId: {
        _id: "demo-usr-203",
        name: "Roshan Jayawardena",
        email: "roshan@hopperskitchen.lk",
        phone: "+94 76 225 4910",
        isActive: true,
        createdAt: daysAgo(15)
      },
      createdAt: daysAgo(15)
    },
    {
      _id: "demo-biz-104",
      name: "PixelForge Gaming Lounge",
      category: "Entertainment",
      description: "High-refresh PC & console co-op lounge near Nugegoda junction.",
      phone: "+94 77 883 1029",
      email: "desk@pixelforge.lk",
      address: { street: "210 High Level Road", city: "Nugegoda", country: "Sri Lanka" },
      location: { type: "Point", coordinates: [79.8897, 6.8729] },
      openingHours: "10:00 AM - 11:00 PM",
      isVerified: true,
      status: "active",
      applicationStatus: "approved",
      rejectionReason: "",
      suspensionReason: "",
      reviewedAt: daysAgo(18),
      ownerId: {
        _id: "demo-usr-204",
        name: "Dilshan Silva",
        email: "dilshan@pixelforge.lk",
        phone: "+94 77 883 1029",
        isActive: true,
        createdAt: daysAgo(20)
      },
      createdAt: daysAgo(20)
    },
    {
      _id: "demo-biz-105",
      name: "QuickByte Accessories",
      category: "Electronics",
      description: "Unverified reseller stall with incomplete street address.",
      phone: "+94 75 119 4020",
      email: "sales@quickbyte.lk",
      address: { street: "", city: "Pettah", country: "Sri Lanka" },
      location: { type: "Point", coordinates: [79.8522, 6.9364] },
      openingHours: "09:00 AM - 07:00 PM",
      isVerified: false,
      status: "inactive",
      applicationStatus: "rejected",
      rejectionReason: "Incomplete storefront street address and unverifiable contact telephone.",
      suspensionReason: "",
      reviewedAt: daysAgo(6),
      ownerId: {
        _id: "demo-usr-205",
        name: "Imran Majeed",
        email: "imran@quickbyte.lk",
        phone: "+94 75 119 4020",
        isActive: true,
        createdAt: daysAgo(8)
      },
      createdAt: daysAgo(8)
    }
  ],
  customers: [
    {
      _id: "demo-cust-301",
      name: "Amaya Wijesinghe",
      email: "amaya.w@gmail.com",
      role: "customer",
      isActive: true,
      orderCount: 4,
      paidOrders: 4,
      totalSpent: 9850,
      lastOrderAt: daysAgo(1),
      createdAt: daysAgo(24)
    },
    {
      _id: "demo-cust-302",
      name: "Tharindu Bandara",
      email: "tharindu.b@outlook.com",
      role: "customer",
      isActive: true,
      orderCount: 2,
      paidOrders: 2,
      totalSpent: 4600,
      lastOrderAt: daysAgo(3),
      createdAt: daysAgo(16)
    },
    {
      _id: "demo-cust-303",
      name: "Shenali De Mel",
      email: "shenali.dm@gmail.com",
      role: "customer",
      isActive: true,
      orderCount: 1,
      paidOrders: 0,
      totalSpent: 0,
      lastOrderAt: daysAgo(5),
      createdAt: daysAgo(9)
    }
  ],
  deals: [
    {
      _id: "demo-deal-401",
      title: "Evening Hopper Platter & Iced Tea for Two",
      description: "Includes 4 plain hoppers, 2 egg hoppers, chicken curry, seeni sambol and 2 house iced teas.",
      businessId: { _id: "demo-biz-103", name: "Galle Face Hoppers Kitchen", category: "Restaurant", isVerified: true, status: "active", address: { city: "Colombo 03" } },
      category: "Food",
      originalPrice: 3800,
      discountPercentage: 35,
      discountedPrice: 2470,
      startDate: daysAgo(1),
      endDate: hoursFromNow(18),
      status: "active",
      availableQuantity: 30,
      claimedQuantity: 12,
      createdAt: daysAgo(1)
    },
    {
      _id: "demo-deal-402",
      title: "2-Hour Co-op Sim Racing & Ginger Beer Pass",
      description: "Dual rig session during afternoon off-peak hours.",
      businessId: { _id: "demo-biz-104", name: "PixelForge Gaming Lounge", category: "Entertainment", isVerified: true, status: "active", address: { city: "Nugegoda" } },
      category: "Games",
      originalPrice: 3200,
      discountPercentage: 40,
      discountedPrice: 1920,
      startDate: daysAgo(2),
      endDate: hoursFromNow(36),
      status: "active",
      availableQuantity: 25,
      claimedQuantity: 9,
      createdAt: daysAgo(2)
    },
    {
      _id: "demo-deal-403",
      title: "Artisan Pour-Over & Almond Croissant",
      description: "Morning counter flash pass.",
      businessId: { _id: "demo-biz-101", name: "Ceylon Crust & Roastery", category: "Cafe", isVerified: false, status: "active", address: { city: "Colombo 04" } },
      category: "Food",
      originalPrice: 1900,
      discountPercentage: 30,
      discountedPrice: 1330,
      startDate: daysAgo(10),
      endDate: daysAgo(8),
      status: "expired",
      availableQuantity: 20,
      claimedQuantity: 18,
      createdAt: daysAgo(10)
    }
  ],
  orders: [
    {
      _id: "demo-ord-501",
      orderNumber: "HMU-DEMO-8841",
      customer: { _id: "demo-cust-301", name: "Amaya Wijesinghe", email: "amaya.w@gmail.com" },
      business: { _id: "demo-biz-103", name: "Galle Face Hoppers Kitchen", category: "Restaurant" },
      deal: { _id: "demo-deal-401", title: "Evening Hopper Platter & Iced Tea for Two" },
      amount: 2470,
      currency: "LKR",
      status: "PAID",
      paymentStatus: "SUCCESS",
      paymentProvider: "DEMO",
      transactionId: "TXN-DEMO-901",
      paidAt: daysAgo(1),
      createdAt: daysAgo(1)
    },
    {
      _id: "demo-ord-502",
      orderNumber: "HMU-DEMO-8819",
      customer: { _id: "demo-cust-302", name: "Tharindu Bandara", email: "tharindu.b@outlook.com" },
      business: { _id: "demo-biz-104", name: "PixelForge Gaming Lounge", category: "Entertainment" },
      deal: { _id: "demo-deal-402", title: "2-Hour Co-op Sim Racing & Ginger Beer Pass" },
      amount: 1920,
      currency: "LKR",
      status: "COMPLETED",
      paymentStatus: "SUCCESS",
      paymentProvider: "DEMO",
      transactionId: "TXN-DEMO-874",
      paidAt: daysAgo(3),
      createdAt: daysAgo(3)
    },
    {
      _id: "demo-ord-503",
      orderNumber: "HMU-DEMO-8790",
      customer: { _id: "demo-cust-303", name: "Shenali De Mel", email: "shenali.dm@gmail.com" },
      business: { _id: "demo-biz-103", name: "Galle Face Hoppers Kitchen", category: "Restaurant" },
      deal: { _id: "demo-deal-401", title: "Evening Hopper Platter & Iced Tea for Two" },
      amount: 2470,
      currency: "LKR",
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentProvider: "DEMO",
      transactionId: null,
      paidAt: null,
      createdAt: daysAgo(5)
    }
  ],
  logs: [
    {
      id: "demo-log-1",
      source: "audit",
      action: "SELLER_APPROVED",
      actor: "Platform Administrator (Demo)",
      actorEmail: "admin@hitmeup.com",
      targetType: "business",
      targetId: "demo-biz-103",
      targetName: "Galle Face Hoppers Kitchen",
      description: 'Approved seller application for "Galle Face Hoppers Kitchen"',
      timestamp: daysAgo(12)
    },
    {
      id: "demo-log-2",
      source: "audit",
      action: "SELLER_REJECTED",
      actor: "Platform Administrator (Demo)",
      actorEmail: "admin@hitmeup.com",
      targetType: "business",
      targetId: "demo-biz-105",
      targetName: "QuickByte Accessories",
      description: 'Rejected seller application for "QuickByte Accessories"',
      metadata: { reason: "Incomplete storefront street address and unverifiable contact telephone." },
      timestamp: daysAgo(6)
    }
  ],
  settings: {
    marketplaceName: "HitMeUp",
    supportEmail: "support@hitmeup.lk",
    defaultDiscoveryRadiusKm: 25,
    requireSellerVerification: true,
    autoExpireDeals: true,
    maxDealDurationHours: 72,
    maxDiscountPercentage: 90,
    notifyOnNewApplication: true,
    notifyOnSellerSuspension: true,
    notifyOnDealCancellation: false
  }
});

let demoStore = createInitialDemoStore();
const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

const buildDemoSeries = (range) => {
  const count = range === "7d" ? 7 : range === "90d" ? 12 : range === "12m" ? 12 : 14;
  return Array.from({ length: count }).map((_, idx) => {
    const d = new Date(Date.now() - (count - 1 - idx) * (range === "12m" ? 30 : range === "90d" ? 7 : 1) * 86400000);
    const orders = (idx % 3) + (idx > count - 4 ? 2 : 0);
    return {
      key: d.toISOString().slice(0, 10),
      label:
        range === "12m"
          ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      orders,
      paidOrders: Math.max(0, orders - (idx % 2 === 0 ? 0 : 1)),
      revenue: Math.max(0, orders - (idx % 2 === 0 ? 0 : 1)) * 2250,
      sellers: idx % 4 === 0 ? 1 : 0,
      customers: idx % 2 === 0 ? 1 : 0,
      deals: idx % 3 === 0 ? 1 : 0
    };
  });
};

export const adminService = {
  resetDemoStore: () => {
    demoStore = createInitialDemoStore();
  },

  // 1. Overview
  getOverview: async ({ range = "30d", demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/overview${buildQuery({ range })}`);
    }
    await delay();
    const pendingApps = demoStore.businesses.filter(
      (b) => b.applicationStatus === "pending" || b.applicationStatus === "under_review"
    );
    const paidOrders = demoStore.orders.filter(
      (o) => o.status === "PAID" || o.status === "COMPLETED"
    );
    const rev = paidOrders.reduce((s, o) => s + o.amount, 0);
    return {
      success: true,
      isDemo: true,
      range,
      kpis: {
        totalCustomers: { value: demoStore.customers.length, comparison: null },
        registeredSellers: {
          value: demoStore.businesses.filter((b) => b.applicationStatus !== "rejected").length,
          approvedCount: demoStore.businesses.filter((b) => b.applicationStatus === "approved").length,
          comparison: null
        },
        pendingApplications: {
          value: pendingApps.length,
          underReviewCount: demoStore.businesses.filter((b) => b.applicationStatus === "under_review").length
        },
        activeDeals: {
          value: demoStore.deals.filter((d) => d.status === "active").length,
          totalPublished: demoStore.deals.length
        },
        totalOrders: {
          value: demoStore.orders.length,
          paidCount: paidOrders.length,
          comparison: null
        },
        marketplaceRevenue: {
          value: rev,
          currency: "LKR",
          paidOrdersCount: paidOrders.length,
          comparison: null
        }
      },
      charts: {
        timeSeries: buildDemoSeries(range),
        applicationBreakdown: {
          pending: demoStore.businesses.filter((b) => b.applicationStatus === "pending").length,
          under_review: demoStore.businesses.filter((b) => b.applicationStatus === "under_review").length,
          approved: demoStore.businesses.filter((b) => b.applicationStatus === "approved").length,
          rejected: demoStore.businesses.filter((b) => b.applicationStatus === "rejected").length
        },
        dealBreakdown: {
          total: demoStore.deals.length,
          active: demoStore.deals.filter((d) => d.status === "active").length,
          draft: demoStore.deals.filter((d) => d.status === "draft").length,
          expired: demoStore.deals.filter((d) => d.status === "expired").length,
          cancelled: demoStore.deals.filter((d) => d.status === "cancelled").length,
          totalClaimedVouchers: demoStore.deals.reduce((s, d) => s + d.claimedQuantity, 0)
        }
      },
      pendingApplicationsPreview: pendingApps.map((b) => ({
        _id: b._id,
        name: b.name,
        category: b.category,
        applicantName: b.ownerId?.name,
        email: b.email,
        phone: b.phone,
        city: b.address?.city,
        submittedAt: b.createdAt,
        applicationStatus: b.applicationStatus,
        isVerified: b.isVerified
      })),
      recentActivity: demoStore.logs.slice(0, 8)
    };
  },

  // 2. Seller Applications
  getApplications: async (params = {}, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/applications${buildQuery(params)}`);
    }
    await delay();
    const { search = "", status = "all", category = "all", page = 1, limit = 10 } = params;
    const all = demoStore.businesses.map((b) => ({
      ...b,
      applicantName: b.ownerId?.name || "Owner",
      applicantEmail: b.email || b.ownerId?.email || ""
    }));
    const counts = {
      all: all.length,
      pending: all.filter((b) => b.applicationStatus === "pending").length,
      under_review: all.filter((b) => b.applicationStatus === "under_review").length,
      approved: all.filter((b) => b.applicationStatus === "approved").length,
      rejected: all.filter((b) => b.applicationStatus === "rejected").length
    };
    let filtered = all;
    if (status !== "all") filtered = filtered.filter((b) => b.applicationStatus === status);
    if (category !== "all")
      filtered = filtered.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.applicantName.toLowerCase().includes(q) ||
          b.applicantEmail.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      isDemo: true,
      counts,
      total: filtered.length,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(filtered.length / Number(limit))),
      applications: filtered.slice((page - 1) * limit, page * limit)
    };
  },

  getApplicationById: async (id, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/applications/${id}`);
    }
    await delay(120);
    const found = demoStore.businesses.find((b) => b._id === id);
    if (!found) throw new Error("Demo application not found");
    return {
      success: true,
      isDemo: true,
      application: {
        ...found,
        dealsCount: demoStore.deals.filter((d) => d.businessId?._id === id).length,
        auditHistory: demoStore.logs.filter((l) => l.targetId === id)
      }
    };
  },

  markApplicationUnderReview: async (id, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/applications/${id}/review`, { method: "PATCH" });
    }
    await delay(220);
    const biz = demoStore.businesses.find((b) => b._id === id);
    if (!biz) throw new Error("Demo application not found");
    biz.applicationStatus = "under_review";
    biz.reviewedAt = new Date().toISOString();
    demoStore.logs.unshift({
      id: `demo-log-${Date.now()}`,
      source: "audit",
      action: "APPLICATION_UNDER_REVIEW",
      actor: "Demo Administrator",
      actorEmail: "admin@hitmeup.com",
      targetType: "business",
      targetId: id,
      targetName: biz.name,
      description: `Marked seller application "${biz.name}" as under review`,
      timestamp: new Date().toISOString()
    });
    return { success: true, isDemo: true, message: `${biz.name} marked as under review`, application: { ...biz } };
  },

  approveApplication: async (id, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/applications/${id}/approve`, { method: "PATCH" });
    }
    await delay(260);
    const biz = demoStore.businesses.find((b) => b._id === id);
    if (!biz) throw new Error("Demo application not found");
    biz.applicationStatus = "approved";
    biz.isVerified = true;
    biz.status = "active";
    biz.rejectionReason = "";
    biz.reviewedAt = new Date().toISOString();
    demoStore.logs.unshift({
      id: `demo-log-${Date.now()}`,
      source: "audit",
      action: "SELLER_APPROVED",
      actor: "Demo Administrator",
      actorEmail: "admin@hitmeup.com",
      targetType: "business",
      targetId: id,
      targetName: biz.name,
      description: `Approved seller application for "${biz.name}"`,
      timestamp: new Date().toISOString()
    });
    return {
      success: true,
      isDemo: true,
      message: `Seller application for "${biz.name}" has been approved`,
      application: { ...biz }
    };
  },

  rejectApplication: async (id, reason, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/applications/${id}/reject`, {
        method: "PATCH",
        body: { reason }
      });
    }
    await delay(260);
    if (!reason || String(reason).trim().length < 5) {
      throw new Error("A clear rejection reason (at least 5 characters) is required");
    }
    const biz = demoStore.businesses.find((b) => b._id === id);
    if (!biz) throw new Error("Demo application not found");
    biz.applicationStatus = "rejected";
    biz.isVerified = false;
    biz.status = "inactive";
    biz.rejectionReason = String(reason).trim();
    biz.reviewedAt = new Date().toISOString();
    demoStore.logs.unshift({
      id: `demo-log-${Date.now()}`,
      source: "audit",
      action: "SELLER_REJECTED",
      actor: "Demo Administrator",
      actorEmail: "admin@hitmeup.com",
      targetType: "business",
      targetId: id,
      targetName: biz.name,
      description: `Rejected seller application for "${biz.name}"`,
      metadata: { reason: biz.rejectionReason },
      timestamp: new Date().toISOString()
    });
    return {
      success: true,
      isDemo: true,
      message: `Application for "${biz.name}" rejected`,
      application: { ...biz }
    };
  },

  // 3. Sellers
  getSellers: async (params = {}, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/sellers${buildQuery(params)}`);
    }
    await delay();
    const { search = "", status = "all", category = "all", page = 1, limit = 10 } = params;
    let items = demoStore.businesses
      .filter((b) => b.applicationStatus !== "rejected")
      .map((b) => ({
        ...b,
        ownerName: b.ownerId?.name || "Owner",
        ownerEmail: b.email || b.ownerId?.email || "",
        totalDeals: demoStore.deals.filter((d) => d.businessId?._id === b._id).length,
        activeDeals: demoStore.deals.filter(
          (d) => d.businessId?._id === b._id && d.status === "active"
        ).length
      }));
    const summary = {
      total: items.length,
      active: items.filter((i) => i.status === "active").length,
      suspended: items.filter((i) => i.status === "inactive").length,
      verified: items.filter((i) => i.isVerified).length
    };
    if (status === "active") items = items.filter((i) => i.status === "active");
    if (status === "suspended" || status === "inactive")
      items = items.filter((i) => i.status === "inactive");
    if (category !== "all")
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.ownerName.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      isDemo: true,
      summary,
      total: items.length,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(items.length / Number(limit))),
      sellers: items.slice((page - 1) * limit, page * limit)
    };
  },

  getSellerById: async (id, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/sellers/${id}`);
    }
    await delay(120);
    const biz = demoStore.businesses.find((b) => b._id === id);
    if (!biz) throw new Error("Demo seller not found");
    const deals = demoStore.deals.filter((d) => d.businessId?._id === id);
    return {
      success: true,
      isDemo: true,
      seller: {
        ...biz,
        deals,
        metrics: {
          totalDeals: deals.length,
          activeDeals: deals.filter((d) => d.status === "active").length,
          totalOrders: demoStore.orders.filter((o) => o.business?._id === id).length,
          paidOrders: demoStore.orders.filter(
            (o) => o.business?._id === id && (o.status === "PAID" || o.status === "COMPLETED")
          ).length,
          totalRevenue: demoStore.orders
            .filter((o) => o.business?._id === id && (o.status === "PAID" || o.status === "COMPLETED"))
            .reduce((s, o) => s + o.amount, 0),
          reviewCount: 0,
          averageRating: null
        },
        auditHistory: demoStore.logs.filter((l) => l.targetId === id)
      }
    };
  },

  suspendSeller: async (id, reason, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/sellers/${id}/suspend`, {
        method: "PATCH",
        body: { reason }
      });
    }
    await delay(240);
    const biz = demoStore.businesses.find((b) => b._id === id);
    if (!biz) throw new Error("Demo seller not found");
    biz.status = "inactive";
    biz.suspensionReason = reason || "Administrative suspension";
    demoStore.logs.unshift({
      id: `demo-log-${Date.now()}`,
      source: "audit",
      action: "SELLER_SUSPENDED",
      actor: "Demo Administrator",
      actorEmail: "admin@hitmeup.com",
      targetType: "business",
      targetId: id,
      targetName: biz.name,
      description: `Suspended seller "${biz.name}"`,
      metadata: { reason: biz.suspensionReason },
      timestamp: new Date().toISOString()
    });
    return { success: true, isDemo: true, message: `Seller "${biz.name}" suspended`, seller: { ...biz } };
  },

  reactivateSeller: async (id, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/sellers/${id}/reactivate`, { method: "PATCH" });
    }
    await delay(240);
    const biz = demoStore.businesses.find((b) => b._id === id);
    if (!biz) throw new Error("Demo seller not found");
    biz.status = "active";
    biz.suspensionReason = "";
    demoStore.logs.unshift({
      id: `demo-log-${Date.now()}`,
      source: "audit",
      action: "SELLER_REACTIVATED",
      actor: "Demo Administrator",
      actorEmail: "admin@hitmeup.com",
      targetType: "business",
      targetId: id,
      targetName: biz.name,
      description: `Reactivated seller "${biz.name}"`,
      timestamp: new Date().toISOString()
    });
    return { success: true, isDemo: true, message: `Seller "${biz.name}" reactivated`, seller: { ...biz } };
  },

  // 4. Customers
  getCustomers: async (params = {}, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/customers${buildQuery(params)}`);
    }
    await delay();
    const { search = "", status = "all", page = 1, limit = 10 } = params;
    let items = [...demoStore.customers];
    const summary = {
      total: items.length,
      active: items.filter((c) => c.isActive).length,
      deactivated: items.filter((c) => !c.isActive).length,
      withOrders: items.filter((c) => c.orderCount > 0).length
    };
    if (status === "active") items = items.filter((c) => c.isActive);
    if (status === "inactive" || status === "deactivated") items = items.filter((c) => !c.isActive);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      isDemo: true,
      summary,
      total: items.length,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(items.length / Number(limit))),
      customers: items.slice((page - 1) * limit, page * limit)
    };
  },

  getCustomerById: async (id, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/customers/${id}`);
    }
    await delay(120);
    const cust = demoStore.customers.find((c) => c._id === id);
    if (!cust) throw new Error("Demo customer not found");
    return {
      success: true,
      isDemo: true,
      customer: {
        ...cust,
        voucherCount: cust.paidOrders || 0,
        recentOrders: demoStore.orders
          .filter((o) => o.customer?._id === id)
          .map((o) => ({
            _id: o._id,
            orderNumber: o.orderNumber,
            dealId: { title: o.deal?.title },
            amount: o.amount,
            status: o.status,
            createdAt: o.createdAt
          }))
      }
    };
  },

  updateCustomerStatus: async (id, isActive, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/customers/${id}/status`, {
        method: "PATCH",
        body: { isActive }
      });
    }
    await delay(200);
    const cust = demoStore.customers.find((c) => c._id === id);
    if (!cust) throw new Error("Demo customer not found");
    cust.isActive = isActive;
    return { success: true, isDemo: true, customer: { ...cust } };
  },

  // 5. Deals
  getDeals: async (params = {}, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/deals${buildQuery(params)}`);
    }
    await delay();
    const { search = "", status = "all", businessId = "all", page = 1, limit = 12 } = params;
    let items = [...demoStore.deals];
    const counts = {
      all: items.length,
      active: items.filter((d) => d.status === "active").length,
      draft: items.filter((d) => d.status === "draft").length,
      expired: items.filter((d) => d.status === "expired").length,
      cancelled: items.filter((d) => d.status === "cancelled").length
    };
    if (status !== "all") items = items.filter((d) => d.status === status);
    if (businessId !== "all") items = items.filter((d) => d.businessId?._id === businessId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.businessId?.name || "").toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      isDemo: true,
      counts,
      businesses: demoStore.businesses.map((b) => ({ _id: b._id, name: b.name, category: b.category })),
      total: items.length,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(items.length / Number(limit))),
      deals: items.slice((page - 1) * limit, page * limit)
    };
  },

  getDealById: async (id, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/deals/${id}`);
    }
    await delay(120);
    const deal = demoStore.deals.find((d) => d._id === id);
    if (!deal) throw new Error("Demo deal not found");
    return {
      success: true,
      isDemo: true,
      deal: {
        ...deal,
        ordersCount: demoStore.orders.filter((o) => o.deal?._id === id).length,
        redeemedVouchers: Math.min(deal.claimedQuantity || 0, 5)
      }
    };
  },

  updateDealStatus: async (id, status, reason = "", { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/deals/${id}/status`, {
        method: "PATCH",
        body: { status, reason }
      });
    }
    await delay(220);
    const deal = demoStore.deals.find((d) => d._id === id);
    if (!deal) throw new Error("Demo deal not found");
    deal.status = status;
    return { success: true, isDemo: true, message: `Deal status updated to ${status}`, deal: { ...deal } };
  },

  // 6. Orders
  getOrders: async (params = {}, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/orders${buildQuery(params)}`);
    }
    await delay();
    const { search = "", status = "all", paymentStatus = "all", page = 1, limit = 12 } = params;
    let items = [...demoStore.orders];
    const summary = {
      totalOrders: items.length,
      paidOrders: items.filter((o) => o.status === "PAID" || o.status === "COMPLETED").length,
      pendingOrders: items.filter((o) => o.status === "PENDING").length,
      cancelledOrFailed: items.filter((o) => o.status === "CANCELLED" || o.status === "FAILED").length,
      grossPaidVolume: items
        .filter((o) => o.status === "PAID" || o.status === "COMPLETED")
        .reduce((s, o) => s + o.amount, 0),
      currency: "LKR"
    };
    if (status !== "all") items = items.filter((o) => o.status === status);
    if (paymentStatus !== "all") items = items.filter((o) => o.paymentStatus === paymentStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.business.name.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      isDemo: true,
      summary,
      total: items.length,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(items.length / Number(limit))),
      orders: items.slice((page - 1) * limit, page * limit)
    };
  },

  // 7. Analytics
  getAnalytics: async ({ range = "30d", demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/analytics${buildQuery({ range })}`);
    }
    await delay();
    const paid = demoStore.orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED");
    return {
      success: true,
      isDemo: true,
      range,
      summary: {
        totalCustomers: demoStore.customers.length,
        newCustomersInRange: 2,
        totalSellers: demoStore.businesses.length,
        newSellersInRange: 2,
        totalDeals: demoStore.deals.length,
        activeDeals: demoStore.deals.filter((d) => d.status === "active").length,
        totalOrders: demoStore.orders.length,
        paidOrders: paid.length,
        grossRevenue: paid.reduce((s, o) => s + o.amount, 0),
        currency: "LKR"
      },
      timeSeries: buildDemoSeries(range),
      sellerFunnel: {
        total: demoStore.businesses.length,
        approved: demoStore.businesses.filter((b) => b.applicationStatus === "approved").length,
        pending: demoStore.businesses.filter((b) => b.applicationStatus === "pending").length,
        under_review: demoStore.businesses.filter((b) => b.applicationStatus === "under_review").length,
        rejected: demoStore.businesses.filter((b) => b.applicationStatus === "rejected").length
      },
      dealsByCategory: [
        { category: "Food", count: 2 },
        { category: "Games", count: 1 }
      ],
      voucherStats: {
        totalIssued: 21,
        redeemed: 14,
        active: 7,
        expired: 0
      },
      topBusinesses: [
        {
          _id: "demo-biz-103",
          name: "Galle Face Hoppers Kitchen",
          category: "Restaurant",
          paidOrders: 1,
          revenue: 2470,
          activeDeals: 1,
          claimedVouchers: 12
        },
        {
          _id: "demo-biz-104",
          name: "PixelForge Gaming Lounge",
          category: "Entertainment",
          paidOrders: 1,
          revenue: 1920,
          activeDeals: 1,
          claimedVouchers: 9
        }
      ],
      topDeals: demoStore.deals.map((d) => ({
        _id: d._id,
        title: d.title,
        businessName: d.businessId?.name,
        category: d.category,
        status: d.status,
        discountPercentage: d.discountPercentage,
        discountedPrice: d.discountedPrice,
        claimedQuantity: d.claimedQuantity,
        ordersCount: 1,
        paidOrders: 1,
        revenue: d.discountedPrice
      }))
    };
  },

  // 8. Activity Logs
  getActivityLogs: async (params = {}, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest(`/admin/activity-logs${buildQuery(params)}`);
    }
    await delay();
    const { search = "", source = "all", action = "all", page = 1, limit = 15 } = params;
    let items = [...demoStore.logs];
    if (source !== "all") items = items.filter((l) => l.source === source);
    if (action !== "all") items = items.filter((l) => l.action === action);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          (l.targetName || "").toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      isDemo: true,
      counts: {
        auditCount: demoStore.logs.filter((l) => l.source === "audit").length,
        marketplaceCount: demoStore.logs.filter((l) => l.source === "marketplace").length
      },
      total: items.length,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(items.length / Number(limit))),
      logs: items.slice((page - 1) * limit, page * limit)
    };
  },

  // 9. Settings
  getSettings: async ({ demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest("/admin/settings");
    }
    await delay(100);
    return { success: true, isDemo: true, settings: { ...demoStore.settings } };
  },

  updateSettings: async (payload, { demoMode = false } = {}) => {
    if (!demoMode) {
      return apiRequest("/admin/settings", { method: "PUT", body: payload });
    }
    await delay(220);
    demoStore.settings = { ...demoStore.settings, ...payload };
    return {
      success: true,
      isDemo: true,
      message: "Demo platform settings updated",
      settings: { ...demoStore.settings }
    };
  }
};

export default adminService;

