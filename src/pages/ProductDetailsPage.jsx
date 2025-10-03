import React, { useContext, useEffect, useRef, useState } from "react";
import SummaryApi from "../common";
import { useParams } from "react-router";
import { CiDeliveryTruck, CiBoxes } from "react-icons/ci";
import { TbTruckReturn } from "react-icons/tb";
import "../styles/ProductDetailsStyle.css";
import addToCart from "../helpers/addToCart";
import Context from "../context";
import UserProductCart from "../components/UserProductCart";

const ALL_SIZES = ["S", "M", "L", "XL", "XXL"];

const ProductDetailsPage = () => {
  const param = useParams();
  const [data, setData] = useState({
    productName: "",
    brandName: "",
    category: "",
    subCategory: "",
    variants: [],
    description: "",
    price: 0,
    selling: 0,
  });

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showRelatedProduct, setShowRelatedProduct] = useState([]);

  const imageSliderRef = useRef();

  useEffect(() => {
    const fetchProductDetails = async () => {
      const response = await fetch(SummaryApi.product_details.url, {
        method: SummaryApi.product_details.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: param?.id }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setSelectedVariantIndex(0);
        setSelectedSize(null);
        const images = result.data.variants.flatMap((v) => v.images || []);
        setAllImages(images);
        setSelectedImg(images[0] || null);

        const res = await fetch(SummaryApi.category_wish_product.url, {
          method: SummaryApi.category_wish_product.method,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            category: result.data.category,
          }),
        });
        const CategoryWiseRecoProduct = await res.json();
        setShowRelatedProduct(CategoryWiseRecoProduct.data || []);
      }
    };
    fetchProductDetails();
  }, [param?.id]);

  const selectedVariant = data.variants[selectedVariantIndex] || {};
  const variantSizes = selectedVariant.sizes || [];

  const getStockBySize = (size) => {
    const sizeObjWithStk = variantSizes.find((s) => s.size === size);
    
    
    return sizeObjWithStk ? sizeObjWithStk.stock : 0;
  };
  const discount =
    data.price && data.selling
      ? Math.floor(((data.price - data.selling) / data.price) * 100)
      : 0;

  const { fetchUserAddToCart } = useContext(Context);

  const addToCartHandle = async () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }
    await addToCart({
      productId: data._id,
      size: selectedSize,
      color: selectedVariant.color,
      image: selectedImg,
    });
    fetchUserAddToCart();
  };

  return (
    <div className="product-details-container">
      <div className="product-image-wrapper">
        {/* Left side thumbnails */}
        <div className="thumbnail-list-vertical">
          {allImages.map((img, index) => (
            <img
              key={index}
              src={img}
              className={`thumbnail-image-vertical ${
                selectedImg === img ? "active-thumbnail" : ""
              }`}
              onClick={() => {
                setSelectedImg(img);
                const variantIndex = data.variants.findIndex((v) =>
                  v.images.includes(img)
                );
                if (
                  variantIndex !== -1 &&
                  variantIndex !== selectedVariantIndex
                ) {
                  setSelectedVariantIndex(variantIndex);
                  setSelectedSize(null);
                }
              }}
              alt=""
            />
          ))}
        </div>

        {/* Right side main image */}
        <div className="big-image">
          <img src={selectedImg} alt="" />
        </div>
      </div>
      {/* Mobile slider as before */}
      <div className="product-image-slider-container">
        <div
          className="product-image-slider"
          ref={imageSliderRef}
          onScroll={(e) => {
            const el = e.target;
            const scrollLeft = el.scrollLeft;
            const slideWidth = el.clientWidth;
            const currentIndex = Math.round(scrollLeft / slideWidth);
            const currentImage = allImages[currentIndex];

            if (currentImage) {
              setSelectedImg(currentImage);
            }

            const variantIndex = data.variants.findIndex((v) =>
              v.images.includes(currentImage)
            );
            if (variantIndex !== -1 && variantIndex !== selectedVariantIndex) {
              setSelectedVariantIndex(variantIndex);
              setSelectedSize(null);
            }
          }}
        >
          {allImages.map((img, index) => (
            <div key={index} className="product-image-slide">
              <img src={img} alt={`variant-${index}`} />
            </div>
          ))}
        </div>

        <div className="image-count-indicator">
          {allImages.indexOf(selectedImg) + 1}/{allImages.length}
        </div>
      </div>

      <div className="item-counter">
        Variant {selectedVariantIndex + 1}/{data.variants.length}
      </div>

      <div className="product-price-info">
        <span className="selling-price">
          <span>৳</span>
          {data.selling}
        </span>
        {discount > 0 && <span className="discount">Save {discount}%</span>}
        <span className="original-price">৳{data.price}</span>
      </div>

      <div className="offer-box">৳200 OFF For orders ৳1500+</div>
      <div className="product-name">{data.productName}</div>

      {selectedVariant.color && (
        <div className="color-info">Color: {selectedVariant.color}</div>
      )}

      <div className="color-selector-thumbnail">
        {data.variants.map((variant, idx) => {
          const thumbImage = variant.images?.[0] || null;

          return (
            <div
              key={idx}
              className={`thumbnail-color-box ${
                idx === selectedVariantIndex ? "active" : ""
              }`}
              onClick={() => {
                setSelectedVariantIndex(idx);
                setSelectedSize(null);

                const newImages = data.variants[idx]?.images || [];
                if (newImages.length > 0) {
                  const firstImg = newImages[0];
                  setSelectedImg(firstImg);

                  const imgIndex = allImages.findIndex(
                    (img) => img === firstImg
                  );

                  if (imageSliderRef.current && imgIndex !== -1) {
                    const el = imageSliderRef.current;
                    const slideWidth = el.clientWidth;
                    el.scrollTo({
                      left: imgIndex * slideWidth,
                      behavior: "instant", // or "smooth"
                    });
                  }
                }
              }}
            >
              {thumbImage && <img src={thumbImage} alt={variant.color} />}
            </div>
          );
        })}
      </div>

      <div className="size-section">
        <div className="size-header">
          <p>Size</p>
          <button className="size-guide-btn">Size guide</button>
        </div>
        <div className="size-options">
          {ALL_SIZES.map((size) => {
            const stock = getStockBySize(size);

            console.log("stock...>", stock);
            
            const disabled = stock === 0;
            return (
              <div
                key={size}
                className={`size-box ${
                  selectedSize === size ? "selected-size" : ""
                }`}
                onClick={() => !disabled && setSelectedSize(size)}
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                {size}
              </div>
            );
            
          })}
        </div>
      </div>

      <div className="stock-info">
        {selectedSize
          ? getStockBySize(selectedSize) > 0
            ? `In Stock: ${getStockBySize(selectedSize)}`
            : "Out of Stock"
          : "Please select a size"}
      </div>

      <div className="service-title">Service Commitment</div>
      <div className="service-item">
        <CiDeliveryTruck className="icon" />
        <strong>Free Delivery</strong>
      </div>
      <p className="service-description">Delivery within 1 hour</p>
      <div className="service-item">
        <CiBoxes className="icon" />
        <strong>Delivery Commitment</strong>
      </div>
      <p className="service-description">
        Up to 50% cashback credit if delayed
      </p>
      <div className="service-item">
        <TbTruckReturn className="icon" />
        <strong>Free Return Within 15 days</strong>
      </div>

      <div
        className="product-details-toggle"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? "Hide" : "Show"} Product Details
      </div>

      {showDetails && (
        <div className="product-details-text">
          <p>{data.description}</p>
        </div>
      )}

      <div className="add-to-cart-fixed">
        <button
          disabled={!selectedSize || getStockBySize(selectedSize) <= 0}
          onClick={addToCartHandle}
        >
          {!selectedSize
            ? "Select Size"
            : getStockBySize(selectedSize) > 0
            ? "Add to cart"
            : "Out of Stock"}
        </button>
      </div>

      <div>Recommended</div>
      <div className="product-grid">
        {showRelatedProduct.length > 0 &&
          showRelatedProduct.map((product, idx) => (
            <UserProductCart productData={product} key={idx} />
          ))}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
