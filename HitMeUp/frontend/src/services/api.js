const rawBaseUrl = import.meta.env.VITE_API_URL || "/api";
const trimmedBase = rawBaseUrl.replace(/\/+$/, "");
const API_BASE_URL = (!trimmedBase.startsWith("/") && !trimmedBase.endsWith("/api"))
  ? `${trimmedBase}/api`
  : trimmedBase;

/**
 * Universal API Client with automatic JSON parsing and JWT token injection
 */
export async function apiRequest(endpoint, { method = "GET", body = null, headers = {} } = {}) {
  const token = localStorage.getItem("token");

  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: finalHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Ensure clean slash handling
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ----------------------------------------------------------------------
// Auth Endpoints (Member 1)
// ----------------------------------------------------------------------
export const authApi = {
  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    }),

  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: userData,
    }),

  getMe: () => apiRequest("/auth/me"),

  updateProfile: (profileData) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: profileData,
    }),

  changePassword: (passwords) =>
    apiRequest("/auth/change-password", {
      method: "PUT",
      body: passwords,
    }),

  sendOtp: ({ email, purpose }) =>
    apiRequest("/auth/send-otp", {
      method: "POST",
      body: { email, purpose },
    }),

  verifyOtp: ({ email, otp, purpose }) =>
    apiRequest("/auth/verify-otp", {
      method: "POST",
      body: { email, otp, purpose },
    }),

  resetPassword: ({ email, otp, newPassword }) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body: { email, otp, newPassword },
    }),
};

// ----------------------------------------------------------------------
// Business Endpoints (Member 1)
// ----------------------------------------------------------------------
export const businessApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/businesses${query ? `?${query}` : ""}`);
  },

  getById: (id) => apiRequest(`/businesses/${id}`),

  getMyBusiness: () => apiRequest("/businesses/my-business"),

  createBusiness: (businessData) =>
    apiRequest("/businesses", {
      method: "POST",
      body: businessData,
    }),

  updateMyBusiness: (businessData) =>
    apiRequest("/businesses/my-business", {
      method: "PUT",
      body: businessData,
    }),
};

// ----------------------------------------------------------------------
// Deals Endpoints (Member 2)
// ----------------------------------------------------------------------
export const dealApi = {
  getDeals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/deals${query ? `?${query}` : ""}`);
  },

  getDealById: (id) => apiRequest(`/deals/${id}`),

  getMyDeals: () => apiRequest("/deals/business/my-deals"),

  getDealsByBusiness: (businessId) => apiRequest(`/deals/business/${businessId}`),

  createDeal: (dealData) =>
    apiRequest("/deals", {
      method: "POST",
      body: dealData,
    }),

  updateDeal: (id, dealData) =>
    apiRequest(`/deals/${id}`, {
      method: "PUT",
      body: dealData,
    }),

  updateDealStatus: (id, status) =>
    apiRequest(`/deals/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  deleteDeal: (id) =>
    apiRequest(`/deals/${id}`, {
      method: "DELETE",
    }),
};

// ----------------------------------------------------------------------
// Orders Endpoints (Member 4 - HitMeUp Pay)
// ----------------------------------------------------------------------
export const orderApi = {
  createOrder: ({ dealId, quantity = 1 }) =>
    apiRequest("/orders", {
      method: "POST",
      body: { dealId, quantity },
    }),

  getMyOrders: () => apiRequest("/orders"),

  getOrderById: (id) => apiRequest(`/orders/${id}`),

  cancelOrder: (id) =>
    apiRequest(`/orders/${id}/cancel`, {
      method: "POST",
    }),

  getBusinessOrders: () => apiRequest("/orders/business"),
};

// ----------------------------------------------------------------------
// HitMeUp Pay: Simulated Gateway Endpoints
// ----------------------------------------------------------------------
export const gatewayApi = {
  getCheckoutSession: (orderId) =>
    apiRequest("/gateway/checkout", {
      method: "POST",
      body: { orderId },
    }),

  processPayment: ({
    orderId,
    paymentMethod = "CARD",
    requestedScenario = "SUCCESS",
    brand = null,
    last4 = null,
    idempotencyKey = null,
  }) => {
    const headers = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return apiRequest("/gateway/process", {
      method: "POST",
      headers,
      body: {
        orderId,
        paymentMethod,
        requestedScenario,
        brand,
        last4,
        idempotencyKey,
      },
    });
  },

  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/gateway/transactions${query ? `?${query}` : ""}`);
  },

  getTransactionById: (id) =>
    apiRequest(`/gateway/transactions/${encodeURIComponent(String(id || "").trim())}`),

  resolveTransaction: (id) =>
    apiRequest(`/gateway/transactions/${encodeURIComponent(String(id || "").trim())}/resolve`, {
      method: "POST",
    }),
};

