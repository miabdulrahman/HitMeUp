/**
 * Calculates live remaining time and expiration status for a deal
 * @param {Object} deal - Deal object with endDate, startDate, status, etc.
 * @returns {Object} { isExpired, text, secondsLeft, isUrgent }
 */
export function calculateDealTimer(deal) {
  if (!deal) {
    return { isExpired: true, text: "Expired", secondsLeft: 0, isUrgent: false };
  }

  // Explicit expired status
  if (deal.status === "expired" || deal.status === "cancelled") {
    return { isExpired: true, text: "Expired", secondsLeft: 0, isUrgent: false };
  }

  let endTimestamp = null;

  if (deal.endDate) {
    const parsed = new Date(deal.endDate).getTime();
    if (!isNaN(parsed) && parsed > 0) endTimestamp = parsed;
  } else if (deal.expiresAt) {
    const parsed = new Date(deal.expiresAt).getTime();
    if (!isNaN(parsed) && parsed > 0) endTimestamp = parsed;
  } else if (deal.createdAt && deal.durationHours) {
    const parsed = new Date(deal.createdAt).getTime();
    if (!isNaN(parsed)) {
      endTimestamp = parsed + Number(deal.durationHours) * 3600 * 1000;
    }
  }

  // Handle deals with relative countdown seconds (e.g. sample passes)
  if (!endTimestamp) {
    if (typeof deal.initialSeconds === "number" && deal.initialSeconds > 0) {
      const remaining = Math.max(0, deal.initialSeconds);
      if (remaining <= 0) {
        return { isExpired: true, text: "Expired", secondsLeft: 0, isUrgent: false };
      }
      return formatSeconds(remaining);
    }

    // Fallback: Default 24h window from now if no end date was saved
    return { isExpired: false, text: deal.time || "Active today", secondsLeft: 86400, isUrgent: false };
  }

  const now = Date.now();
  const diffMs = endTimestamp - now;

  if (diffMs <= 0) {
    return { isExpired: true, text: "Expired", secondsLeft: 0, isUrgent: false };
  }

  const totalSecs = Math.floor(diffMs / 1000);
  return formatSeconds(totalSecs);
}

function formatSeconds(totalSecs) {
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  let text;
  if (days > 1) {
    text = `${days}d ${hours}h left`;
  } else if (days === 1) {
    text = `1d ${hours}h left`;
  } else if (hours > 0) {
    text = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s left`;
  } else if (minutes > 0) {
    text = `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s left`;
  } else {
    text = `${seconds}s left`;
  }

  return {
    isExpired: false,
    text,
    secondsLeft: totalSecs,
    isUrgent: totalSecs < 3600, // Less than 1 hour remaining
  };
}

/**
 * Checks if a deal is strictly expired
 */
export function isDealExpired(deal) {
  if (!deal) return true;
  if (deal.status === "expired" || deal.status === "cancelled") return true;
  if (deal.endDate) {
    const end = new Date(deal.endDate).getTime();
    if (!isNaN(end) && end <= Date.now()) return true;
  }
  return false;
}

