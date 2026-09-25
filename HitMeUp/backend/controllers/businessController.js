const mongoose = require("mongoose");
const Business = require("../models/Business");
const User = require("../models/User");

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
      return res.status(400).json({
        success: false,
        message: "You already have an existing business profile registered.",
        businessId: existingBusiness._id
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
      category,
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
    if (category) business.category = category;
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
  createBusinessProfile,
  getMyBusiness,
  updateMyBusiness,
  getBusinessById,
  getAllBusinesses
};
