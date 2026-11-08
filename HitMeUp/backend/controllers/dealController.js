const Deal = require("../models/Deal");
const Business = require("../models/Business");
const User = require("../models/user");

const escapeRegex = (string) => {
  return String(string || "").replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// Taxonomy mappings between platform categories and merchant business types
const CATEGORY_MAP = {
  food: ["food", "restaurant", "cafe", "dining", "bakery", "groceries", "beverage", "beverages", "dessert", "kottu", "burger", "pizza", "meal"],
  fashion: ["fashion", "clothing", "apparel", "retail", "footwear", "accessories", "shoes", "wear"],
  electronics: ["electronics", "tech", "gadget", "gadgets", "computer", "computers", "phone", "phones", "audio", "headphone"],
  home: ["home", "furniture", "decor", "appliances", "cleaning", "living", "kitchen"],
  health: ["health", "beauty", "salon", "spa", "fitness", "wellness", "medical", "clinic", "dental"],
  sports: ["sports", "fitness", "gym", "athletics", "outdoor", "workout", "training"],
  services: ["services", "automotive", "repair", "cleaning", "maintenance", "consulting", "photography", "salon", "service"],
  games: ["games", "gaming", "arcade", "entertainment", "esports", "board game"]
};

const DEFAULT_CATEGORY_IMAGES = {
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
  fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80",
  electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  home: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80",
  health: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80",
  sports: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80",
  services: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  games: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=900&q=80"
};

const getCategoryFallbackImage = (category) => {
  const cat = (category || "").toLowerCase();
  for (const [key, synonyms] of Object.entries(CATEGORY_MAP)) {
    if (key === cat || synonyms.some((s) => cat.includes(s))) {
      return DEFAULT_CATEGORY_IMAGES[key];
    }
  }
  return DEFAULT_CATEGORY_IMAGES.food;
};

const buildCategoryRegex = (catInput) => {
  if (!catInput || catInput.toLowerCase() === "all") return null;
  const lower = catInput.trim().toLowerCase();
  
  const matchedTerms = new Set([lower]);
  
  if (CATEGORY_MAP[lower]) {
    CATEGORY_MAP[lower].forEach((t) => matchedTerms.add(t));
  }
  
  for (const [mainCat, synonyms] of Object.entries(CATEGORY_MAP)) {
    if (synonyms.some((s) => lower.includes(s) || s.includes(lower))) {
      matchedTerms.add(mainCat);
      synonyms.forEach((t) => matchedTerms.add(t));
    }
  }
  
  const pattern = Array.from(matchedTerms)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return new RegExp(pattern, "i");
};

/**
 * Helper to resolve the Business document for a user
 */
const resolveBusinessForUser = async (user, requestedBusinessId) => {
  // If admin, they can manage any business if provided
  if (user.role === "admin" && requestedBusinessId) {
    const business = await Business.findById(requestedBusinessId);
    if (business) return business;
  }

  // If user has a direct businessId on their model
  if (user.businessId) {
    const business = await Business.findById(user.businessId);
    if (business) return business;
  }

  // Lookup business owned by this user
  let business = await Business.findOne({ ownerId: user._id });
  if (business) return business;

  // Auto-heal fallback: if user is seller or business, create a default Business doc
  if (user.role === "seller" || user.role === "business" || user.role === "admin") {
    try {
      business = await Business.create({
        name: user.name ? `${user.name}'s Business` : "Partner Store",
        ownerId: user._id,
        category: "Restaurant",
        phone: user.phone || "0770000000",
        address: { city: "Colombo", country: "Sri Lanka" },
        status: "active"
      });
      await User.findByIdAndUpdate(user._id, { businessId: business._id });
      return business;
    } catch (e) {
      console.error("Auto-heal business record error:", e);
    }
  }

  return business;
};

/**
 * Helper to calculate discount and prices
 */
const calculatePricing = (originalPrice, discountPercentage, discountedPrice) => {
  const orig = Number(originalPrice);
  let discPct = discountPercentage !== undefined && discountPercentage !== null ? Number(discountPercentage) : null;
  let discPrice = discountedPrice !== undefined && discountedPrice !== null ? Number(discountedPrice) : null;

  if (orig <= 0) {
    throw new Error("Original price must be greater than zero");
  }

  if (discPct !== null && (discPct < 0 || discPct > 100)) {
    throw new Error("Discount percentage must be between 0 and 100");
  }

  if (discPct !== null && (discPrice === null || isNaN(discPrice))) {
    discPrice = Math.round(orig * (1 - discPct / 100) * 100) / 100;
  } else if (discPrice !== null && (discPct === null || isNaN(discPct))) {
    if (discPrice > orig) {
      throw new Error("Discounted price cannot be higher than original price");
    }
    discPct = Math.round(((orig - discPrice) / orig) * 100);
  } else if (discPct !== null && discPrice !== null) {
    // Both provided: ensure consistency or default to percentage
    discPrice = Math.round(orig * (1 - discPct / 100) * 100) / 100;
  } else {
    throw new Error("Either discount percentage or discounted price must be provided");
  }

  return {
    originalPrice: orig,
    discountPercentage: discPct,
    discountedPrice: discPrice
  };
};

/**
 * @desc    Create a new Flash Deal (Member 2)
 * @route   POST /api/deals
 * @access  Private (Business / Seller / Admin)
 */
const createDeal = async (req, res) => {
  try {
    const {
      title,
      description,
      businessId,
      category,
      originalPrice,
      discountPercentage,
      discountedPrice,
      startDate,
      endDate,
      durationHours,
      status,
      imageUrl,
      availableQuantity,
      terms
    } = req.body;

    if (!title || !description || originalPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and original price are required"
      });
    }

    // Resolve Business
    const business = await resolveBusinessForUser(req.user, businessId);
    if (!business) {
      return res.status(400).json({
        success: false,
        message: "No registered business found for your account. Please create a business profile first."
      });
    }

    // Verify Super Admin Approval & Active Status (requirement: sellers cannot publish deals until approved)
    if (req.user.role !== "admin") {
      const isApproved =
        business.applicationStatus === "approved" ||
        (business.isVerified &&
          business.applicationStatus !== "rejected" &&
          business.applicationStatus !== "pending" &&
          business.applicationStatus !== "under_review");

      if (business.status === "inactive" || business.suspensionReason) {
        return res.status(403).json({
          success: false,
          message: `Your seller account is currently suspended by administration${business.suspensionReason ? `: "${business.suspensionReason}"` : ""}. You cannot publish deals.`
        });
      }

      if (business.applicationStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: `Your seller application was rejected${business.rejectionReason ? `: "${business.rejectionReason}"` : ""}. You cannot publish deals.`
        });
      }

      if (!isApproved) {
        return res.status(403).json({
          success: false,
          message: "Your seller account is awaiting Super Admin approval. You cannot publish deals until approved."
        });
      }
    }

    // Calculate Pricing
    let pricing;
    try {
      pricing = calculatePricing(originalPrice, discountPercentage, discountedPrice);
    } catch (pricingErr) {
      return res.status(400).json({
        success: false,
        message: pricingErr.message
      });
    }

    // Calculate dates
    const start = startDate ? new Date(startDate) : new Date();
    let end;
    if (endDate) {
      end = new Date(endDate);
    } else if (durationHours) {
      end = new Date(start.getTime() + Number(durationHours) * 60 * 60 * 1000);
    } else {
      // Default flash deal duration: 24 hours
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after the start date"
      });
    }

    const resolvedCategory = category?.trim() || business.category || "Food";
    const resolvedImageUrl =
      (imageUrl && imageUrl.trim()) ||
      business.coverImageUrl ||
      getCategoryFallbackImage(resolvedCategory);

    const deal = new Deal({
      title: title.trim(),
      description: description.trim(),
      businessId: business._id,
      category: resolvedCategory,
      originalPrice: pricing.originalPrice,
      discountPercentage: pricing.discountPercentage,
      discountedPrice: pricing.discountedPrice,
      startDate: start,
      endDate: end,
      status: status || "active",
      imageUrl: resolvedImageUrl,
      availableQuantity: availableQuantity !== undefined ? Number(availableQuantity) : 50,
      claimedQuantity: 0,
      terms: terms || "Valid during store operating hours. One voucher per customer."
    });

    const savedDeal = await deal.save();

    return res.status(201).json({
      success: true,
      message: "Deal created successfully",
      deal: savedDeal
    });
  } catch (error) {
    console.error("Create Deal Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create deal",
      error: error.message
    });
  }
};

