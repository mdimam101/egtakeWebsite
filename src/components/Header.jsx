import React, { useEffect, useState } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { useNavigate, useParams } from "react-router";
// import { useSelector } from "react-redux";
import Storebar from "./Storebar";
import SummaryApi from "../common";
import "../styles/HeaderStyles.css";

const Header = () => {
  const [isUserTyping, setIsUserTyping] = useState(false);
  const { query } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query) {
      setSearchQuery(decodeURIComponent(query));
    }
  }, [query]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
    setSuggestions([]);
  };

  const handleSuggestionClick = (value) => {
    setSearchQuery(value);
    setSuggestions([]);
    navigate(`/search/${encodeURIComponent(value)}`);
  };

useEffect(() => {
  if (!isUserTyping) return; // sudhu typing korle suggestions load hobe

  const fetchSuggestions = async () => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`${SummaryApi.searchSuggestion.url}?q=${searchQuery}`);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (error) {
      console.error("Suggestion fetch error:", error);
    }
  };

  const debounce = setTimeout(fetchSuggestions, 300);
  return () => clearTimeout(debounce);
}, [searchQuery, isUserTyping]);

  useEffect(() => {
  if (query) {
    setSearchQuery(decodeURIComponent(query));
    setIsUserTyping(false); // param load hole suggestions abar na dekhaite
  }
}, [query]);

  return (
    <div className="main-header">
      <div className="search-wrapper">
        <div className="search-container">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setIsUserTyping(true); // user typing korle eta true hoy
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />

            {searchQuery && (
              <button className="clear-icon" onClick={() => setSearchQuery("")}>
                &times;
              </button>
            )}

            <button className="search-icon" onClick={handleSearch}>
              <IoSearchSharp size={18} />
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <ul className="styled-suggestion-list">
            {suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(item.productName)}
              >
                <IoSearchSharp size={18} className="suggestion-icon" />
                <span className="suggestion-text">{item.productName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Header;
