import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import "../styles/AdminFirstOrderReward.css";

const FINAL_STATUSES = ["approved", "rejected"];
const REWARD_STATUSES = ["pending", ...FINAL_STATUSES];

const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminFirstOrderReward = ({ order, orderUser, onReviewed }) => {
  const orderId = String(order?._id || "");
  const snapshot = order?.firstOrderReward;
  console.log(order);
  
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState("");
  const [reviewedStatus, setReviewedStatus] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const pendingController = useRef(null);
  const reviewInFlight = useRef(false);
  const skipInitialLookup = useRef(FINAL_STATUSES.includes(snapshot?.status));

  const loadPendingRequest = useCallback(async () => {
    pendingController.current?.abort();
    const controller = new AbortController();
    pendingController.current = controller;
    setLoading(true);
    setError("");

    try {
      for (let page = 0; page <= 10000; page += 1) {
        const response = await fetch(
          SummaryApi.admin_first_order_rewards.url(page),
          {
            method: SummaryApi.admin_first_order_rewards.method,
            headers: authHeaders(),
            credentials: "include",
            signal: controller.signal,
          },
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Could not load first-order requests");
        }
        if (!Array.isArray(result.data)) {
          throw new Error("First-order request response is missing request data");
        }

        const match = result.data.find(
          (candidate) =>
            String(candidate?.request?.firstOrderRewardOrderId || "") === orderId,
        );
        if (match || result.data.length < 50) {
          if (mounted.current && !controller.signal.aborted) {
            setEntry(match || null);
          }
          return;
        }
      }
      throw new Error("Could not finish loading first-order requests. Please retry.");
    } catch (loadError) {
      if (mounted.current && !controller.signal.aborted) {
        setError(loadError.message || "Could not load first-order requests");
      }
    } finally {
      if (mounted.current && pendingController.current === controller) {
        setLoading(false);
      }
    }
  }, [orderId]);

  
  useEffect(() => {
    mounted.current = true;
    if (skipInitialLookup.current) {
      setLoading(false);
    } else {
      loadPendingRequest();
    }
    return () => {
      mounted.current = false;
      pendingController.current?.abort();
    };
  }, [loadPendingRequest]);

  const snapshotFinalStatus = FINAL_STATUSES.includes(snapshot?.status)
    ? snapshot.status
    : "";
  const status =
    snapshotFinalStatus ||
    reviewedStatus ||
    entry?.request?.firstOrderRewardStatus ||
    (entry ? "pending" : snapshot?.status);
  const rewardPoints =
    entry?.request?.firstOrderRewardPoints ?? snapshot?.rewardPoints;
  const rewardUser = FINAL_STATUSES.includes(status)
    ? orderUser || entry?.user
    : entry?.user || orderUser;
  const canReview = Boolean(entry) && status === "pending";

  const reviewReward = async (nextStatus) => {
    if (
      !canReview ||
      loading ||
      reviewInFlight.current ||
      !FINAL_STATUSES.includes(nextStatus)
    ) {
      return;
    }
    reviewInFlight.current = true;
    setReviewing(nextStatus);
    setError("");

     try {
      const response = await fetch(
        SummaryApi.admin_review_first_order_reward.url(orderId),
        {
          method: SummaryApi.admin_review_first_order_reward.method,
          headers: { "Content-Type": "application/json", ...authHeaders() },
          credentials: "include",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Could not review first-order request");
      }

      if (mounted.current) {
        setReviewedStatus(nextStatus);
      }
      toast.success(result.message || `First-order reward ${nextStatus}`);
      onReviewed?.(orderId, nextStatus, rewardPoints);
      // Refresh failures are handled as loading errors, never as a failed review.
      if (mounted.current) {
        await loadPendingRequest();
      }
    } catch (reviewError) {
      const message = reviewError.message || "Could not review first-order request";
      if (mounted.current) {
        setError(message);
      }
      toast.error(message);
    } finally {
      reviewInFlight.current = false;
      if (mounted.current) {
        setReviewing("");
      }
    }
  };

  console.log(REWARD_STATUSES, reviewedStatus, entry);
  

  if (!entry && !REWARD_STATUSES.includes(snapshot?.status) && !reviewedStatus) {
    return null;
  }

   return (
    <section className="admin-reward" aria-label="First-order reward">
      <h4 className="admin-reward-title">First-order reward</h4>
      <div className="admin-reward-card">
        <div className="admin-reward-header">
          <div>
            <p className="admin-reward-name">
              {rewardUser?.name || order?.shippingDetails?.name || "Customer"}
            </p>
            {rewardUser?.email && (
              <p className="admin-reward-detail">{rewardUser.email}</p>
            )}
          </div>
          {REWARD_STATUSES.includes(status) && (
            <span className={`admin-reward-status admin-reward-${status}`}>
              {status}
            </span>
          )}
        </div>

        <p className="admin-reward-detail">Order ID: {orderId}</p>
        <div className="admin-reward-points">
          <p>
            Reward points: <strong>{rewardPoints ?? "-"}</strong>
          </p>
          {typeof rewardUser?.point === "number" && Number.isFinite(rewardUser.point) && (
            <p>
              Point balance: <strong>{rewardUser.point}</strong>
            </p>
          )}
        </div>

        {loading && (
          <p className="admin-reward-detail" role="status">
            Loading pending reward request...
          </p>
        )}
        {error && (
          <div className="admin-reward-error">
            <p role="alert">{error}</p>
            <button
              type="button"
              className="admin-reward-retry"
              disabled={loading || Boolean(reviewing)}
              onClick={loadPendingRequest}
            >
              Retry loading requests
            </button>
          </div>
        )}
        {status === "pending" && (
          <div className="admin-reward-actions">
            <button
              type="button"
              className="admin-reward-approve"
              disabled={!canReview || loading || Boolean(reviewing)}
              onClick={() => reviewReward("approved")}
            >
              {reviewing === "approved" ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              className="admin-reward-reject"
              disabled={!canReview || loading || Boolean(reviewing)}
              onClick={() => reviewReward("rejected")}
            >
              {reviewing === "rejected" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        )}
        {!loading && !error && status === "pending" && !entry && (
          <p className="admin-reward-detail">
            No pending request was found for this order.
          </p>
        )}
      </div>
    </section>
  );
};

export default AdminFirstOrderReward;

  