// ----------------------------------------------------------------------
// Payments & Analytics Endpoints (Member 4 - HitMeUp Pay)
// ----------------------------------------------------------------------
export const paymentApi = {
  getMyPayments: () => apiRequest("/payments/my-payments"),

  getAllPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/payments${query ? `?${query}` : ""}`);
  },

  getPaymentById: (id) => apiRequest(`/payments/${id}`),

  getDashboardSummary: () => apiRequest("/payments/dashboard/summary"),

  refundPayment: (paymentId, reason = "") =>
    apiRequest(`/payments/${paymentId}/refund`, {
      method: "POST",
      body: { reason },
    }),

  getReceipt: (paymentId) => apiRequest(`/payments/${paymentId}/receipt`),

  createPayment: ({ orderId }) =>
    apiRequest("/payments/create", {
      method: "POST",
      body: { orderId },
    }),

  verifyPayment: (payload) =>
    apiRequest("/payments/verify", {
      method: "POST",
      body: payload,
    }),
};

// ----------------------------------------------------------------------
// Vouchers Endpoints (Member 4)
// ----------------------------------------------------------------------
export const voucherApi = {
  claimVoucher: ({ dealId }) =>
    apiRequest("/vouchers/claim", {
      method: "POST",
      body: { dealId },
    }),

  getMyVouchers: () => apiRequest("/vouchers"),

  getVoucherById: (id) => apiRequest(`/vouchers/${id}`),

  previewVoucherByCode: (code) => apiRequest(`/vouchers/preview/${code}`),

  redeemVoucher: ({ voucherCode, code, businessId }) =>
    apiRequest("/vouchers/redeem", {
      method: "POST",
      body: { voucherCode: voucherCode || code, code: voucherCode || code, businessId },
    }),
};

// ----------------------------------------------------------------------
// AI Endpoints (Member 5)
// ----------------------------------------------------------------------
export const aiApi = {
  generateDeal: (prompt) =>
    apiRequest("/ai/generate-deal", {
      method: "POST",
      body: { prompt },
    }),
};

// ----------------------------------------------------------------------
// Discovery, Maps, Favorites & Reviews Endpoints (Member 3)
// ----------------------------------------------------------------------
export const discoveryApi = {
  searchDeals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/discovery/deals${query ? `?${query}` : ""}`);
  },

  getNearbyDeals: ({ lat, lng, radius = 15, category, limit } = {}) => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append("lat", lat);
    if (lng !== undefined) params.append("lng", lng);
    if (radius !== undefined) params.append("radius", radius);
    if (category && category !== "all") params.append("category", category);
    if (limit) params.append("limit", limit);
    return apiRequest(`/discovery/nearby?${params.toString()}`);
  },

  getMapBusinesses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/discovery/map${query ? `?${query}` : ""}`);
  },

  getDealDetails: (id) => apiRequest(`/discovery/deal/${id}`),

  toggleFavorite: (dealId) =>
    apiRequest(`/discovery/favorites/${dealId}`, {
      method: "POST",
    }),

  removeFavorite: (dealId) =>
    apiRequest(`/discovery/favorites/${dealId}`, {
      method: "DELETE",
    }),

  getMyFavorites: () => apiRequest("/discovery/favorites"),

  addReview: ({ businessId, dealId, rating, comment }) =>
    apiRequest("/discovery/reviews", {
      method: "POST",
      body: { businessId, dealId, rating, comment },
    }),

  getBusinessReviews: (businessId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/discovery/reviews/business/${businessId}${query ? `?${query}` : ""}`);
  },
};

// ----------------------------------------------------------------------
// Image Upload to Cloudinary (WebP Enforced)
// ----------------------------------------------------------------------
export const uploadApi = {
  uploadImage: async (fileOrDataUrl, folder = "general") => {
    if (typeof fileOrDataUrl === "string") {
      return apiRequest("/upload", {
        method: "POST",
        body: { image: fileOrDataUrl, folder },
      });
    }

    const formData = new FormData();
    formData.append("image", fileOrDataUrl);
    formData.append("folder", folder);

    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const cleanEndpoint = "/upload";
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Upload failed with status ${response.status}`);
    }
    return data;
  },
};

export default {
  apiRequest,
  auth: authApi,
  business: businessApi,
  deals: dealApi,
  orders: orderApi,
  gateway: gatewayApi,
  payments: paymentApi,
  vouchers: voucherApi,
  ai: aiApi,
  discovery: discoveryApi,
  upload: uploadApi,
};
