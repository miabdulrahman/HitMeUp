import {
  Utensils,
  Shirt,
  Headphones,
  Home,
  HeartPulse,
  Dumbbell,
  Scissors,
  Gamepad2,
} from "lucide-react";

export const categories = [
  {
    id: "food",
    name: "Food",
    slug: "food",
    icon: Utensils,
    description: "Delicious limited-time flash discounts on meals, burgers, artisan pizzas, and cafe treats.",
    color: "#E8503A",
    badge: "Most Popular",
    dealCount: 4,
  },
  {
    id: "fashion",
    name: "Fashion",
    slug: "fashion",
    icon: Shirt,
    description: "Trending apparel, street fashion, footwear, and designer accessories at steep markdowns.",
    color: "#6366F1",
    badge: "Trending",
    dealCount: 4,
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    icon: Headphones,
    description: "Smart audio, high-speed chargers, gaming peripherals, and modern tech gear.",
    color: "#0EA5E9",
    badge: "Hot Tech",
    dealCount: 4,
  },
  {
    id: "home",
    name: "Home",
    slug: "home",
    icon: Home,
    description: "Furniture specials, deep cleaning vouchers, bedding luxury, and ambient home decor.",
    color: "#10B981",
    badge: "Essential",
    dealCount: 4,
  },
  {
    id: "health",
    name: "Health",
    slug: "health",
    icon: HeartPulse,
    description: "Medical lab screenings, dental scaling, Ayurvedic spa therapies, and optical deals.",
    color: "#EC4899",
    badge: "Wellness",
    dealCount: 4,
  },
  {
    id: "sports",
    name: "Sports",
    slug: "sports",
    icon: Dumbbell,
    description: "Gym memberships, indoor sports court bookings, running footwear, and training gear.",
    color: "#F59E0B",
    badge: "Active",
    dealCount: 4,
  },
  {
    id: "services",
    name: "Services",
    slug: "services",
    icon: Scissors,
    description: "Auto detailing, premium salon styling, AC maintenance, and professional studio shoots.",
    color: "#8B5CF6",
    badge: "Top Rated",
    dealCount: 4,
  },
  {
    id: "games",
    name: "Games",
    slug: "games",
    icon: Gamepad2,
    description: "VR arcade passes, esports gaming cafes, tabletop board game nights, and laser tag arenas.",
    color: "#14B8A6",
    badge: "Fun & Leisure",
    dealCount: 4,
  },
];

export const categoryMapping = {
  food: ["food", "restaurant", "cafe", "dining", "bakery", "groceries", "beverage", "beverages", "dessert", "kottu", "burger", "pizza", "meal"],
  fashion: ["fashion", "clothing", "apparel", "retail", "footwear", "accessories", "shoes", "wear"],
  electronics: ["electronics", "tech", "gadget", "gadgets", "computer", "computers", "phone", "phones", "audio", "headphone"],
  home: ["home", "furniture", "decor", "appliances", "cleaning", "living", "kitchen"],
  health: ["health", "beauty", "salon", "spa", "fitness", "wellness", "medical", "clinic", "dental"],
  sports: ["sports", "fitness", "gym", "athletics", "outdoor", "workout", "training"],
  services: ["services", "automotive", "repair", "cleaning", "maintenance", "consulting", "photography", "salon", "service"],
  games: ["games", "gaming", "arcade", "entertainment", "esports", "board game"]
};

export const normalizeCategory = (catName) => {
  if (!catName) return "Food";
  const lower = catName.trim().toLowerCase();
  for (const [key, synonyms] of Object.entries(categoryMapping)) {
    if (key === lower || synonyms.some((s) => lower.includes(s) || s.includes(lower))) {
      const match = categories.find((c) => c.slug === key);
      return match ? match.name : "Food";
    }
  }
  return catName;
};

export const getCategorySlug = (catName) => {
  if (!catName) return "food";
  const lower = catName.trim().toLowerCase();
  for (const [key, synonyms] of Object.entries(categoryMapping)) {
    if (key === lower || synonyms.some((s) => lower.includes(s) || s.includes(lower))) {
      return key;
    }
  }
  const match = categories.find((c) => c.name.toLowerCase() === lower || c.slug === lower);
  return match ? match.slug : "food";
};