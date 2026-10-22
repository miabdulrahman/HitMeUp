const mongoose = require("mongoose");
const axios = require("axios");
const crypto = require("crypto");
const QRCode = require("qrcode");

const Voucher = require("../models/Voucher");
const Order = require("../models/Order");
const Redemption = require("../models/Redemption");
const Deal = require("../models/Deal");
const Business = require("../models/Business");

const DEAL_SERVICE_URL =
  process.env.DEAL_SERVICE_URL ||
  "http://localhost:5000/api/deals";

async function getDeal(dealId) {
  if (DEAL_SERVICE_URL && !DEAL_SERVICE_URL.includes("localhost:5000")) {
    try {
      const baseUrl = DEAL_SERVICE_URL.endsWith("/")
        ? DEAL_SERVICE_URL
        : `${DEAL_SERVICE_URL}/`;
      const targetUrl = new URL(dealId, baseUrl);
      const response = await axios.get(targetUrl.toString(), { timeout: 2000 });

      return (
        response.data.data ||
        response.data.deal ||
        response.data
      );
    } catch (error) {
      console.warn(
        "External deal service call failed, falling back to database:",
        error.message
      );
    }
  }

  try {
    const dealFromDb = await Deal.findById(dealId);
    if (dealFromDb) {
      return dealFromDb;
    }
  } catch (err) {
    // Ignore format errors
  }

  return null;
}

function generateVoucherCode() {
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `HMU-${timePart}-${randomPart}`;
}