/**
 * @desc    Get all public / filtered deals (Discovery - Member 2 / Member 3)
 * @route   GET /api/deals
 * @access  Public
 */
const getDeals = async (req, res) => {
  try {
    const {
      category,
      search,
      q,
      keyword,
      status,
      businessId,
      minDiscount,
      maxPrice,
      sort,
      limit = 100,
      page = 1
    } = req.query;

    const searchTerm = (search || q || keyword || "").trim();

    const query = {};
    const now = new Date();

    // Auto-expire deals that have passed their end date
    await Deal.updateMany(
      { status: "active", endDate: { $lte: now } },
      { $set: { status: "expired" } }
    ).exec();

    // By default, public listing only returns 'active' deals that have not expired
    if (status && status !== "all") {
      query.status = status.toLowerCase();
      if (status.toLowerCase() === "active") {
        query.endDate = { $gt: now };
      }
    } else if (!status) {
      query.status = "active";
      query.endDate = { $gt: now };
    }

    if (category && category !== "All") {
      const catRegex = buildCategoryRegex(category);
      if (catRegex) {
        query.category = catRegex;
      }
    }

    // Ensure only deals from active and Super Admin-approved businesses are returned for buyers
    if (!status || status.toLowerCase() === "active") {
      const activeApprovedBusinesses = await Business.find({
        status: "active",
        $or: [
          { applicationStatus: "approved" },
          { isVerified: true, applicationStatus: { $ne: "rejected" } }
        ]
      }).distinct("_id");

      if (businessId) {
        if (!activeApprovedBusinesses.some((id) => id.toString() === businessId.toString())) {
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            page: Number(page),
            totalPages: 0,
            deals: []
          });
        }
        query.businessId = businessId;
      } else {
        query.businessId = { $in: activeApprovedBusinesses };
      }
    } else if (businessId) {
      query.businessId = businessId;
    }

    if (minDiscount) {
      query.discountPercentage = { $gte: Number(minDiscount) };
    }

    if (maxPrice) {
      query.discountedPrice = { $lte: Number(maxPrice) };
    }

    if (searchTerm) {
      const safeSearch = escapeRegex(searchTerm);
      const searchRegex = new RegExp(safeSearch, "i");

      const matchingBusinesses = await Business.find({
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { category: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
          { "address.city": { $regex: safeSearch, $options: "i" } },
          { "address.street": { $regex: safeSearch, $options: "i" } },
          { "address.state": { $regex: safeSearch, $options: "i" } }
        ]
      }).select("_id");
      const matchedBizIds = matchingBusinesses.map((b) => b._id);

      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
        { businessId: { $in: matchedBizIds } }
      ];
    }

    // Determine Sort Order
    let sortOption = { createdAt: -1 };
    if (sort === "discount_desc") sortOption = { discountPercentage: -1 };
    else if (sort === "price_asc") sortOption = { discountedPrice: 1 };
    else if (sort === "price_desc") sortOption = { discountedPrice: -1 };
    else if (sort === "ending_soon") sortOption = { endDate: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [deals, total] = await Promise.all([
      Deal.find(query)
        .populate("businessId", "name category address location phone logoUrl")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Deal.countDocuments(query)
    ]);

    // Filter out any newly expired deals from the returned payload
    const validDeals = (!status || status.toLowerCase() === "active")
      ? deals.filter((d) => d.status === "active" && (!d.endDate || new Date(d.endDate) > now))
      : deals;

    return res.status(200).json({
      success: true,
      count: validDeals.length,
      total: validDeals.length,
      page: Number(page),
      totalPages: Math.ceil(validDeals.length / Number(limit)),
      deals: validDeals
    });
  } catch (error) {
    console.error("Get Deals Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch deals",
      error: error.message
    });
  }
};

