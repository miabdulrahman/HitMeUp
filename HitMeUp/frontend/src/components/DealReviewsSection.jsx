import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, CheckCircle2, User } from "lucide-react";
import { discoveryApi } from "../services/api";
import { useAuth } from "../context/useAuth";

function DealReviewsSection({ businessId, dealId }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(5.0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form State
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
      setError("Please log in to submit a review.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a brief comment.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await discoveryApi.addReview({
        businessId,
        dealId,
        rating,
        comment: comment.trim()
      });
      setSubmitted(true);
      setComment("");
      loadReviews();
    } catch (err) {
      setError(err.message || "Failed to post review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-[#E8503A]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Customer Reviews & Ratings
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1 text-xs font-black text-amber-900">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          <span>{avgRating.toFixed(1)}</span>
          <span className="text-gray-400 font-medium">({totalReviews})</span>
        </div>
      </div>

      {/* Write Review Form */}
      <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 mb-5">
        <h4 className="text-xs font-bold text-gray-700 mb-2">
          Share your experience with this merchant
        </h4>

        {submitted ? (
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold py-2">
            <CheckCircle2 size={16} />
            <span>Thank you! Your verified review has been posted.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Star Rating Select */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    size={18}
                    className={`${
                      (hoverRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-gray-500 ml-2">
                {rating} / 5 Stars
              </span>
            </div>

            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the quality, service, and redemption process?..."
              className="w-full rounded-xl bg-white p-3 text-xs text-gray-900 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-[#E8503A]"
            />

            {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#172026] px-4 py-2 text-xs font-bold text-white hover:bg-[#E8503A] transition disabled:opacity-50 cursor-pointer"
            >
              <Send size={12} />
              <span>{submitting ? "Posting..." : "Post Review"}</span>
            </button>
          </form>
        )}
      </div>

      {/* Recent Reviews List */}
      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-xs text-gray-400 italic">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-gray-500">
            No reviews yet. Be the first to leave a review!
          </p>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev._id}
              className="rounded-xl border border-gray-100 bg-white p-3 shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <User size={12} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {rev.userId?.name || "Verified Customer"}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={
                        i < rev.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DealReviewsSection;
