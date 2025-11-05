/**
 * ============================================================================
 * LOADER COMPONENT - Full Screen Loading Spinner
 * ============================================================================
 * 
 * A centered, full-screen loading spinner for async operations
 * Used in:
 * - Page loading states
 * - Data fetching
 * - Transitions
 * 
 * @version 1.0.0
 */

import React from "react";
import "./Loader.css";

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="loader-spinner">
          <i className="fas fa-circle-notch fa-spin" />
        </div>
        {message && (
          <p className="loader-message">{message}</p>
        )}
      </div>
    </div>
  );
}