/**
 * @desc    Get single deal by ID (Member 2 / Member 4 Orders)
 * @route   GET /api/deals/:id
 * @access  Public
 */
const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id).populate(
      "businessId",
      "name category address location phone email logoUrl isVerified status applicationStatus ownerId"
    );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    const now = new Date();
    const isOwnerOrAdmin =
      req.user &&
      (req.user.role === "admin" ||
        (deal.businessId?.ownerId &&
          deal.businessId.ownerId.toString() === req.user._id.toString()));

    if (!isOwnerOrAdmin) {
      if (deal.status !== "active" || (deal.endDate && new Date(deal.endDate) <= now)) {
        return res.status(404).json({
          success: false,
          message: "Deal not found or has expired"
        });
      }
      if (
        deal.businessId?.status === "inactive" ||
        (deal.businessId?.applicationStatus &&
          deal.businessId.applicationStatus !== "approved" &&
          !deal.businessId.isVerified)
      ) {
        return res.status(404).json({
          success: false,
          message: "This deal is not currently available as the merchant store is inactive."
        });
      }
    }

    // Check if expired
    if (deal.status === "active" && deal.endDate < new Date()) {
      deal.status = "expired";
      await Deal.updateOne({ _id: deal._id }, { status: "expired" });
    }

    return res.status(200).json({
      success: true,
      deal
    });
  } catch (error) {
    console.error("Get Deal By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch deal",
      error: error.message
    });
  }
};

