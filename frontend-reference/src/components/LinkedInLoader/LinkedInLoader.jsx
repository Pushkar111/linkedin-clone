/**
 * LinkedIn-style loader component
 * Shows a LinkedIn logo with animated progress bar
 */
import React from "react";
import "./LinkedInLoader.css";

export default function LinkedInLoader() {
  return (
    <div className="linkedin-loader-wrapper">
      <div className="linkedin-loader-container">
        <span className="fab fa-linkedin"></span>
        <div className="linkedin-loader-line">
          <div className="linkedin-loader-inner"></div>
        </div>
      </div>
    </div>
  );
}
