/**
 * Main Sri Lankan cities across all 9 provinces including Colombo 01 - 15
 * for merchant store area auto-suggestion.
 */

export const SRI_LANKA_LOCATIONS = [
  // Colombo Districts (1 - 15)
  "Colombo 01 (Fort)",
  "Colombo 02 (Slave Island)",
  "Colombo 03 (Kollupitiya)",
  "Colombo 04 (Bambalapitiya)",
  "Colombo 05 (Havelock Town / Kirulapone)",
  "Colombo 06 (Wellawatte)",
  "Colombo 07 (Cinnamon Gardens)",
  "Colombo 08 (Borella)",
  "Colombo 09 (Dematagoda)",
  "Colombo 10 (Maradana)",
  "Colombo 11 (Pettah)",
  "Colombo 12 (Hultsdorf)",
  "Colombo 13 (Kotahena)",
  "Colombo 14 (Grandpass)",
  "Colombo 15 (Mutwal / Modara)",

  // Western Province (Greater Colombo, Gampaha, Kalutara)
  "Dehiwala",
  "Mount Lavinia",
  "Moratuwa",
  "Nugegoda",
  "Maharagama",
  "Kottawa",
  "Battaramulla",
  "Rajagiriya",
  "Malabe",
  "Kaduwela",
  "Homagama",
  "Piliyandala",
  "Negombo",
  "Gampaha",
  "Kelaniya",
  "Wattala",
  "Ja-Ela",
  "Kadawatha",
  "Kiribathgoda",
  "Panadura",
  "Kalutara",
  "Horana",

  // Central Province (Kandy, Matale, Nuwara Eliya)
  "Kandy City",
  "Peradeniya",
  "Katugastota",
  "Gampola",
  "Matale",
  "Dambulla",
  "Nuwara Eliya",
  "Hatton",

  // Southern Province (Galle, Matara, Hambantota)
  "Galle City",
  "Galle Fort",
  "Hikkaduwa",
  "Unawatuna",
  "Ambalangoda",
  "Matara City",
  "Weligama",
  "Mirissa",
  "Tangalle",
  "Hambantota",

  // Northern Province (Jaffna, Kilinochchi, Vavuniya, Mannar, Mullaitivu)
  "Jaffna City",
  "Nallur",
  "Chavakachcheri",
  "Point Pedro",
  "Kilinochchi",
  "Vavuniya",
  "Mannar",
  "Mullaitivu",

  // Eastern Province (Trincomalee, Batticaloa, Ampara)
  "Trincomalee",
  "Batticaloa",
  "Kattankudy",
  "Kalmunai",
  "Ampara",
  "Sammanthurai",
  "Akkaraipattu",
  "Arugam Bay",
  "Pottuvil",

  // North Western Province (Kurunegala, Puttalam)
  "Kurunegala",
  "Kuliyapitiya",
  "Puttalam",
  "Chilaw",
  "Wennappuwa",

  // North Central Province (Anuradhapura, Polonnaruwa)
  "Anuradhapura",
  "Polonnaruwa",
  "Kekirawa",
  "Habarana",

  // Uva Province (Badulla, Monaragala)
  "Badulla",
  "Bandarawela",
  "Ella",
  "Haputale",
  "Monaragala",
  "Mahiyanganaya",

  // Sabaragamuwa Province (Ratnapura, Kegalle)
  "Ratnapura",
  "Balangoda",
  "Embilipitiya",
  "Kegalle",
  "Mawanella"
];

/**
 * Filter suggestions matching user input.
 * Only returns results when query has text.
 * When a letter or prefix is typed (e.g. "K", "C"), it returns ONLY cities starting with that query.
 */
export const searchLocations = (query, limit = 10) => {
  if (!query || !query.trim()) {
    return [];
  }

  const q = query.trim().toLowerCase();

  // Normalize queries like "colombo 1" to match "Colombo 01"
  const normalizedQuery = q
    .replace(/^colombo\s+([1-9])$/, "colombo 0$1")
    .replace(/^colombo([1-9])$/, "colombo 0$1")
    .replace(/^col\s*0?([1-9]|1[0-5])$/, "colombo 0$1");

  // Find all cities starting with the query (prefix matching)
  const startsWithMatches = SRI_LANKA_LOCATIONS.filter((loc) => {
    const locLower = loc.toLowerCase();
    return locLower.startsWith(q) || locLower.startsWith(normalizedQuery);
  });

  // If prefix matches exist (e.g. typing 'k' matches only 'K...' cities), return ONLY them
  if (startsWithMatches.length > 0) {
    return startsWithMatches.slice(0, limit);
  }

  // Fallback for sub-areas/landmarks (e.g. typing "Fort" -> "Colombo 01 (Fort)", "Galle Fort")
  // Only triggered when at least 3 characters are typed and no city starts with the query
  if (q.length >= 3) {
    return SRI_LANKA_LOCATIONS.filter((loc) => {
      const locLower = loc.toLowerCase();
      return locLower.includes(q) || locLower.includes(normalizedQuery);
    }).slice(0, limit);
  }

  return [];
};
