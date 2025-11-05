/**
 * Hashtag Component
 * Displays a clickable hashtag with styling
 */
import React from "react";
import "./Hashtag.css";

/**
 * @param {Object} props
 * @param {string} props.hashtag - Hashtag text (without #)
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.className] - Additional CSS classes
 */
export default function Hashtag({ hashtag, onClick = () => {}, className = "" }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(hashtag);
    } else {
      // Default: navigate to hashtag page (to be implemented)
      console.log("Clicked hashtag:", hashtag);
      // TODO: Navigate to /hashtag/:tag page
    }
  };

  return (
    <span
      className={`hashtag ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick(e);
        }
      }}
      aria-label={`View posts tagged with ${hashtag}`}
    >
      #{hashtag}
    </span>
  );
}
