const META_CURRENCY = "BDT";
const PURCHASE_STORAGE_PREFIX = "meta_purchase_tracked:";
const trackedCancellationOrderIds = new Set();

export const trackMetaEvent = (eventName, params = {}) => {
  if (
    typeof window === "undefined" ||
    typeof window.fbq !== "function" ||
    !eventName
  ) {
    return false;
  }

  window.fbq("track", eventName, params);
  return true;
};

export const trackMetaCommerceEvent = (eventName, params = {}) =>
  trackMetaEvent(eventName, { ...params, currency: META_CURRENCY });

export const trackMetaCustomEvent = (eventName, params = {}) => {
  if (
    typeof window === "undefined" ||
    typeof window.fbq !== "function" ||
    !eventName
  ) {
    return false;
  }

  window.fbq("trackCustom", eventName, params);
  return true;
};

export const trackMetaOrderCancellation = (
  order,
  cancelledBy,
  cancellationReason
) => {
  const orderId = order?._id || order?.orderId;
  const backendAlreadyTracked =
    order?.metaCancellationTrackedAt ||
    order?.metaEvents?.cancellationTrackedAt;

  if (!orderId || backendAlreadyTracked || trackedCancellationOrderIds.has(String(orderId))) {
    return false;
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  const defaultReason = cancelledBy === "admin" ? "admin_cancelled" : "not_provided";
  const tracked = trackMetaCustomEvent("OrderCancelled", {
    order_id: String(orderId),
    value: Number(order?.totalAmount || 0),
    currency: META_CURRENCY,
    content_ids: items.map((item) =>
      String(item?.productId?._id || item?.productId)
    ),
    contents: items.map((item) => ({
      id: String(item?.productId?._id || item?.productId),
      quantity: Number(item?.quantity || 1),
      item_price: Number(
        item?.price ||
          item?.sellingPrice ||
          item?.productId?.sellingPrice ||
          0
      ),
    })),
    num_items: items.reduce(
      (sum, item) => sum + Number(item?.quantity || 1),
      0
    ),
    cancelled_by: cancelledBy,
    cancellation_reason: cancellationReason || defaultReason,
  });

  if (tracked) trackedCancellationOrderIds.add(String(orderId));
  return tracked;
};

// Keep the successful order identifier in localStorage so a refresh or remount
// cannot report the same conversion to Meta more than once.
export const trackMetaPurchaseOnce = (orderId, params) => {
  if (!orderId || typeof window === "undefined") return false;

  const storageKey = `${PURCHASE_STORAGE_PREFIX}${orderId}`;

  try {
    if (window.localStorage.getItem(storageKey)) return false;

    const tracked = trackMetaCommerceEvent("Purchase", params);
    if (tracked) window.localStorage.setItem(storageKey, "1");
    return tracked;
  } catch {
    // Tracking should remain available when browser privacy settings block storage.
    return trackMetaCommerceEvent("Purchase", params);
  }
};

export { META_CURRENCY }