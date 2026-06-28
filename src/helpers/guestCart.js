export const GUEST_CART_KEY = "guestCart";
export const PENDING_CHECKOUT_KEY = "pendingCheckoutItems";

const parse = (raw) => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const norm = (value) => (value ?? "").toString().trim();
const normImg = (image) => norm(image).replace("https://", "http://");

export const getGuestCart = () => parse(localStorage.getItem(GUEST_CART_KEY));

export const setGuestCart = (items) => {
  const safeItems = Array.isArray(items) ? items : [];
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(safeItems));
  return safeItems;
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const savePendingCheckoutItems = (items) => {
  const safeItems = Array.isArray(items) ? items : [];
  localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(safeItems));
  return safeItems;
};

export const consumePendingCheckoutItems = () => {
  const items = parse(localStorage.getItem(PENDING_CHECKOUT_KEY));
  localStorage.removeItem(PENDING_CHECKOUT_KEY);
  return items;
};

const getProductId = (item) => {
  if (item?.productId && typeof item.productId === "object") return item.productId._id;
  return item?.productId;
};

const sameGuestItem = (a, b) =>
  norm(getProductId(a)) === norm(getProductId(b)) &&
  norm(a?.size).toLowerCase() === norm(b?.size).toLowerCase() &&
  norm(a?.color).toLowerCase() === norm(b?.color).toLowerCase() &&
  normImg(a?.image) === normImg(b?.image);

const makeGuestId = (item) =>
  `guest::${norm(getProductId(item))}::${normImg(item?.image)}::${norm(item?.size)}::${norm(item?.color)}`;

const toGuestCartItem = (item) => {
  const productId = norm(getProductId(item));
  const price = Number(item?.price ?? item?.productId?.price ?? 0);
  const selling = Number(item?.selling ?? item?.productId?.selling ?? 0);
  const quantity = Number(item?.quantity ?? 1);

  return {
    _id: makeGuestId(item),
    productId: {
      _id: productId,
      productName: item?.productName || item?.productId?.productName || "",
      price,
      selling,
      productCodeNumber: item?.productCodeNumber || item?.productId?.productCodeNumber,
    },
    productName: item?.productName || item?.productId?.productName || "",
    image: normImg(item?.image),
    size: norm(item?.size),
    color: norm(item?.color),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    price,
    selling,
    addedAt: item?.addedAt || Date.now(),
    isGuestCartItem: true,
  };
};

export const pushGuestCartUnique = async (item) => {
  const nextItem = toGuestCartItem(item);
  const currentItems = getGuestCart();

  if (currentItems.some((existing) => sameGuestItem(existing, nextItem))) {
    return { added: false, reason: "duplicate", items: currentItems };
  }

  const updatedItems = [...currentItems, nextItem];
  setGuestCart(updatedItems);
  return { added: true, items: updatedItems };
};

export const guestBumpQty = async (match, delta) => {
  const currentItems = getGuestCart();
  const index = currentItems.findIndex((item) => sameGuestItem(item, match));

  if (index < 0) return { ok: false, reason: "not_found", items: currentItems };

  const currentQty = Number(currentItems[index].quantity ?? 1);
  const nextQty = currentQty + Number(delta || 0);

  const updatedItems = [...currentItems];
  if (nextQty <= 0) {
    updatedItems.splice(index, 1);
  } else {
    updatedItems[index] = { ...updatedItems[index], quantity: nextQty };
  }

  setGuestCart(updatedItems);
  return { ok: true, items: updatedItems, qty: Math.max(nextQty, 0) };
};

export const guestRemove = async (match) => {
  const updatedItems = getGuestCart().filter((item) => !sameGuestItem(item, match));
  setGuestCart(updatedItems);
  return { ok: true, items: updatedItems };
};