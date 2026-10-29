const mongoose = require("mongoose");
const Business = require("../models/Business");
const User = require("../models/user");

// Standard supported business category enums
const VALID_BUSINESS_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Retail",
  "Fashion",
  "Electronics",
  "Health & Beauty",
  "Salon",
  "Fitness",
  "Entertainment",
  "Groceries",
  "Other"
];

/**
 * Helper to normalize and map raw category string to schema enum
 */
const normalizeCategory = (category) => {
  if (!category) return "Retail";
  const exact = VALID_BUSINESS_CATEGORIES.find(
    (c) => c.toLowerCase() === category.trim().toLowerCase()
  );
  if (exact) return exact;

  const catLower = category.toLowerCase();
  if (catLower.includes("food") || catLower.includes("rest") || catLower.includes("burger") || catLower.includes("pizza")) {
    return "Restaurant";
  }
  if (catLower.includes("coffee") || catLower.includes("drink") || catLower.includes("cafe") || catLower.includes("bakery")) {
    return "Cafe";
  }
  if (catLower.includes("fashion") || catLower.includes("cloth") || catLower.includes("wear")) {
    return "Fashion";
  }
  if (catLower.includes("tech") || catLower.includes("electronic") || catLower.includes("gadget")) {
    return "Electronics";
  }
  if (catLower.includes("health") || catLower.includes("wellness") || catLower.includes("beauty") || catLower.includes("spa")) {
    return "Health & Beauty";
  }
  if (catLower.includes("salon") || catLower.includes("barber") || catLower.includes("hair")) {
    return "Salon";
  }
  if (catLower.includes("gym") || catLower.includes("fitness") || catLower.includes("sport")) {
    return "Fitness";
  }
  if (catLower.includes("game") || catLower.includes("arcade") || catLower.includes("entertain")) {
    return "Entertainment";
  }
  if (catLower.includes("grocery") || catLower.includes("supermarket") || catLower.includes("market")) {
    return "Groceries";
  }
  return "Retail";
};

/**
 * Service function: Creates a Business model document and links it to owner
 * Exported for reuse in authController during merchant registration
 */
const createBusinessRecord = async ({
  ownerId,
  name,
  category = "Retail",
  description = "",
  phone,
  email,
  address = {},
  location,
  openingHours = "09:00 AM - 09:00 PM",
  logoUrl = "",
  coverImageUrl = "",
  status = "active"
}) => {
  // Check if business already exists for this owner
  const existing = await Business.findOne({ ownerId });
  if (existing) {
    return existing;
  }

  // Prepare location
  let locationData = {
    type: "Point",
    coordinates: [79.8612, 6.9271] // Default Colombo, Sri Lanka
  };

  if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    locationData = {
      type: "Point",
      coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
    };
  }

  const normalizedCat = normalizeCategory(category);
  const contactPhone = (phone && phone.trim()) ? phone.trim() : "+94 77 000 0000";

  const business = await Business.create({
    name: name?.trim() || "Local Merchant Store",
    category: normalizedCat,
    description: description || "",
    ownerId,
    phone: contactPhone,
    email: email || "",
    address: typeof address === "object" ? address : { city: address || "Colombo", country: "Sri Lanka" },
    location: locationData,
    openingHours,
    logoUrl,
    coverImageUrl,
    status
  });

  // Link business to User record
  await User.findByIdAndUpdate(ownerId, { businessId: business._id });

  return business;
};

/**
 * @desc    Create a business profile (for business user)
 * @route   POST /api/businesses
 * @access  Private (Business or Admin role)
 */
