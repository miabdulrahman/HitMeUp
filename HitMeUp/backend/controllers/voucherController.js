const axios = require("axios");

const Voucher = require("../models/Voucher");
const Order = require("../models/Order");
const Redemption = require("../models/Redemption");

const DEAL_SERVICE_URL =
  process.env.DEAL_SERVICE_URL ||
  "http://localhost:5000/api/deals";

async function getDeal(dealId) {
  try {
    const response = await axios.get(
      `${DEAL_SERVICE_URL}/${dealId}`
    );

    return (
      response.data.data ||
      response.data.deal ||
      response.data
    );
  } catch (error) {
    throw new Error(
      "Unable to retrieve deal information"
    );
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
    const voucher = await Voucher.findOne({
      _id: req.params.id,
      customerId: req.user._id
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

    // The authenticated business account should have businessId.
    if (!businessUser.businessId) {
      return res.status(403).json({
        success: false,
        message: "Business account information not found"
      });
    }

    const voucher = await Voucher.findOne({
      code: code.toUpperCase().trim()
    });

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

    // Get deal to verify the correct business
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
      !dealBusinessId ||
      dealBusinessId.toString() !==
        businessUser.businessId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This voucher does not belong to your business"
      });
    }

    // Atomic update prevents two requests
    // from redeeming the same active voucher.
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
          new: true
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
      businessId: businessUser.businessId,
      redeemedBy: businessUser._id,
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
  redeemVoucher
};