function generateOrderNumber() {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HMU-ORD-${Date.now().toString(36).toUpperCase()}-${random}`;
}

/**
 * @desc    Claim a flash deal voucher (decrements available quantity in DB & generates unique QR voucher)
 * @route   POST /api/vouchers/claim
 * @access  Private (Authenticated Buyer / Customer)
 */
const claimVoucher = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { dealId } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        message: "Deal ID is required to claim a voucher"
      });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Flash promotion deal not found"
      });
    }

    // Check deal active status
    if (deal.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This flash deal is not currently active"
      });
    }

    // Check expiration
    if (deal.endDate && new Date(deal.endDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This flash deal has expired"
      });
    }

    // Check stock / available quantity
    if (deal.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Sorry, this flash deal is completely sold out!"
      });
    }

    // Atomically decrement availableQuantity in database
    const updatedDeal = await Deal.findOneAndUpdate(
      {
        _id: dealId,
        availableQuantity: { $gt: 0 },
        status: "active"
      },
      {
        $inc: { availableQuantity: -1 }
      },
      {
        new: true
      }
    );

    if (!updatedDeal) {
      return res.status(400).json({
        success: false,
        message: "This flash deal just sold out or is no longer available"
      });
    }

    // Create a completed order record
    const amount = updatedDeal.discountedPrice || updatedDeal.originalPrice || 0;
    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customerId,
      dealId: updatedDeal._id,
      amount,
      currency: "LKR",
      status: "PAID",
      expiresAt: updatedDeal.endDate || null
    });

    // Generate unique voucher code
    const voucherCode = generateVoucherCode();

    // Generate QR code Data URL for seller scanning
    const qrData = await QRCode.toDataURL(voucherCode);

    // Create the unique voucher
    const voucher = await Voucher.create({
      orderId: order._id,
      customerId,
      dealId: updatedDeal._id,
      code: voucherCode,
      qrData,
      status: "ACTIVE",
      expiresAt: updatedDeal.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await voucher.populate("dealId");

    return res.status(201).json({
      success: true,
      message: "Flash voucher successfully claimed!",
      voucher,
      order,
      remainingQuantity: updatedDeal.availableQuantity
    });
  } catch (error) {
    console.error("Claim Voucher Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to claim digital voucher"
    });
  }
};

/**
 * @desc    Get all vouchers claimed by authenticated customer
 * @route   GET /api/vouchers
 * @access  Private (Customer / Buyer)
 */
const getMyVouchers = async (req, res) => {
  try {
    const customerId = req.user._id;

    const vouchers = await Voucher.find({ customerId })
      .populate("dealId")
      .populate("orderId")
      .sort({ createdAt: -1 });

    const now = new Date();
    // Auto-expire past-due vouchers in background
    vouchers.forEach((v) => {
      if (v.status === "ACTIVE" && v.expiresAt && v.expiresAt < now) {
        v.status = "EXPIRED";
        Voucher.updateOne({ _id: v._id }, { status: "EXPIRED" }).exec();
      }
    });

    return res.status(200).json({
      success: true,
      count: vouchers.length,
      vouchers,
      data: vouchers
    });
  } catch (error) {
    console.error("Get Vouchers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve vouchers"
    });
  }
};

/**
 * @desc    Get single voucher by ID
 * @route   GET /api/vouchers/:id
 * @access  Private (Customer)
 */
const getVoucherById = async (req, res) => {
  try {
    const customerId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Voucher ID format"
      });
    }

    const voucher = await Voucher.findOne({
      _id: req.params.id,
      customerId
    })
      .populate("dealId")
      .populate("orderId");

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found"
      });
    }

    if (
      voucher.status === "ACTIVE" &&
      voucher.expiresAt &&
      new Date() > voucher.expiresAt
    ) {
      voucher.status = "EXPIRED";
      await voucher.save();
    }

    return res.status(200).json({
      success: true,
      voucher,
      data: voucher
    });
  } catch (error) {
    console.error("Get Voucher Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get voucher details"
    });
  }
};

// PREVIEW VOUCHER BY CODE (For Cashier / Business Scanning)
const previewVoucherByCode = async (req, res) => {
  try {
    let rawCode = req.params.code;

    if (!rawCode) {
      return res.status(400).json({
        success: false,
        message: "Voucher code is required"
      });
    }

    // Automatically strip QR prefix "HITMEUP:" if present
    if (rawCode.startsWith("HITMEUP:")) {
      rawCode = rawCode.replace("HITMEUP:", "");
    }
    const code = rawCode.toUpperCase().trim();

    const voucher = await Voucher.findOne({ code })
      .populate("dealId")
      .populate("customerId", "name email phone")
      .populate("orderId", "orderNumber amount status");

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Invalid voucher code"
      });
    }

    // Auto-update expired
    if (
      voucher.status === "ACTIVE" &&
      voucher.expiresAt &&
      new Date() > voucher.expiresAt
    ) {
      voucher.status = "EXPIRED";
      await voucher.save();
    }

    // Check ownership if business user is scanning
    const businessUser = req.user;
    let belongsToCurrentBusiness = true;
    if (businessUser?.businessId && voucher.dealId) {
      const dealBizId =
        voucher.dealId.businessId ||
        voucher.dealId.business?._id ||
        voucher.dealId.business;

      if (
        dealBizId &&
        dealBizId.toString() !== businessUser.businessId.toString()
      ) {
        belongsToCurrentBusiness = false;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        voucher,
        belongsToCurrentBusiness
      }
    });
  } catch (error) {
    console.error("Preview Voucher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to preview voucher"
    });
  }
};

/**
 * @desc    Redeem voucher code presented by customer at POS
 * @route   POST /api/vouchers/redeem
 * @access  Private (Seller / Business / Admin)
 */
const redeemVoucher = async (req, res) => {
  try {
    const rawCode = req.body.code || req.body.voucherCode;
    const businessUser = req.user;

    if (!rawCode || !rawCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Voucher code is required"
      });
    }

    // Automatically strip QR prefix "HITMEUP:" if cashier scanner sends full QR string
    let cleanCode = rawCode.trim();
    if (cleanCode.startsWith("HITMEUP:")) {
      cleanCode = cleanCode.replace("HITMEUP:", "");
    }
    cleanCode = cleanCode.toUpperCase().trim();

    // Resolve business for the user if not directly attached
    let businessId = businessUser.businessId;
    if (!businessId) {
      const business = await Business.findOne({ ownerId: businessUser._id });
      if (business) {
        businessId = business._id;
        businessUser.businessId = business._id;
      }
    }

    // The authenticated business account should have businessId (admins exempted)
    if (!businessId && businessUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Business account information not found"
      });
    }

    const voucher = await Voucher.findOne({ code: cleanCode });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: `Invalid voucher code: "${cleanCode}". Please verify code with customer.`
      });
    }

    if (voucher.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: `This voucher is already ${voucher.status.toLowerCase()}`
      });
    }

    // Check expiry
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      voucher.status = "EXPIRED";
      await voucher.save();
      return res.status(400).json({
        success: false,
        message: "This voucher has expired and cannot be redeemed"
      });
    }

    // Get deal to verify correct business (admins can override)
    let deal = null;
    try {
      deal = await getDeal(voucher.dealId);
    } catch (e) {
      deal = await Deal.findById(voucher.dealId);
    }

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Related deal not found"
      });
    }

    const dealBusinessId =
      deal.businessId ||
      deal.business?._id ||
      deal.business?.id;

    if (
      businessUser.role !== "admin" &&
      dealBusinessId &&
      businessId &&
      dealBusinessId.toString() !== businessId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This voucher does not belong to your business"
      });
    }

    // Atomic update prevents two requests from redeeming the same active voucher
    const redeemedVoucher = await Voucher.findOneAndUpdate(
      {
        _id: voucher._id,
        status: "ACTIVE"
      },
      {
        status: "REDEEMED",
        redeemedAt: new Date()
      },
      {
        new: true
      }
    ).populate("dealId");

    if (!redeemedVoucher) {
      return res.status(409).json({
        success: false,
        message: "Voucher has already been redeemed"
      });
    }

    const redemption = await Redemption.create({
      voucherId: redeemedVoucher._id,
      orderId: redeemedVoucher.orderId,
      businessId: businessId || dealBusinessId,
      redeemedBy: businessUser._id || businessUser.id,
      redeemedAt: new Date()
    });

    if (redeemedVoucher.orderId) {
      await Order.findByIdAndUpdate(redeemedVoucher.orderId, {
        status: "COMPLETED"
      });
    }

    return res.status(200).json({
      success: true,
      message: `Voucher ${cleanCode} successfully redeemed!`,
      voucher: redeemedVoucher,
      data: {
        voucher: redeemedVoucher,
        redemption
      }
    });
  } catch (error) {
    console.error("Redeem Voucher Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to redeem voucher"
    });
  }
};

module.exports = {
  claimVoucher,
  getMyVouchers,
  getVoucherById,
  previewVoucherByCode,
  redeemVoucher
};