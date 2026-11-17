// const META_CURRENCY = "BDT";
// const PURCHASE_STORAGE_PREFIX = "meta_purchase_tracked:";
// const trackedCancellationOrderIds = new Set();

// export const trackMetaEvent = (eventName, params = {}, eventId) => {
//   if (
//     typeof window === "undefined" ||
//     typeof window.fbq !== "function" ||
//     !eventName
//   ) {
//     return false;
//   }

//   const normalizedEventId = String(eventId || "").trim();

//   if (normalizedEventId) {
//     window.fbq("track", eventName, params, { eventID: normalizedEventId });
//   } else {
//     window.fbq("track", eventName, params);
//   }
//   return true;
// };

// export const trackMetaCommerceEvent = (eventName, params = {}, eventId) =>
//   trackMetaEvent(eventName, { ...params, currency: META_CURRENCY }, eventId);


// export const trackMetaCustomEvent = (eventName, params = {}) => {
//   if (
//     typeof window === "undefined" ||
//     typeof window.fbq !== "function" ||
//     !eventName
//   ) {
//     return false;
//   }

//   window.fbq("trackCustom", eventName, params);
//   return true;
// };

// export const trackMetaOrderCancellation = (
//   order,
//   cancelledBy,
//   cancellationReason
// ) => {
//   const orderId = order?._id || order?.orderId;
//   const backendAlreadyTracked =
//     order?.metaCancellationTrackedAt ||
//     order?.metaEvents?.cancellationTrackedAt;

//   if (!orderId || backendAlreadyTracked || trackedCancellationOrderIds.has(String(orderId))) {
//     return false;
//   }

//   const items = Array.isArray(order?.items) ? order.items : [];
//   const defaultReason = cancelledBy === "admin" ? "admin_cancelled" : "not_provided";
//   const tracked = trackMetaCustomEvent("OrderCancelled", {
//     order_id: String(orderId),
//     value: Number(order?.totalAmount || 0),
//     currency: META_CURRENCY,
//     content_ids: items.map((item) =>
//       String(item?.productId?._id || item?.productId)
//     ),
//     contents: items.map((item) => ({
//       id: String(item?.productId?._id || item?.productId),
//       quantity: Number(item?.quantity || 1),
//       item_price: Number(
//         item?.price ||
//           item?.sellingPrice ||
//           item?.productId?.sellingPrice ||
//           0
//       ),
//     })),
//     num_items: items.reduce(
//       (sum, item) => sum + Number(item?.quantity || 1),
//       0
//     ),
//     cancelled_by: cancelledBy,
//     cancellation_reason: cancellationReason || defaultReason,
//   });

//   if (tracked) trackedCancellationOrderIds.add(String(orderId));
//   return tracked;
// };

// // Keep the successful order identifier in localStorage so a refresh or remount
// // cannot report the same conversion to Meta more than once.
// export const trackMetaPurchaseOnce = (orderId, params, metaEventId) => {
//   if (!orderId || typeof window === "undefined") return false;

//   const storageKey = `${PURCHASE_STORAGE_PREFIX}${orderId}`;

//   try {
//     if (window.localStorage.getItem(storageKey)) return false;

//     const tracked = trackMetaCommerceEvent("Purchase", params, metaEventId);
//     if (tracked) window.localStorage.setItem(storageKey, "1");
//     return tracked;
//   } catch {
//     // Tracking should remain available when browser privacy settings block storage.
//     return trackMetaCommerceEvent("Purchase", params, metaEventId);
//   }
// };

// export { META_CURRENCY }

const META_CURRENCY = "BDT";
const PURCHASE_STORAGE_PREFIX = "meta_purchase_tracked:";
const trackedCancellationOrderIds = new Set();
const trackedPurchaseOrderIds = new Set();

export const readMetaCookie = (name) => {
  const entry = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!entry) return undefined;
  const value = entry.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// Run alongside the existing Pixel startup, before routing can remove fbclid.
export const captureMetaClick = () => {
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid || readMetaCookie("_fbc")?.endsWith(`.${fbclid}`)) return;
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  document.cookie = `_fbc=${encodeURIComponent(fbc)}; Path=/; Max-Age=7776000; Secure; SameSite=Lax`;
};

export const getMetaPurchaseParams = (order) => {
  const contents = order.items.map((item) => ({
    id: String(item.productId?._id || item.productId),
    quantity: Number(item.quantity),
    // The saved price is the entire line total, not the unit price.
    item_price: (Number(item.price) / Number(item.quantity)) * 0.5,
  }));
  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price), 0);
  return {
    value: Math.max(subtotal - Number(order.discount || 0), 0) * 0.5,
    content_type: "product",
    content_ids: contents.map((item) => item.id),
    contents,
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
  };
};

export const trackMetaEvent = (eventName, params = {}, eventId) => {
  if (
    typeof window === "undefined" ||
    typeof window.fbq !== "function" ||
    !eventName
  ) {
    return false;
  }

  const normalizedEventId = String(eventId || "").trim();

  if (normalizedEventId) {
    window.fbq("track", eventName, params, { eventID: normalizedEventId });
  } else {
    window.fbq("track", eventName, params);
  }
  return true;
};

export const trackMetaCommerceEvent = (eventName, params = {}, eventId) =>
  trackMetaEvent(eventName, { ...params, currency: META_CURRENCY }, eventId);


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
export const trackMetaPurchaseOnce = (orderId, params, metaEventId) => {
  if (!orderId || !metaEventId || typeof window === "undefined") return false;

  const storageKey = `${PURCHASE_STORAGE_PREFIX}${orderId}`;
  if (trackedPurchaseOrderIds.has(storageKey)) return false;
  try {
    if (window.localStorage.getItem(storageKey)) return false;
  } catch {
    // In-memory deduplication still works when storage is unavailable.
  }

  const tracked = trackMetaCommerceEvent("Purchase", params, metaEventId);
  if (tracked) {
    trackedPurchaseOrderIds.add(storageKey);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Do not send again merely because persisting the marker failed.
    }
  }
  return tracked;
};

export { META_CURRENCY };
