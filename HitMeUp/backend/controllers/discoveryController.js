const Deal = require("../models/Deal");
const Business = require("../models/Business");
const Favorite = require("../models/Favorite");
const Review = require("../models/Review");

/**
 * Discovery Controller - Member 3 (Deal Discovery & Location)
 * Handles deal searching, category filtering, proximity/geospatial discovery,
 * interactive map data, favorites, and customer reviews.
 */

// Helper: Haversine distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  ) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// ----------------------------------------------------------------------
// 1. Search & Filter Active Deals
// ----------------------------------------------------------------------
exports.searchDeals = async (req, res) => {
  try {
    const {
      q,
      keyword,
      category,
      minPrice,
      maxPrice,
      minDiscount,
      city,
      sortBy = "recommended",
      page = 1,
      limit = 20
    } = req.query;

    const searchTerm = (q || keyword || "").trim();
    const query = {
      status: "active"
    };

    // Category filter
    if (category && category !== "all" && category !== "All") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.discountedPrice = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        query.discountedPrice.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        query.discountedPrice.$lte = Number(maxPrice);
      }
    }

    // Minimum discount percentage
    if (minDiscount !== undefined && !isNaN(Number(minDiscount))) {
      query.discountPercentage = { $gte: Number(minDiscount) };
    }

    // Keyword search across Deal title, description, or matched Business
    if (searchTerm) {
      // Find businesses matching name or category first
      const matchingBusinesses = await Business.find({
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { category: { $regex: searchTerm, $options: "i" } },
          { "address.city": { $regex: searchTerm, $options: "i" } }
        ]
      }).select("_id");

      const businessIds = matchingBusinesses.map((b) => b._id);

      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
        { businessId: { $in: businessIds } }
      ];
    }

    // Sort order definition
    let sortOptions = { createdAt: -1 };
    switch (sortBy) {
      case "price_asc":
        sortOptions = { discountedPrice: 1 };
        break;
      case "price_desc":
        sortOptions = { discountedPrice: -1 };
        break;
      case "discount_desc":
        sortOptions = { discountPercentage: -1 };
        break;
      case "expiring_soon":
        sortOptions = { endDate: 1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "recommended":
      default:
        sortOptions = { discountPercentage: -1, createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [deals, total] = await Promise.all([
      Deal.find(query)
        .populate("businessId", "name category address location phone logoUrl isVerified")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Deal.countDocuments(query)
    ]);

    // Filter by city if specified
    let filteredDeals = deals;
    if (city && city.trim()) {
      const cityRegex = new RegExp(city.trim(), "i");
      filteredDeals = deals.filter(
        (deal) =>
          deal.businessId?.address?.city &&
          cityRegex.test(deal.businessId.address.city)
      );
    }

    // If user is authenticated, check their favorites
    let favoriteDealIds = new Set();
    if (req.user && req.user._id) {
      const favorites = await Favorite.find({
        userId: req.user._id,
        dealId: { $ne: null }
      }).select("dealId");
      favoriteDealIds = new Set(favorites.map((f) => f.dealId.toString()));
    }

    // Format output with isFavorited indicator
    const formattedDeals = filteredDeals.map((deal) => ({
      ...deal,
      isFavorited: favoriteDealIds.has(deal._id.toString())
    }));

    return res.status(200).json({
      success: true,
      count: formattedDeals.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      deals: formattedDeals
    });
  } catch (error) {
    console.error("Discovery searchDeals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search deals",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// 2. Geolocation Nearby Deals Discovery
// ----------------------------------------------------------------------
exports.getNearbyDeals = async (req, res) => {
  try {
    const {
      lat,
      lng,
      latitude,
      longitude,
      radius = 15, // Default 15km
      category,
      limit = 30
    } = req.query;

    const userLat = parseFloat(lat || latitude);
    const userLng = parseFloat(lng || longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude coordinates are required for nearby discovery."
      });
    }

    const radiusKm = parseFloat(radius) || 15;
    const radiusRadians = radiusKm / 6378.1; // Convert km to earth sphere radians

    // Find nearby businesses using MongoDB geospatial query on location (2dsphere index)
    const businessQuery = {
      status: "active",
      location: {
        $geoWithin: {
          $centerSphere: [[userLng, userLat], radiusRadians]
        }
      }
    };

    if (category && category !== "all" && category !== "All") {
      businessQuery.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    const nearbyBusinesses = await Business.find(businessQuery)
      .select("name category address location phone logoUrl isVerified")
      .lean();

    if (!nearbyBusinesses.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        radiusKm,
        userLocation: { latitude: userLat, longitude: userLng },
        deals: []
      });
    }

    // Create a lookup map of businesses with calculated distances
    const businessMap = {};
    nearbyBusinesses.forEach((b) => {
      const bCoords = b.location?.coordinates || [];
      const bLng = bCoords[0];
      const bLat = bCoords[1];
      const dist = calculateDistanceKm(userLat, userLng, bLat, bLng);
      businessMap[b._id.toString()] = {
        ...b,
        distanceKm: dist,
        distanceText: dist !== null ? `${dist} km away` : "Nearby"
      };
    });

    const businessIds = Object.keys(businessMap);

    // Fetch active deals for these nearby businesses
    const dealQuery = {
      businessId: { $in: businessIds },
      status: "active"
    };

    const deals = await Deal.find(dealQuery)
      .limit(parseInt(limit, 10) || 50)
      .lean();

    // Check user favorites if logged in
    let favoriteDealIds = new Set();
    if (req.user && req.user._id) {
      const favorites = await Favorite.find({
        userId: req.user._id,
        dealId: { $ne: null }
      }).select("dealId");
      favoriteDealIds = new Set(favorites.map((f) => f.dealId.toString()));
    }

    // Merge business and distance information into each deal
    const enrichedDeals = deals.map((deal) => {
      const businessInfo = businessMap[deal.businessId.toString()] || {};
      return {
        ...deal,
        businessId: businessInfo,
        distanceKm: businessInfo.distanceKm ?? null,
        distanceText: businessInfo.distanceText ?? "Nearby",
        isFavorited: favoriteDealIds.has(deal._id.toString())
      };
    });

    // Sort deals by distance ascending (nearest first)
    enrichedDeals.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

    return res.status(200).json({
      success: true,
      count: enrichedDeals.length,
      radiusKm,
      userLocation: { latitude: userLat, longitude: userLng },
      deals: enrichedDeals
    });
  } catch (error) {
    console.error("Discovery getNearbyDeals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve nearby deals",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// 3. Interactive Map Pins Data
// ----------------------------------------------------------------------
exports.getMapBusinesses = async (req, res) => {
  try {
    const { category, city } = req.query;

    // Find all active deals first to identify merchants with live offers
    const dealQuery = {
      status: "active"
    };

    if (category && category !== "all" && category !== "All") {
      dealQuery.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    const activeDeals = await Deal.find(dealQuery)
      .select("title discountedPrice discountPercentage category businessId imageUrl")
      .lean();

    // Group deals by businessId
    const dealsByBusiness = {};
    activeDeals.forEach((deal) => {
      const bId = deal.businessId.toString();
      if (!dealsByBusiness[bId]) {
        dealsByBusiness[bId] = [];
      }
      dealsByBusiness[bId].push(deal);
    });

    const activeBusinessIds = Object.keys(dealsByBusiness);

    const businessQuery = {
      _id: { $in: activeBusinessIds },
      status: "active"
    };

    if (city && city.trim()) {
      businessQuery["address.city"] = new RegExp(city.trim(), "i");
    }

    const businesses = await Business.find(businessQuery)
      .select("name category address location phone logoUrl isVerified")
      .lean();

    // Map markers payload
    const mapMarkers = businesses.map((business) => {
      const deals = dealsByBusiness[business._id.toString()] || [];
      const coords = business.location?.coordinates || [79.8612, 6.9271];
      return {
        id: business._id,
        name: business.name,
        category: business.category,
        address: business.address,
        longitude: coords[0],
        latitude: coords[1],
        phone: business.phone,
        logoUrl: business.logoUrl,
        isVerified: business.isVerified,
        activeDealsCount: deals.length,
        topDeal: deals[0] || null,
        deals: deals.slice(0, 3)
      };
    });

    return res.status(200).json({
      success: true,
      count: mapMarkers.length,
      markers: mapMarkers
    });
  } catch (error) {
    console.error("Discovery getMapBusinesses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load map data",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// 4. Single Deal Discovery with Reviews & Merchant Info
// ----------------------------------------------------------------------
exports.getDealDiscoveryDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await Deal.findById(id)
      .populate("businessId", "name category address location phone email logoUrl isVerified")
      .lean();

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    // Fetch review statistics for this business
    const reviews = await Review.find({ businessId: deal.businessId._id })
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10
          ) / 10
        : 5.0;

    // Fetch other active deals from this merchant
    const otherDeals = await Deal.find({
      businessId: deal.businessId._id,
      _id: { $ne: deal._id },
      status: "active",
      endDate: { $gt: new Date() }
    })
      .limit(4)
      .lean();

    // Check if user favorited
    let isFavorited = false;
    if (req.user && req.user._id) {
      const fav = await Favorite.findOne({
        userId: req.user._id,
        dealId: deal._id
      });
      isFavorited = !!fav;
    }

    return res.status(200).json({
      success: true,
      deal: {
        ...deal,
        isFavorited
      },
      merchantRating: {
        averageRating: avgRating,
        totalReviews,
        recentReviews: reviews
      },
      otherDeals
    });
  } catch (error) {
    console.error("Discovery getDealDiscoveryDetails error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get deal details",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// 5. Favorites: Toggle Bookmark
// ----------------------------------------------------------------------
exports.toggleFavorite = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user._id;

    const existing = await Favorite.findOne({ userId, dealId });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return res.status(200).json({
        success: true,
        isFavorited: false,
        message: "Deal removed from favorites"
      });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    await Favorite.create({
      userId,
      dealId,
      businessId: deal.businessId
    });

    return res.status(201).json({
      success: true,
      isFavorited: true,
      message: "Deal saved to favorites"
    });
  } catch (error) {
    console.error("Discovery toggleFavorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update favorites",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// 6. Favorites: Get User's Saved Deals
// ----------------------------------------------------------------------
exports.getMyFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ userId })
      .populate({
        path: "dealId",
        populate: {
          path: "businessId",
          select: "name category address location phone logoUrl isVerified"
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out deals that might have been deleted
    const validFavorites = favorites
      .filter((f) => f.dealId !== null)
      .map((f) => ({
        ...f.dealId,
        favoriteId: f._id,
        savedAt: f.createdAt,
        isFavorited: true
      }));

    return res.status(200).json({
      success: true,
      count: validFavorites.length,
      favorites: validFavorites
    });
  } catch (error) {
    console.error("Discovery getMyFavorites error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve favorites",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// 7. Reviews: Post Customer Review
// ----------------------------------------------------------------------
exports.addReview = async (req, res) => {
  try {
    const { businessId, dealId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required to leave a review."
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5."
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found."
      });
    }

    const newReview = await Review.create({
      userId,
      businessId,
      dealId: dealId || null,
      rating: Math.round(numRating),
      comment: (comment || "").trim()
    });

    await newReview.populate("userId", "name");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: newReview
    });
  } catch (error) {
    console.error("Discovery addReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// 8. Reviews: Get Business Reviews
// ----------------------------------------------------------------------
exports.getBusinessReviews = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ businessId })
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments({ businessId })
    ]);

    // Calculate rating distribution and average
    const allRatings = await Review.find({ businessId }).select("rating").lean();
    const count = allRatings.length;
    const avg =
      count > 0
        ? Math.round((allRatings.reduce((a, b) => a + b.rating, 0) / count) * 10) / 10
        : 5.0;

    return res.status(200).json({
      success: true,
      total,
      averageRating: avg,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      reviews
    });
  } catch (error) {
    console.error("Discovery getBusinessReviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reviews",
      error: error.message
    });
  }
};
