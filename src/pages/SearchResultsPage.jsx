import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import SummaryApi from "../common";
import "../styles/SearchResultsPage.css";

const SearchResultsPage = () => {
  const { query } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${SummaryApi.backendDomain}/api/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="search-results-container">
      <h2>Search Results for "{query}"</h2>

      {loading ? (
        <p>Loading...</p>
      ) : products.length > 0 ? (
        <div className="search-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <img
                src={product.productImg[0]}
                alt={product.productName}
                className="product-img"
              />
              <p>{product.productName}</p>
              <p><b>৳ {product.price}</b></p>
            </div>
          ))}
        </div>
      ) : (
        <p>No products found</p>
      )}
    </div>
  );
};

export default SearchResultsPage;
