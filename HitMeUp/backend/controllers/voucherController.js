const crypto = require("crypto");
const QRCode = require("qrcode");

const Voucher = require("../models/Voucher");
const Order = require("../models/Order");
const Redemption = require("../models/Redemption");
const Deal = require("../models/Deal");
const Business = require("../models/Business");

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

    const cleanCode = rawCode.trim().toUpperCase();

    // Resolve business for the user if not directly attached
    let businessId = businessUser.businessId;
    if (!businessId) {
      const business = await Business.findOne({ ownerId: businessUser._id });
      if (business) {
        businessId = business._id;
        businessUser.businessId = business._id;
      }
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

    // Verify deal business matches if seller
    const deal = await Deal.findById(voucher.dealId);
    if (deal && businessId && businessUser.role !== "admin") {
      const dealBiz = deal.businessId?.toString();
      const userBiz = businessId.toString();
      if (dealBiz && dealBiz !== userBiz) {
        return res.status(403).json({
          success: false,
          message: "This voucher belongs to a different merchant store."
        });
      }
    }

    // Atomic update to mark REDEEMED
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
      businessId: businessId || deal?.businessId,
      redeemedBy: businessUser._id,
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
  redeemVoucher
};