/**
 * @desc    Get all deals for the authenticated business owner (Business Deal Management - Member 2)
 * @route   GET /api/deals/business/my-deals
 * @access  Private (Business / Seller / Admin)
 */
const getMyDeals = async (req, res) => {
  try {
    const business = await resolveBusinessForUser(req.user);
    if (!business) {
      return res.status(200).json({
        success: true,
        message: "No business profile found",
        deals: [],
        metrics: { total: 0, active: 0, draft: 0, expired: 0, cancelled: 0 }
      });
    }

    const deals = await Deal.find({ businessId: business._id }).sort({ createdAt: -1 });

    const now = new Date();
    let active = 0;
    let draft = 0;
    let expired = 0;
    let cancelled = 0;

    deals.forEach((d) => {
      if (d.status === "active" && d.endDate < now) {
        d.status = "expired";
        Deal.updateOne({ _id: d._id }, { status: "expired" }).exec();
      }

      if (d.status === "active") active++;
      else if (d.status === "draft") draft++;
      else if (d.status === "expired") expired++;
      else if (d.status === "cancelled") cancelled++;
    });

    return res.status(200).json({
      success: true,
      business: {
        id: business._id,
        name: business.name,
        category: business.category
      },
      count: deals.length,
      metrics: {
        total: deals.length,
        active,
        draft,
        expired,
        cancelled
      },
      deals
    });
  } catch (error) {
    console.error("Get My Deals Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business deals",
      error: error.message
    });
  }
};

/**
 * @desc    Get active deals for a specific business (Public Storefront)
 * @route   GET /api/deals/business/:businessId
 * @access  Public
 */
