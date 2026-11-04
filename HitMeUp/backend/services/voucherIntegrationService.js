const crypto = require("crypto");
const QRCode = require("qrcode");
const Voucher = require("../models/Voucher");

function generateVoucherCode() {
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `HMU-${timePart}-${randomPart}`;
}

async function generateQrData(code) {
  return await QRCode.toDataURL(`HITMEUP:${code}`, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#111827",
      light: "#FFFFFF"
    }
  });
}

/**
 * Idempotently creates a digital voucher with QR code for an order.
 * If a voucher already exists for this orderId, it returns the existing voucher.
 */
async function createVoucherForOrder({ order, paymentId = null, session = null }) {
  if (!order || !order._id) {
    throw new Error("Order reference is required to generate a voucher");
  }

  // Idempotency check: see if voucher already exists for this order
  const existingVoucher = await Voucher.findOne({ orderId: order._id }).session(session);
  if (existingVoucher) {
    if (paymentId && !existingVoucher.paymentId) {
      existingVoucher.paymentId = paymentId;
      await existingVoucher.save({ session });
    }
    return existingVoucher;
  }

  const code = generateVoucherCode();
  const qrData = await generateQrData(code);

  const voucherData = {
    orderId: order._id,
    customerId: order.customerId,
    dealId: order.dealId,
    paymentId: paymentId || order.paymentId || null,
    code,
    qrData,
    status: "ACTIVE",
    expiresAt: order.expiresAt || null
  };

  let voucher;
  if (session) {
    const created = await Voucher.create([voucherData], { session });
    voucher = created[0];
  } else {
    voucher = await Voucher.create(voucherData);
  }

  return voucher;
}

module.exports = {
  generateVoucherCode,
  generateQrData,
  createVoucherForOrder
};