const createBusinessProfile = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      phone,
      email,
      address,
      location,
      openingHours,
      logoUrl,
      coverImageUrl
    } = req.body;

    if (!name || !category || !phone) {
      return res.status(400).json({
        success: false,
        message: "Business name, category, and phone number are required"
      });
    }

    // Check if current user already owns a business
    const existingBusiness = await Business.findOne({ ownerId: req.user._id });
    if (existingBusiness) {
      // If business already exists (e.g. from registration), update it with full details and return 201
      existingBusiness.name = name;
      existingBusiness.category = normalizeCategory(category);
      if (description !== undefined) existingBusiness.description = description;
      if (phone) existingBusiness.phone = phone;
      if (email) existingBusiness.email = email;
      if (openingHours) existingBusiness.openingHours = openingHours;
      if (logoUrl !== undefined) existingBusiness.logoUrl = logoUrl;
      if (coverImageUrl !== undefined) existingBusiness.coverImageUrl = coverImageUrl;

      if (address && typeof address === "object") {
        existingBusiness.address = {
          ...(existingBusiness.address?.toObject?.() || existingBusiness.address || {}),
          ...address
        };
      }

      if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
        existingBusiness.location = {
          type: "Point",
          coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
        };
      }

      await existingBusiness.save();
      await User.findByIdAndUpdate(req.user._id, { businessId: existingBusiness._id });

      return res.status(201).json({
        success: true,
        message: "Business profile configured successfully",
        business: existingBusiness
      });
    }

    // Prepare location data if coordinates provided
    let locationData = {
      type: "Point",
      coordinates: [79.8612, 6.9271] // Default Colombo, Sri Lanka
    };

    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      locationData = {
        type: "Point",
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
      };
    }

    // Create business
    const business = await Business.create({
      name,
      category: normalizeCategory(category),
      description: description || "",
      ownerId: req.user._id,
      phone,
      email: email || req.user.email,
      address: address || {},
      location: locationData,
      openingHours: openingHours || "09:00 AM - 09:00 PM",
      logoUrl: logoUrl || "",
      coverImageUrl: coverImageUrl || "",
      status: "active"
    });

    // Link business to user record
    await User.findByIdAndUpdate(req.user._id, { businessId: business._id });

    return res.status(201).json({
      success: true,
      message: "Business profile created successfully",
      business
    });
  } catch (error) {
    console.error("Create Business Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create business profile",
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged-in user's business profile
 * @route   GET /api/businesses/my-business
 * @access  Private (Business or Admin role)
 */
const getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "No business profile found for this account. Please create one."
      });
    }

    return res.status(200).json({
      success: true,
      business
    });
  } catch (error) {
    console.error("Get My Business Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business profile",
      error: error.message
    });
  }
};

/**
 * @desc    Update current logged-in user's business profile
 * @route   PUT /api/businesses/my-business
 * @access  Private (Business or Admin role)
 */
const updateMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "No business profile found to update."
      });
    }

    const {
      name,
      category,
      description,
      phone,
      email,
      address,
      location,
      openingHours,
      logoUrl,
      coverImageUrl
    } = req.body;

    if (name) business.name = name;
    if (category) business.category = normalizeCategory(category);
    if (description !== undefined) business.description = description;
    if (phone) business.phone = phone;
    if (email) business.email = email;
    if (openingHours) business.openingHours = openingHours;
    if (logoUrl !== undefined) business.logoUrl = logoUrl;
    if (coverImageUrl !== undefined) business.coverImageUrl = coverImageUrl;

    if (address && typeof address === "object") {
      business.address = {
        ...business.address.toObject(),
        ...address
      };
    }

    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      business.location = {
        type: "Point",
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
      };
    }

    await business.save();

    return res.status(200).json({
      success: true,
      message: "Business profile updated successfully",
      business
    });
  } catch (error) {
    console.error("Update My Business Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update business profile",
      error: error.message
    });
  }
};

/**
 * @desc    Get business details by ID (Public API contract for other members)
 * @route   GET /api/businesses/:id
 * @access  Public
 */
const getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID format"
      });
    }

    const business = await Business.findById(id).populate("ownerId", "name email phone");

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    return res.status(200).json({
      success: true,
      business
    });
  } catch (error) {
    console.error("Get Business By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve business",
      error: error.message
    });
  }
};

/**
 * @desc    Get all businesses with optional search and category filters
 * @route   GET /api/businesses
 * @access  Public
 */
const getAllBusinesses = async (req, res) => {
  try {
    const { category, search, city, status = "active", page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = new RegExp(`^${category}$`, "i");
    }

    if (city) {
      query["address.city"] = new RegExp(city, "i");
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const businesses = await Business.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-__v");

    const total = await Business.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: businesses.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      businesses
    });
  } catch (error) {
    console.error("Get All Businesses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve businesses",
      error: error.message
    });
  }
};

module.exports = {
  createBusinessRecord,
  createBusinessProfile,
  getMyBusiness,
  updateMyBusiness,
  getBusinessById,
  getAllBusinesses
};
