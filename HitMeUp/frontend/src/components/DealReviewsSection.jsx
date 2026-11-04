import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, CheckCircle2, User } from "lucide-react";
import { discoveryApi } from "../services/api";
import { useAuth } from "../context/useAuth";

function DealReviewsSection({ businessId, dealId }) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(5.0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (businessId) {
      loadReviews();
    }
  }, [businessId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await discoveryApi.getBusinessReviews(businessId);
      setReviews(res.reviews || []);
      setAvgRating(res.averageRating || 5.0);
      setTotalReviews(res.total || 0);
    } catch (err) {
      console.warn("Failed to load reviews:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("Please log in to leave a review");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a short note about your visit");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await discoveryApi.addReview({
        businessId,
        dealId,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
      setComment("");
      loadReviews();
    } catch (err) {
      setError(err.message || "Could not post review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t border-[#E6E0D6] pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} strokeWidth={1.5} className="text-[#5E554A]" />
          <h3 className="text-[14px] font-medium text-[#1F1B16]">
            Shopper reviews
          </h3>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-[#E6E0D6] bg-[#F7F4EE] px-2.5 py-1 font-mono text-[12px] text-[#1F1B16] tabular-nums">
          <Star size={12} strokeWidth={1.5} className="fill-[#B45309] text-[#B45309]" />
          <span className="font-medium">{avgRating.toFixed(1)}</span>
          <span className="text-[#7B7266]">({totalReviews})</span>
        </div>
      </div>

      {/* Write Review Form */}
      <div className="mb-5 rounded-xl border border-[#E6E0D6] bg-[#F7F4EE] p-4">
        <h4 className="mb-2 text-[12px] font-medium text-[#5E554A]">
          Leave a note on this merchant
        </h4>

        {submitted ? (
          <div className="flex items-center gap-2 py-2 text-[13px] font-medium text-[#166534]">
            <CheckCircle2 size={15} strokeWidth={1.5} />
            <span>Your review has been posted</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    size={16}
                    strokeWidth={1.5}
                    className={
                      (hoverRating || rating) >= star
                        ? "fill-[#B45309] text-[#B45309]"
                        : "text-[#D1C9BC]"
                    }
                  />
                </button>
              ))}
              <span className="ml-2 font-mono text-[12px] text-[#7B7266] tabular-nums">
                {rating} / 5
              </span>
            </div>

            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the item quality and counter redemption?"
              className="w-full rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] p-3 text-[13px] text-[#1F1B16] placeholder:text-[#7B7266] focus:border-[#D94832] focus:outline-none"
            />

            {error && <p className="text-[12px] text-[#B91C1C]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1F1B16] px-3.5 text-[12px] font-medium text-[#FDFBF7] transition-colors hover:bg-[#D94832] disabled:opacity-50 cursor-pointer"
            >
              <Send size={12} strokeWidth={1.5} />
              <span>{submitting ? "Posting..." : "Post review"}</span>
            </button>
          </form>
        )}
      </div>

      {/* Recent Reviews List */}
      <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-[12px] text-[#7B7266]">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-[12px] text-[#7B7266]">
            No reviews recorded for this merchant yet
          </p>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev._id}
              className="rounded-lg border border-[#E6E0D6] bg-white p-3"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F7F4EE] text-[#5E554A]">
                    <User size={12} strokeWidth={1.5} />
                  </div>
                  <span className="text-[12px] font-medium text-[#1F1B16]">
                    {rev.userId?.name || "Shopper"}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      strokeWidth={1.5}
                      className={
                        i < rev.rating
                          ? "fill-[#B45309] text-[#B45309]"
                          : "text-[#E6E0D6]"
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="text-[12px] leading-relaxed text-[#5E554A]">
                {rev.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DealReviewsSection;
