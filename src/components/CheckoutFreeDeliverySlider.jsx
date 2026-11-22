import { useEffect, useId, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router";
import SummaryApi from "../common";
import { getPrimaryProductImage, getProductUrlPath } from "../helpers/productSeo";
import "../styles/CheckoutFreeDeliverySlider.css";

const CheckoutFreeDeliverySlider = () => {
  const [products, setProducts] = useState([]);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const trackRef = useRef(null);
  const headingId = useId();
  const trackId = useId();

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        const response = await fetch(SummaryApi.get_product.url, {
          credentials: "include",
          headers: { "x-client-key": import.meta.env.VITE_PUBLIC_CLIENT_KEY },
          signal: controller.signal,
        });
        if (!response.ok) return;

        const result = await response.json();
        if (!controller.signal.aborted && result.success && Array.isArray(result.data)) {
          setProducts(
            result.data.filter(
              (product) =>
                product?._id &&
                product.isFreeDelivery === true &&
                product.isPublished !== false,
            ),
          );
        }
      } catch {
        // Checkout can proceed if recommendations are unavailable.
      }
    };

    loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateControls = () => {
      setCanScrollBack(track.scrollLeft > 1);
      setCanScrollForward(track.scrollWidth - track.clientWidth - track.scrollLeft > 1);
    };

    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    track.addEventListener("scroll", updateControls, { passive: true });
    updateControls();

    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", updateControls);
    };
  }, [products]);

  const scrollProducts = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth });
  };

  if (products.length === 0) return null;

  return (
    <section className="checkout-free-delivery" aria-labelledby={headingId}>
      <div className="checkout-free-delivery__header">
        <h3 id={headingId} className="checkout-free-delivery__title">
          নিচের যেকোনো একটি পণ্য যোগ করলেই ফ্রি ডেলিভারি
        </h3>
        {(canScrollBack || canScrollForward) && (
          <div className="checkout-free-delivery__controls">
            <button
              type="button"
              className="checkout-free-delivery__control"
              aria-label="আগের পণ্য দেখুন"
              aria-controls={trackId}
              disabled={!canScrollBack}
              onClick={() => scrollProducts(-1)}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="checkout-free-delivery__control"
              aria-label="পরের পণ্য দেখুন"
              aria-controls={trackId}
              disabled={!canScrollForward}
              onClick={() => scrollProducts(1)}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <ul id={trackId} className="checkout-free-delivery__track" ref={trackRef}>
        {products.map((product) => (
          <li key={product._id} className="checkout-free-delivery__item">
            <Link
              className="checkout-free-delivery__link"
              to={getProductUrlPath(product)}
            >
              <img
                className="checkout-free-delivery__image"
                src={getPrimaryProductImage(product)}
                alt=""
                loading="lazy"
              />
              <span className="checkout-free-delivery__name">
                {product.productName || "পণ্য দেখুন"}
              </span>
              {product.selling != null && product.selling !== "" && (
                <span className="checkout-free-delivery__price">৳{product.selling}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CheckoutFreeDeliverySlider;
