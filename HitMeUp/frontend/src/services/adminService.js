import { apiRequest } from "./api";

/**
 * ============================================================================
 * HITMEUP PLATFORM ADMIN API SERVICE LAYER
 * ============================================================================
 * Clean API-only service layer connected directly to live MongoDB backend.
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

const adminService = {
  // 1. Executive Platform Overview
  getOverview: async ({ range = "30d" } = {}) => {
    return apiRequest(`/admin/overview${buildQuery({ range })}`);
  },

  // 2. Seller Applications
  getApplications: async (params = {}) => {
    return apiRequest(`/admin/applications${buildQuery(params)}`);
  },

  getApplicationById: async (id) => {
    return apiRequest(`/admin/applications/${id}`);
  },

  markApplicationUnderReview: async (id) => {
    return apiRequest(`/admin/applications/${id}/review`, { method: "PATCH" });
  },

  approveApplication: async (id) => {
    return apiRequest(`/admin/applications/${id}/approve`, { method: "PATCH" });
  },

  rejectApplication: async (id, reason) => {
    return apiRequest(`/admin/applications/${id}/reject`, {
      method: "PATCH",
      body: { reason }
    });
  },

  // 3. Registered Sellers
  getSellers: async (params = {}) => {
    return apiRequest(`/admin/sellers${buildQuery(params)}`);
  },

  getSellerById: async (id) => {
    return apiRequest(`/admin/sellers/${id}`);
  },

  suspendSeller: async (id, reason) => {
    return apiRequest(`/admin/sellers/${id}/suspend`, {
      method: "PATCH",
      body: { reason }
    });
  },

  reactivateSeller: async (id) => {
    return apiRequest(`/admin/sellers/${id}/reactivate`, { method: "PATCH" });
  },

  // 4. Customer Accounts
  getCustomers: async (params = {}) => {
    return apiRequest(`/admin/customers${buildQuery(params)}`);
  },

  getCustomerById: async (id) => {
    return apiRequest(`/admin/customers/${id}`);
  },

  updateCustomerStatus: async (id, isActive) => {
    return apiRequest(`/admin/customers/${id}/status`, {
      method: "PATCH",
      body: { isActive }
    });
  },

  // 5. Deal Moderation
  getDeals: async (params = {}) => {
    return apiRequest(`/admin/deals${buildQuery(params)}`);
  },

  getDealById: async (id) => {
    return apiRequest(`/admin/deals/${id}`);
  },

  updateDealStatus: async (id, status, reason = "") => {
    return apiRequest(`/admin/deals/${id}/status`, {
      method: "PATCH",
      body: { status, reason }
    });
  },

  // 6. Platform Orders Ledger
  getOrders: async (params = {}) => {
    return apiRequest(`/admin/orders${buildQuery(params)}`);
  },

  // 7. Advanced Analytics
  getAnalytics: async ({ range = "30d" } = {}) => {
    return apiRequest(`/admin/analytics${buildQuery({ range })}`);
  },

  // 8. Activity & Audit Trail
  getActivityLogs: async (params = {}) => {
    return apiRequest(`/admin/activity-logs${buildQuery(params)}`);
  },

  // 9. Governance & Platform Settings
  getSettings: async () => {
    return apiRequest("/admin/settings");
  },

  updateSettings: async (payload) => {
    return apiRequest("/admin/settings", { method: "PUT", body: payload });
  },

  resetDemoStore: () => {
    // No-op (all demo data removed)
  }
};

export default adminService;
