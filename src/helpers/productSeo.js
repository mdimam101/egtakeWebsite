export const SITE_URL = "https://pyzara.com";
export const FALLBACK_IMAGE = `${SITE_URL}/PyzaraWebIcone.png`;

export const slugifyProduct = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const productSeoKey = (product = {}) =>
  product?.slug || slugifyProduct(product?.productName) || product?._id || "";

export const getProductUrlPath = (product = {}) =>
  `/product/${productSeoKey(product)}`;

export const toAbsoluteImageUrl = (img = "") => {
  if (!img) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(img)) return img.replace(/^http:\/\//i, "https://");
  if (String(img).startsWith("/")) return `${SITE_URL}${img}`;
  return `${SITE_URL}/${img}`;
};

export const getPrimaryProductImage = (product = {}) => {
  if (typeof product?.productImg === "string") return toAbsoluteImageUrl(product.productImg);
  if (Array.isArray(product?.productImg) && product.productImg[0]) return toAbsoluteImageUrl(product.productImg[0]);
  if (Array.isArray(product?.variants) && product.variants?.[0]?.images?.[0]) {
    return toAbsoluteImageUrl(product.variants[0].images[0]);
  }
  if (product?.img) return toAbsoluteImageUrl(product.img);
  return FALLBACK_IMAGE;
};

export const cleanShortDescription = (product = {}) => {
  const raw = String(product?.description || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const fallback = `${product?.productName || "এই পণ্য"} কিনুন Pyzara থেকে। দ্রুত ডেলিভারি ও সহজ অনলাইন শপিং।`;
  const desc = raw || fallback;
  return desc.length > 160 ? `${desc.slice(0, 157)}...` : desc;
};