const getDealsByBusiness = async (req, res) => {
  try {
    const bId = req.params.businessId;
    if (!bId || bId === "undefined" || bId === "null" || bId === "[object Object]") {
      return res.status(400).json({
        success: false,
        message: "Valid Business ID is required",
        deals: []
      });
    }

    const now = new Date();

    // Auto-expire past-due deals
    await Deal.updateMany(
      { status: "active", endDate: { $lte: now } },
      { $set: { status: "expired" } }
    ).exec();

    const targetIds = [bId];
    if (mongoose.Types.ObjectId.isValid(bId)) {
      targetIds.push(new mongoose.Types.ObjectId(bId));
    }

    // Look up associated business doc by _id or userId
    let businessDoc = null;
    if (mongoose.Types.ObjectId.isValid(bId)) {
      businessDoc = await Business.findOne({
        $or: [{ _id: bId }, { userId: bId }]
      }).select("_id userId name").lean();
    } else {
      businessDoc = await Business.findOne({
        name: new RegExp(`^${bId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
      }).select("_id userId name").lean();
    }

    if (businessDoc) {
      if (businessDoc._id) {
        targetIds.push(businessDoc._id);
        targetIds.push(businessDoc._id.toString());
      }
      if (businessDoc.userId) {
        targetIds.push(businessDoc.userId);
        targetIds.push(businessDoc.userId.toString());
      }
    }

    const orClauses = [{ businessId: { $in: targetIds } }];
    if (businessDoc?.name) {
      orClauses.push({ business: businessDoc.name });
    }

    const query = {
      $and: [
        { $or: orClauses },
        { status: "active" },
        {
          $or: [
            { endDate: { $gt: now } },
            { endDate: null },
            { endDate: { $exists: false } }
          ]
        }
      ]
    };

    const deals = await Deal.find(query)
      .populate("businessId", "name category address location phone openingHours logoUrl coverImageUrl isVerified")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: deals.length,
      deals
    });
  } catch (error) {
    console.error("Get Deals By Business Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business deals",
      error: error.message,
      deals: []
    });
  }
};

/**
 * @desc    Update a deal (Member 2)
 * @route   PUT /api/deals/:id
 * @access  Private (Business Owner / Admin)
 */
const updateDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    // Verify ownership
    const business = await resolveBusinessForUser(req.user);
    if (req.user.role !== "admin" && (!business || deal.businessId.toString() !== business._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this deal"
      });
    }

    if (req.user.role !== "admin") {
      if (business.status === "inactive" || business.suspensionReason) {
        return res.status(403).json({
          success: false,
          message: "Your seller account is currently suspended. You cannot update deals."
        });
      }
      const isApproved =
        business.applicationStatus === "approved" ||
        (business.isVerified &&
          business.applicationStatus !== "rejected" &&
          business.applicationStatus !== "pending" &&
          business.applicationStatus !== "under_review");
      if (!isApproved) {
        return res.status(403).json({
          success: false,
          message: "Your seller account is awaiting Super Admin approval. You cannot publish deals until approved."
        });
      }
    }

    const {
      title,
      description,
      category,
      originalPrice,
      discountPercentage,
      discountedPrice,
      startDate,
      endDate,
      status,
      imageUrl,
      availableQuantity,
      terms
    } = req.body;

    if (title) deal.title = title.trim();
    if (description) deal.description = description.trim();
    if (category) deal.category = category.trim();
    if (imageUrl !== undefined) {
      deal.imageUrl = imageUrl.trim() || getCategoryFallbackImage(deal.category);
    }
    if (availableQuantity !== undefined) deal.availableQuantity = Number(availableQuantity);
    if (terms !== undefined) deal.terms = terms;

    // Recalculate pricing if any price field updated
    const newOrig = originalPrice !== undefined ? originalPrice : deal.originalPrice;
    const newDiscPct = discountPercentage !== undefined ? discountPercentage : (discountedPrice !== undefined ? null : deal.discountPercentage);
    const newDiscPrice = discountedPrice !== undefined ? discountedPrice : null;

    if (originalPrice !== undefined || discountPercentage !== undefined || discountedPrice !== undefined) {
      try {
        const pricing = calculatePricing(newOrig, newDiscPct, newDiscPrice);
        deal.originalPrice = pricing.originalPrice;
        deal.discountPercentage = pricing.discountPercentage;
        deal.discountedPrice = pricing.discountedPrice;
      } catch (pErr) {
        return res.status(400).json({ success: false, message: pErr.message });
      }
    }

    // Date updates
    if (startDate) deal.startDate = new Date(startDate);
    if (endDate) deal.endDate = new Date(endDate);

    if (deal.endDate <= deal.startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after the start date"
      });
    }

    if (status) {
      if (!["draft", "active", "expired", "cancelled"].includes(status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Status must be draft, active, expired, or cancelled"
        });
      }
      deal.status = status.toLowerCase();
    }

    const updatedDeal = await deal.save();

    return res.status(200).json({
      success: true,
      message: "Deal updated successfully",
      deal: updatedDeal
    });
  } catch (error) {
    console.error("Update Deal Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update deal",
      error: error.message
    });
  }
};

/**
 * @desc    Change deal lifecycle status (draft / active / expired / cancelled)
 * @route   PATCH /api/deals/:id/status
 * @access  Private (Business Owner / Admin)
 */
const updateDealStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["draft", "active", "expired", "cancelled"].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "A valid status (draft, active, expired, cancelled) is required"
      });
    }

    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    // Ownership check
    const business = await resolveBusinessForUser(req.user);
    if (req.user.role !== "admin" && (!business || deal.businessId.toString() !== business._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this deal's status"
      });
    }

    deal.status = status.toLowerCase();
    const saved = await deal.save();

    return res.status(200).json({
      success: true,
      message: `Deal status updated to ${deal.status}`,
      deal: saved
    });
  } catch (error) {
    console.error("Update Deal Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update deal status",
      error: error.message
    });
  }
};

/**
 * @desc    Delete a deal (Member 2)
 * @route   DELETE /api/deals/:id
 * @access  Private (Business Owner / Admin)
 */
const deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    // Ownership check
    const business = await resolveBusinessForUser(req.user);
    if (req.user.role !== "admin" && (!business || deal.businessId.toString() !== business._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this deal"
      });
    }

    await Deal.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Deal deleted successfully"
    });
  } catch (error) {
    console.error("Delete Deal Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete deal",
      error: error.message
    });
  }
};

module.exports = {
  createDeal,
  getDeals,
  getDealById,
  getMyDeals,
  getDealsByBusiness,
  updateDeal,
  updateDealStatus,
  deleteDeal
};