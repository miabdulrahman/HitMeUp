/**
 * HitMeUp Production Seed Generator
 * Seeds:
 * - 100 Approved Merchants across 70+ Sri Lankan locations & diverse categories
 * - 100-150 Active Flash Deals
 * - 300 Customers with realistic user behaviors (Vouchers, Orders, Favorites, Reviews)
 * - Exports all 400 credentials to CSV and JSON
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/user");
const Business = require("../models/Business");
const Deal = require("../models/Deal");
const Order = require("../models/Order");
const Voucher = require("../models/Voucher");
const Favorite = require("../models/Favorite");
const Review = require("../models/Review");

// --------------------------------------------------------------------------
// 73 REAL SRI LANKAN GEOGRAPHIC LOCATIONS WITH REAL COORDINATES [LNG, LAT]
// --------------------------------------------------------------------------
const LOCATIONS = [
  // Colombo Districts
  { city: "Colombo 01 (Fort)", street: "York Street", lng: 79.8433, lat: 6.9344 },
  { city: "Colombo 02 (Slave Island)", street: "Vauxhall Street", lng: 79.8540, lat: 6.9244 },
  { city: "Colombo 03 (Kollupitiya)", street: "Galle Road", lng: 79.8519, lat: 6.9064 },
  { city: "Colombo 04 (Bambalapitiya)", street: "Duplication Road", lng: 79.8569, lat: 6.8926 },
  { city: "Colombo 05 (Havelock Town)", street: "Havelock Road", lng: 79.8668, lat: 6.8837 },
  { city: "Colombo 06 (Wellawatte)", street: "W.A. Silva Mawatha", lng: 79.8608, lat: 6.8742 },
  { city: "Colombo 07 (Cinnamon Gardens)", street: "Gregory's Road", lng: 79.8708, lat: 6.9118 },
  { city: "Colombo 08 (Borella)", street: "Cotta Road", lng: 79.8824, lat: 6.9147 },
  { city: "Colombo 09 (Dematagoda)", street: "Baseline Road", lng: 79.8847, lat: 6.9324 },
  { city: "Colombo 10 (Maradana)", street: "Maradana Road", lng: 79.8687, lat: 6.9298 },
  { city: "Colombo 11 (Pettah)", street: "Main Street", lng: 79.8512, lat: 6.9372 },
  { city: "Colombo 12 (Hultsdorf)", street: "Court Road", lng: 79.8578, lat: 6.9391 },
  { city: "Colombo 13 (Kotahena)", street: "Wasala Road", lng: 79.8654, lat: 6.9512 },
  { city: "Colombo 14 (Grandpass)", street: "Grandpass Road", lng: 79.8752, lat: 6.9534 },
  { city: "Colombo 15 (Mattakkuliya)", street: "Ferguson Road", lng: 79.8791, lat: 6.9721 },

  // Greater Colombo & Western Province
  { city: "Dehiwala", street: "Station Road", lng: 79.8736, lat: 6.8511 },
  { city: "Mount Lavinia", street: "Hotel Road", lng: 79.8650, lat: 6.8385 },
  { city: "Moratuwa", street: "Rawatawatta Road", lng: 79.8856, lat: 6.7730 },
  { city: "Panadura", street: "Arthur V. Dias Mawatha", lng: 79.9074, lat: 6.7132 },
  { city: "Nugegoda", street: "Stanley Tilekeratne Mawatha", lng: 79.8974, lat: 6.8649 },
  { city: "Kotte", street: "Kotte Road", lng: 79.9187, lat: 6.8920 },
  { city: "Maharagama", street: "High Level Road", lng: 79.9272, lat: 6.8480 },
  { city: "Battaramulla", street: "Pelawatta Road", lng: 79.9197, lat: 6.8997 },
  { city: "Malabe", street: "New Kandy Road", lng: 79.9542, lat: 6.9042 },
  { city: "Kaduwela", street: "Avissawella Road", lng: 79.9822, lat: 6.9333 },
  { city: "Wattala", street: "Negombo Road", lng: 79.8911, lat: 6.9897 },
  { city: "Ja-Ela", street: "Ja-Ela Main Street", lng: 79.8928, lat: 7.0756 },
  { city: "Kandana", street: "Church Road", lng: 79.8988, lat: 7.0478 },
  { city: "Negombo", street: "Lewis Place", lng: 79.8358, lat: 7.2083 },
  { city: "Katunayake", street: "Airport Road", lng: 79.8847, lat: 7.1698 },
  { city: "Gampaha", street: "Yakkala Road", lng: 79.9930, lat: 7.0917 },
  { city: "Kelaniya", street: "Biyagama Road", lng: 79.9221, lat: 6.9538 },
  { city: "Kiribathgoda", street: "Kandy Road", lng: 79.9287, lat: 6.9782 },
  { city: "Kalutara", street: "Kalutara North Beach Road", lng: 79.9607, lat: 6.5854 },
  { city: "Wadduwa", street: "Pothupitiya Road", lng: 79.9324, lat: 6.6647 },
  { city: "Beruwala", street: "China Fort Road", lng: 79.9828, lat: 6.4789 },
  { city: "Aluthgama", street: "River Avenue", lng: 79.9946, lat: 6.4385 },
  { city: "Bentota", street: "National Holiday Resort", lng: 79.9984, lat: 6.4258 },

  // Central Province
  { city: "Kandy", street: "Dalada Veediya", lng: 80.6350, lat: 7.2906 },
  { city: "Peradeniya", street: "Kandy-Colombo Road", lng: 80.5966, lat: 7.2575 },
  { city: "Katugastota", street: "Kurunegala Road", lng: 80.6214, lat: 7.3247 },
  { city: "Matale", street: "Trincomalee Street", lng: 80.6234, lat: 7.4675 },
  { city: "Dambulla", street: "Kurunegala Junction", lng: 80.6517, lat: 7.8731 },
  { city: "Nuwara Eliya", street: "Queen Elizabeth Drive", lng: 80.7829, lat: 6.9497 },
  { city: "Hatton", street: "Dimbula Road", lng: 80.5964, lat: 6.8917 },
  { city: "Gampola", street: "Ambagamuwa Road", lng: 80.5700, lat: 7.1642 },

  // Southern Province
  { city: "Galle", street: "Lighthouse Street, Fort", lng: 80.2170, lat: 6.0329 },
  { city: "Unawatuna", street: "Yaddehimulla Road", lng: 80.2492, lat: 6.0104 },
  { city: "Hikkaduwa", street: "Baddegama Road", lng: 80.1004, lat: 6.1408 },
  { city: "Matara", street: "Anagarika Dharmapala Mawatha", lng: 80.5469, lat: 5.9496 },
  { city: "Mirissa", street: "Udupila Road", lng: 80.4593, lat: 5.9482 },
  { city: "Weligama", street: "By-Pass Road", lng: 80.4287, lat: 5.9726 },
  { city: "Tangalle", street: "Kadiragoda Road", lng: 80.7941, lat: 6.0242 },
  { city: "Hambantota", street: "Tower Hill Road", lng: 81.1185, lat: 6.1246 },

  // Northern Province
  { city: "Jaffna", street: "Hospital Road", lng: 80.0074, lat: 9.6615 },
  { city: "Nallur", street: "Point Pedro Road", lng: 80.0298, lat: 9.6744 },
  { city: "Point Pedro", street: "Customs Road", lng: 80.2319, lat: 9.8167 },
  { city: "Kilinochchi", street: "A9 Highway", lng: 80.3982, lat: 9.3803 },
  { city: "Vavuniya", street: "Station Road", lng: 80.4982, lat: 8.7514 },
  { city: "Mannar", street: "Main Street", lng: 79.9044, lat: 8.9810 },

  // Eastern Province
  { city: "Trincomalee", street: "Dockyard Road", lng: 81.2335, lat: 8.5711 },
  { city: "Batticaloa", street: "Bar Road", lng: 81.6924, lat: 7.7170 },
  { city: "Arugam Bay", street: "Main Beach Road", lng: 81.8286, lat: 6.8428 },
  { city: "Kalmunai", street: "Rest House Road", lng: 81.8242, lat: 7.4144 },
  { city: "Pasikudah", street: "Coconut Cultural Park Way", lng: 81.5647, lat: 7.9254 },
  { city: "Ampara", street: "D.S. Senanayake Street", lng: 81.6747, lat: 7.2882 },

  // North Western, North Central & Uva/Sabaragamuwa
  { city: "Kurunegala", street: "Colombo Road", lng: 80.3649, lat: 7.4863 },
  { city: "Chilaw", street: "Bazaar Street", lng: 79.7953, lat: 7.5758 },
  { city: "Puttalam", street: "Kurunegala Road", lng: 79.8283, lat: 8.0362 },
  { city: "Anuradhapura", street: "Maithripala Senanayake Mawatha", lng: 80.4037, lat: 8.3114 },
  { city: "Polonnaruwa", street: "Batticaloa Road", lng: 81.0003, lat: 7.9403 },
  { city: "Badulla", street: "Lower King Street", lng: 81.0550, lat: 6.9895 },
  { city: "Bandarawela", street: "Badulla Road", lng: 80.9850, lat: 6.8290 },
  { city: "Ella", street: "Wellawaya Road", lng: 81.0466, lat: 6.8667 },
  { city: "Ratnapura", street: "Main Street", lng: 80.4034, lat: 6.6828 },
  { city: "Kegalle", street: "Kandy Road", lng: 80.3547, lat: 7.2513 }
];

// --------------------------------------------------------------------------
// BUSINESS CATEGORIES & CURATED DEAL TEMPLATES
// --------------------------------------------------------------------------
const CATEGORY_TEMPLATES = {
  Restaurant: {
    names: [
      "Royal Biryani House", "Colombo Curries & Grill", "Heritage Kitchen", "Spice Symphony",
      "Duplication Diner", "The Coastal Catch", "Lankan Claypot Bistro", "Ceylon Tandoori Hut",
      "Kandyan Hearth", "Harbor View Seafood", "Park Street Eatery", "Duplication Wok"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "Signature Jaffna Crab Curry & Steamed Basmati Combo",
        desc: "Whole wild-caught lagoon crab cooked in roasted Jaffna spices with steamed basmati rice and accompaniments.",
        orig: 4800,
        discPct: 35,
        img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Woodfired Margherita & Handmade Tagliatelle Meal for Two",
        desc: "Stone oven baked pizza with fresh local mozzarella paired with artisan handmade pasta and drinks.",
        orig: 3600,
        discPct: 30,
        img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  Cafe: {
    names: [
      "Duplication Roast Cafe", "The Coffee Vault", "Ceylon Artisan Roasters", "Duplication Brew Lab",
      "Old Dutch Bakehouse", "Cinnamon Grove Espresso", "Kandy Lake Roastery", "Fort Grounds Coffee",
      "Bespoke Beans Colombo", "The Daily Grind Galle", "Duplication Sourdough Bar", "Bakes & Brews"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "Two Single-Origin Flat Whites & Fresh French Croissants",
        desc: "Pairing two estate-grown Arabica coffees with freshly baked morning butter croissants.",
        orig: 2200,
        discPct: 40,
        img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Afternoon Iced Cinnamon Latte & Artisan Cheesecake Slice",
        desc: "Chilled Ceylon spiced espresso latte alongside our signature baked Basque burnt cheesecake.",
        orig: 1850,
        discPct: 30,
        img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  Fashion: {
    names: [
      "Silk & Cotton Boutique", "Auren Urban Wear", "Ceylon Batik Studio", "Havelock Tailors",
      "Heritage Handlooms", "Galle Fort Linen Co.", "Colombo Denim Collective", "Verve Streetwear",
      "Velvet & Thread", "Island Breeze Resortwear", "Kandy Regal Attire", "Duplication Apparel"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "Handcrafted 100% Linen Resort Shirt - Limited Batch",
        desc: "Breathable pure Ceylon linen shirts in neutral tones with mother-of-pearl buttons.",
        orig: 6500,
        discPct: 35,
        img: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Premium Heavyweight Cotton Tee Duo Pack",
        desc: "Two tailored preshrunk street-fit tees woven with combed cotton for all-day comfort.",
        orig: 4800,
        discPct: 30,
        img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  Electronics: {
    names: [
      "Apex Audio & Tech", "Colombo Gadget Hub", "CyberSound Systems", "Matrix Mobile Central",
      "SmartLife Peripherals", "IslandTech Store", "Kandy Digital Depot", "Pulse Gaming Lab",
      "Volt Accessories", "FutureVision Tech", "Galle Tech Terminal", "Byte & Wire Store"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "Wireless ANC Over-Ear Studio Headphones with 40h Battery",
        desc: "Active noise cancellation, deep bass dynamic drivers, and high-clarity calling microphone.",
        orig: 12500,
        discPct: 30,
        img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "65W GaN Dual USB-C Fast Charger & Braided Cable Pack",
        desc: "Ultra-compact travel charger compatible with MacBook, iPhone, and Android devices.",
        orig: 5500,
        discPct: 25,
        img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  "Health & Beauty": {
    names: [
      "Ayur Botanica Wellness", "Glow Herbal Lab", "Lotus Petal Spa", "Nirvana Ayurvedic Retreat",
      "Colombo Esthetics Studio", "Serene Touch Clinic", "Ceylon Herbal Alchemy", "Aura Holistic Lounge",
      "Eden Body Therapy", "Oasis Wellness Center", "Sandalwood Sanctuary", "Pure Botanical Spa"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "60-Min Full Body Herbal Oil Rejuvenation & Head Massage",
        desc: "Traditional warm herbal oil therapy followed by an invigorating neck, shoulder, and scalp massage.",
        orig: 7500,
        discPct: 40,
        img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Organic Turmeric & Aloe Hydrating Facial Treatment",
        desc: "Deep pore cleanse, gentle botanical scrub, and antioxidant hydrating mask for natural radiance.",
        orig: 5000,
        discPct: 35,
        img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  Salon: {
    names: [
      "Crowning Glory Studio", "Gentleman's Barber Co.", "Luxe Locks Colombo", "The Style Bar Kandy",
      "Shear Elegance Salon", "Urban Fade Parlor", "Velvet Scissor Studio", "Galle Fort Hair Craft",
      "Chic & Sleek Hair Lab", "The Grooming Lounge", "Tress & Trim Studio", "Blissful Hair Haven"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "Executive Haircut, Beard Sculpting & Refreshing Charcoal Mask",
        desc: "Precision fade or classic styling with straight-razor detailing, hot towel, and pore purifying mask.",
        orig: 3800,
        discPct: 35,
        img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Keratin Moisture Infusion & Professional Blowout Finish",
        desc: "Deep conditioning keratin treatment with split-end repair and sleek high-volume blowout.",
        orig: 6200,
        discPct: 30,
        img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  Fitness: {
    names: [
      "Iron Pulse Gym", "Titan Athletic Club", "CrossFit Horizon", "Apex Performance Lab",
      "Colombo Fitness Republic", "Kandy Powerhouse Gym", "The Workout Loft", "Galle Coast Fitness",
      "Velocity Strength Club", "Flex Studio Colombo", "Dynamic Conditioning", "Zenith Health & Gym"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "1-Month Unlimited Full Access Gym & Steam Room Pass",
        desc: "Full floor equipment access, cardio zones, locker facility, and weekend functional training classes.",
        orig: 9500,
        discPct: 35,
        img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Personal Training Kickstart Package (3 One-on-One Sessions)",
        desc: "Body composition analysis, personalized workout plan, and 3 supervised personal training sessions.",
        orig: 8000,
        discPct: 40,
        img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  Retail: {
    names: [
      "Ceylon Craft Emporium", "Colombo Leather Goods", "Island Living Store", "Galle Gem & Silver Co.",
      "Heritage Tea Gallery", "The Souvenir Station", "Spice & Scent Bazaar", "Artisan Woodworks Lanka",
      "Duplication Home Decor", "Kandy Handicraft Haven", "Ceylon Clay & Pottery", "The Vintage Bookshop"
    ],
    coverImages: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80"
    ],
    deals: [
      {
        title: "Single Estate Ceylon Black Tea Gift Trio Wooden Box",
        desc: "Three tin selection of Nuwara Eliya, Dimbula, and Ruhuna orthodox teas in handcrafted pine box.",
        orig: 4500,
        discPct: 30,
        img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80"
      },
      {
        title: "Hand-tooled Genuine Leather Bi-fold Wallet",
        desc: "Top-grain cowhide leather with RFID blocking slots and durable contrast stitching.",
        orig: 5200,
        discPct: 35,
        img: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80"
      }
    ]
  }
};

const CATEGORY_KEYS = Object.keys(CATEGORY_TEMPLATES);

// --------------------------------------------------------------------------
// SRI LANKAN NAMES DATASET FOR CLIENTS
// --------------------------------------------------------------------------
const FIRST_NAMES = [
  "Kasun", "Nadeesha", "Ahamed", "Dinuka", "Dilshan", "Fatima", "Nuwan", "Chamari",
  "Rizwan", "Shenal", "Pravin", "Anushka", "Kavindu", "Imran", "Tharindu", "Sithara",
  "Lahiru", "Hashan", "Maheshi", "Dharshana", "Suraj", "Dulani", "Ashan", "Farhan",
  "Naveen", "Sachini", "Gihan", "Sanjaya", "Chathura", "Manuja", "Hiruni", "Niroshan",
  "Dhammika", "Zainab", "Pradeep", "Malith", "Kushan", "Sanduni", "Ashen", "Danushka",
  "Buddhika", "Mohamed", "Charith", "Vindya", "Ravindu", "Ruwan", "Pabodha", "Isuru"
];

const LAST_NAMES = [
  "Perera", "Silva", "Fernando", "Jayasinghe", "Bandara", "Gunawardena", "Alwis",
  "Wickramasinghe", "Rathnayake", "Karunaratne", "Senanayake", "Liyanage", "Fonseka",
  "Abeysekara", "Azeez", "Mendis", "Herath", "Ranasinghe", "Wijesinghe", "Dissanayake",
  "Jayawardena", "Mohamed", "Farook", "Subramaniam", "Kulatunga", "Hettiarachchi", "Nanayakkara"
];

const REVIEW_COMMENTS = [
  "Seamless counter experience! Showed the QR code at the register and received the discount immediately.",
  "Great neighborhood find. The staff verified the pass in under 5 seconds with zero hassle.",
  "Genuine discount. Saved over 30% on my bill without any hidden fees or exclusions.",
  "Super fast lookup on their POS tablet. Will definitely watch for new passes here next week.",
  "Redeemed this morning on Galle Road. Excellent value and very clean shop setup.",
  "Loved the ambiance and friendly cashier. Pass was accepted right away with no questions asked.",
  "Super deal! The map view led me right to their store entrance. Highly recommended.",
  "Legit savings on authentic products. The counter staff knew exactly how to scan the code.",
  "Pleasantly surprised by the high quality. Smooth redemption directly on my phone screen.",
  "Top notch service! Claimed online in the afternoon and picked up before 6 PM without delay."
];

// Helper: Random pick
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --------------------------------------------------------------------------
// MAIN SEED FUNCTION
// --------------------------------------------------------------------------
async function seedDatabase() {
  console.log("=================================================================");
  console.log("   HITMEUP SEED ENGINE - 100 APPROVED MERCHANTS & 300 CLIENTS    ");
  console.log("=================================================================");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables!");
  }

  console.log("Connecting to MongoDB database...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully to:", mongoose.connection.name);

  // 1. Precompute bcrypt hashes for ultra-fast generation
  console.log("\nGenerating precomputed bcrypt password hashes...");
  const vendorPassword = process.env.SEED_VENDOR_PASSWORD;
  const clientPassword = process.env.SEED_CLIENT_PASSWORD;
  if (!vendorPassword || !clientPassword || vendorPassword.length < 12 || clientPassword.length < 12) {
    throw new Error("SEED_VENDOR_PASSWORD and SEED_CLIENT_PASSWORD must be provided and contain at least 12 characters.");
  }
  const [vendorHash, clientHash] = await Promise.all([
    bcrypt.hash(vendorPassword, 10),
    bcrypt.hash(clientPassword, 10)
  ]);
  console.log("Password hashes generated successfully.");

  // Clean existing seed collections (without deleting existing real admin users or user accounts not prefixed)
  console.log("\nCleaning previous automated seed entries...");
  const seedUsers = await User.find({ email: { $regex: /@(seedvendor|seedclient|hitmeup\.seed)/i } }).select("_id");
  const seedUserIds = seedUsers.map((u) => u._id);
  const seedBusinesses = await Business.find({ email: { $regex: /@(seedvendor|seedclient|hitmeup\.seed)/i } }).select("_id");
  const seedBusinessIds = seedBusinesses.map((b) => b._id);

  if (seedUserIds.length > 0 || seedBusinessIds.length > 0) {
    await Deal.deleteMany({
      $or: [
        { businessId: { $in: seedBusinessIds } },
        { terms: { $regex: /Present digital QR pass at the register/ } }
      ]
    });
    await Order.deleteMany({
      $or: [
        { customerId: { $in: seedUserIds } },
        { orderNumber: { $regex: /^ORD-SEED-/ } }
      ]
    });
    await Voucher.deleteMany({
      $or: [
        { customerId: { $in: seedUserIds } },
        { code: { $regex: /^HMU-/ } }
      ]
    });
    await Favorite.deleteMany({
      $or: [
        { userId: { $in: seedUserIds } },
        { businessId: { $in: seedBusinessIds } }
      ]
    });
    await Review.deleteMany({
      $or: [
        { userId: { $in: seedUserIds } },
        { businessId: { $in: seedBusinessIds } }
      ]
    });
    await Business.deleteMany({ email: { $regex: /@(seedvendor|seedclient|hitmeup\.seed)/i } });
    await User.deleteMany({ email: { $regex: /@(seedvendor|seedclient|hitmeup\.seed)/i } });
  }
  await Deal.deleteMany({ terms: { $regex: /Present digital QR pass at the register/ } });
  await Order.deleteMany({ orderNumber: { $regex: /^ORD-SEED-/ } });
  await Voucher.deleteMany({ code: { $regex: /^HMU-/ } });
  console.log("Previous seed records cleaned safely.");

  const allAccountRecords = [];

  // --------------------------------------------------------------------------
  // PART 1: 100 APPROVED MERCHANTS
  // --------------------------------------------------------------------------
  console.log("\nGenerating 100 Approved Merchants across 73 Sri Lankan locations...");
  const merchantUsersToInsert = [];
  const businessesToInsert = [];
  const dealsToInsert = [];

  for (let i = 1; i <= 100; i++) {
    const loc = LOCATIONS[(i - 1) % LOCATIONS.length];
    const category = CATEGORY_KEYS[(i - 1) % CATEGORY_KEYS.length];
    const template = CATEGORY_TEMPLATES[category];
    const bizBaseName = template.names[(i - 1) % template.names.length];
    const bizName = i > template.names.length ? `${bizBaseName} ${loc.city}` : bizBaseName;

    const emailSlug = bizName.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 15);
    const vendorEmail = `vendor.${emailSlug}${i}@hitmeup.seed.lk`;
    const vendorPhone = `077${String(1000000 + i).slice(-7)}`;
    const vendorName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

    const userId = new mongoose.Types.ObjectId();
    const businessId = new mongoose.Types.ObjectId();

    merchantUsersToInsert.push({
      _id: userId,
      name: vendorName,
      email: vendorEmail,
      password: vendorHash,
      role: "seller",
      phone: vendorPhone,
      businessId: businessId,
      isActive: true,
      isEmailVerified: true,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vendorName)}`
    });

    businessesToInsert.push({
      _id: businessId,
      name: bizName,
      category: category,
      description: `Verified neighborhood ${category.toLowerCase()} store in ${loc.city}. Flash voucher counter passes accepted daily.`,
      ownerId: userId,
      phone: vendorPhone,
      email: vendorEmail,
      address: {
        street: loc.street,
        city: loc.city,
        state: "Sri Lanka",
        postalCode: String(10000 + (i % 9000)),
        country: "Sri Lanka"
      },
      location: {
        type: "Point",
        coordinates: [loc.lng, loc.lat]
      },
      openingHours: "08:30 AM - 09:30 PM",
      coverImageUrl: pick(template.coverImages),
      logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(bizName)}`,
      isVerified: true,
      status: "active",
      applicationStatus: "approved",
      reviewedAt: new Date()
    });

    allAccountRecords.push({
      Type: "Vendor",
      Name: vendorName,
      Email: vendorEmail,
      Password: vendorPassword,
      Role: "seller",
      BusinessName: bizName,
      Category: category,
      City: loc.city
    });

    // Create 1 to 2 Deals for each business
    const dealCount = i % 3 === 0 ? 2 : 1;
    for (let d = 0; d < dealCount; d++) {
      const dealTemplate = template.deals[d % template.deals.length];
      const orig = dealTemplate.orig + (i % 5) * 200;
      const discPct = dealTemplate.discPct;
      const discPrice = Math.round(orig * (1 - discPct / 100));

      const dealId = new mongoose.Types.ObjectId();
      // Future end date: between 7 and 21 days from now
      const daysAhead = 7 + (i % 14);
      const endDate = new Date(Date.now() + daysAhead * 24 * 3600 * 1000);

      dealsToInsert.push({
        _id: dealId,
        title: dealTemplate.title,
        description: dealTemplate.desc,
        businessId: businessId,
        category: category,
        originalPrice: orig,
        discountPercentage: discPct,
        discountedPrice: discPrice,
        startDate: new Date(),
        endDate: endDate,
        status: "active",
        imageUrl: dealTemplate.img,
        availableQuantity: randomInt(20, 50),
        claimedQuantity: randomInt(0, 8),
        terms: "Valid during store operating hours. Present digital QR pass at the register."
      });
    }
  }

  console.log(`Inserting ${merchantUsersToInsert.length} Vendor Users...`);
  await User.insertMany(merchantUsersToInsert);
  console.log(`Inserting ${businessesToInsert.length} Approved Businesses...`);
  await Business.insertMany(businessesToInsert);
  console.log(`Inserting ${dealsToInsert.length} Active Unexpired Deals...`);
  await Deal.insertMany(dealsToInsert);

  // --------------------------------------------------------------------------
  // PART 2: 300 CLIENTS (CUSTOMERS)
  // --------------------------------------------------------------------------
  console.log("\nGenerating 300 Clients (Customers)...");
  const clientUsersToInsert = [];

  for (let i = 1; i <= 300; i++) {
    const fName = pick(FIRST_NAMES);
    const lName = pick(LAST_NAMES);
    const fullName = `${fName} ${lName}`;
    const cleanFName = fName.toLowerCase().replace(/[^a-z]/g, "");
    const cleanLName = lName.toLowerCase().replace(/[^a-z]/g, "");
    const clientEmail = `client.${cleanFName}.${cleanLName}.${i}@hitmeup.seed.lk`;
    const clientPhone = `071${String(2000000 + i).slice(-7)}`;

    clientUsersToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      name: fullName,
      email: clientEmail,
      password: clientHash,
      role: "customer",
      phone: clientPhone,
      isActive: true,
      isEmailVerified: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`
    });

    allAccountRecords.push({
      Type: "Client",
      Name: fullName,
      Email: clientEmail,
      Password: clientPassword,
      Role: "customer",
      BusinessName: "N/A",
      Category: "N/A",
      City: pick(LOCATIONS).city
    });
  }

  console.log(`Inserting ${clientUsersToInsert.length} Customer Accounts...`);
  await User.insertMany(clientUsersToInsert);

  // --------------------------------------------------------------------------
  // PART 3: SIMULATE REAL USER ACTIONS (VOUCHERS, FAVORITES, REVIEWS)
  // --------------------------------------------------------------------------
  console.log("\nSimulating Customer Activity (Orders, Vouchers, Favorites, Reviews)...");
  const ordersToInsert = [];
  const vouchersToInsert = [];
  const favoritesToInsert = [];
  const reviewsToInsert = [];

  // Vouchers & Orders (~300 vouchers)
  for (let i = 0; i < clientUsersToInsert.length; i++) {
    const customer = clientUsersToInsert[i];
    const deal = dealsToInsert[i % dealsToInsert.length];
    const isRedeemed = i % 3 === 0;

    const orderId = new mongoose.Types.ObjectId();
    const voucherId = new mongoose.Types.ObjectId();
    const orderNumber = `HMU-ORD-${20260000 + i}`;
    const voucherCode = `HMU-PASS-${String(1000 + i)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    ordersToInsert.push({
      _id: orderId,
      orderNumber,
      customerId: customer._id,
      dealId: deal._id,
      businessId: deal.businessId,
      quantity: 1,
      unitPrice: deal.discountedPrice,
      subtotal: deal.discountedPrice,
      totalAmount: deal.discountedPrice,
      amount: deal.discountedPrice,
      currency: "LKR",
      status: "COMPLETED",
      orderStatus: "COMPLETED",
      paymentStatus: "SUCCESS",
      dealSnapshot: {
        title: deal.title,
        imageUrl: deal.imageUrl,
        merchantName: "Verified Partner",
        category: deal.category
      },
      expiresAt: deal.endDate
    });

    vouchersToInsert.push({
      _id: voucherId,
      orderId,
      customerId: customer._id,
      dealId: deal._id,
      code: voucherCode,
      qrData: JSON.stringify({
        code: voucherCode,
        dealId: deal._id.toString(),
        customerId: customer._id.toString(),
        expiresAt: deal.endDate
      }),
      status: isRedeemed ? "REDEEMED" : "ACTIVE",
      expiresAt: deal.endDate,
      redeemedAt: isRedeemed ? new Date(Date.now() - randomInt(1, 48) * 3600 * 1000) : null
    });

    // Favorites (each client favorites 1-3 deals from distinct businesses)
    const usedBizIds = new Set();
    const favCount = 1 + (i % 3);
    for (let f = 0; f < favCount; f++) {
      const dealIdx = (i * 7 + f * 11) % dealsToInsert.length;
      const favDeal = dealsToInsert[dealIdx];
      const bizIdStr = favDeal.businessId.toString();
      if (!usedBizIds.has(bizIdStr)) {
        usedBizIds.add(bizIdStr);
        favoritesToInsert.push({
          userId: customer._id,
          dealId: favDeal._id,
          businessId: favDeal.businessId
        });
      }
    }

    // Reviews (~200 verified reviews)
    if (i % 3 !== 2) {
      reviewsToInsert.push({
        userId: customer._id,
        businessId: deal.businessId,
        dealId: deal._id,
        rating: i % 7 === 0 ? 4 : 5,
        comment: pick(REVIEW_COMMENTS)
      });
    }
  }

  console.log(`Inserting ${ordersToInsert.length} Orders & Vouchers...`);
  await Order.insertMany(ordersToInsert);
  await Voucher.insertMany(vouchersToInsert);

  console.log(`Inserting ${favoritesToInsert.length} User Bookmarks/Favorites...`);
  await Favorite.insertMany(favoritesToInsert);

  console.log(`Inserting ${reviewsToInsert.length} Customer Reviews & Ratings...`);
  await Review.insertMany(reviewsToInsert);

  // --------------------------------------------------------------------------
  // PART 4: EXPORT CREDENTIALS (CSV & JSON)
  // --------------------------------------------------------------------------
  console.log("\nExporting all 400 account credentials...");
  const seedsDir = path.join(__dirname);
  const csvPath = path.join(seedsDir, "test_accounts.csv");
  const jsonPath = path.join(seedsDir, "test_accounts.json");

  // CSV format
  const csvHeaders = "Type,Name,Email,Password,Role,BusinessName,Category,City\n";
  const csvRows = allAccountRecords
    .map((r) => `"${r.Type}","${r.Name}","${r.Email}","${r.Password}","${r.Role}","${r.BusinessName}","${r.Category}","${r.City}"`)
    .join("\n");
  fs.writeFileSync(csvPath, csvHeaders + csvRows, "utf-8");

  // JSON format
  fs.writeFileSync(jsonPath, JSON.stringify(allAccountRecords, null, 2), "utf-8");

  console.log("Credentials successfully exported to:");
  console.log(" -> CSV :", csvPath);
  console.log(" -> JSON:", jsonPath);

  console.log("\n=================================================================");
  console.log("                   SEEDING COMPLETED SUCCESSFULLY                ");
  console.log("=================================================================");
  console.log(` Total Vendors Seeded   : ${businessesToInsert.length} (All Approved)`);
  console.log(` Total Locations Spanned : ${LOCATIONS.length} Real Sri Lankan Cities`);
  console.log(` Total Active Deals     : ${dealsToInsert.length}`);
  console.log(` Total Clients Seeded   : ${clientUsersToInsert.length}`);
  console.log(` Total Vouchers/Orders  : ${vouchersToInsert.length}`);
  console.log(` Total Bookmarks/Favs   : ${favoritesToInsert.length}`);
  console.log(` Total Reviews Logged   : ${reviewsToInsert.length}`);
  console.log(` Total Credentials Saved: ${allAccountRecords.length}`);
  console.log("=================================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error("FATAL SEEDING ERROR:", err);
  process.exit(1);
});
