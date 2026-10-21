const mongoose = require("mongoose");
const axios = require("axios");

const Voucher = require("../models/Voucher");
const Order = require("../models/Order");
const Redemption = require("../models/Redemption");
const Deal = require("../models/Deal");

const DEAL_SERVICE_URL =
  process.env.DEAL_SERVICE_URL ||
  "http://localhost:5000/api/deals";

async function getDeal(dealId) {
  try {
    const response = await axios.get(
      `${DEAL_SERVICE_URL}/${dealId}`,
      { timeout: 1500 }
    );

    return (
      response.data.data ||
      response.data.deal ||
      response.data
    );
  } catch (error) {
    // Fallback: If Deal API route is not yet deployed by Member 2,
    // read directly from Deal database model to allow independent testing
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
}

// GET CUSTOMER VOUCHERS
const getMyVouchers = async (req, res) => {
  try {
    const customerId = req.user._id;

    const vouchers = await Voucher.find({
      customerId
    })
      .populate("dealId")
      .populate("orderId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vouchers.length,
      data: vouchers
    });
  } catch (error) {
    console.error("Get Vouchers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get vouchers"
    });
  }
};

// GET SINGLE VOUCHER
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

    // Automatically mark expired vouchers
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
      data: voucher
    });
  } catch (error) {
    console.error("Get Voucher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get voucher"
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

// REDEEM VOUCHER
const redeemVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    const businessUser = req.user;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Voucher code is required"
      });
    }

    // Automatically strip QR prefix "HITMEUP:" if cashier scanner sends full QR string
    let cleanCode = code.trim();
    if (cleanCode.startsWith("HITMEUP:")) {
      cleanCode = cleanCode.replace("HITMEUP:", "");
    }
    cleanCode = cleanCode.toUpperCase().trim();

    // The authenticated business account should have businessId.
    if (!businessUser.businessId && businessUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Business account information not found"
      });
    }

    const voucher = await Voucher.findOne({ code: cleanCode });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Invalid voucher code"
      });
    }

    if (voucher.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: `Voucher is already ${voucher.status.toLowerCase()}`
      });
    }

    // Check voucher expiry
    if (
      voucher.expiresAt &&
      new Date() > voucher.expiresAt
    ) {
      voucher.status = "EXPIRED";
      await voucher.save();

      return res.status(400).json({
        success: false,
        message: "Voucher has expired"
      });
    }

    // Get deal to verify the correct business (admins can override)
    const deal = await getDeal(voucher.dealId);

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
      (!dealBusinessId ||
        dealBusinessId.toString() !==
          businessUser.businessId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This voucher does not belong to your business"
      });
    }

    // Atomic update prevents two requests from redeeming the same active voucher
    const redeemedVoucher =
      await Voucher.findOneAndUpdate(
        {
          _id: voucher._id,
          status: "ACTIVE"
        },
        {
          status: "REDEEMED",
          redeemedAt: new Date()
        },
        {
          returnDocument: "after"
        }
      );

    if (!redeemedVoucher) {
      return res.status(409).json({
        success: false,
        message:
          "Voucher has already been redeemed"
      });
    }

    const redemption = await Redemption.create({
      voucherId: redeemedVoucher._id,
      orderId: redeemedVoucher.orderId,
      businessId: businessUser.businessId || dealBusinessId,
      redeemedBy: businessUser._id || businessUser.id,
      redeemedAt: new Date()
    });

    // Mark order completed
    await Order.findByIdAndUpdate(
      redeemedVoucher.orderId,
      {
        status: "COMPLETED"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Voucher redeemed successfully",
      data: {
        voucher: redeemedVoucher,
        redemption
      }
    });
  } catch (error) {
    console.error("Redeem Voucher Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message ||
        "Failed to redeem voucher"
    });
  }
};

module.exports = {
  getMyVouchers,
  getVoucherById,
  previewVoucherByCode,
  redeemVoucher
};