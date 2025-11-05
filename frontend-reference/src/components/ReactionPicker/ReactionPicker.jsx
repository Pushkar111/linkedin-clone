/**
 * ReactionPicker Component
 * LinkedIn-style hover reaction picker with smooth animations
 * 
 * FIXES:
 * ✅ No more flicker on hover (stable with delay)
 * ✅ Larger hover zone for better UX
 * ✅ Smooth transitions
 */
import React, { useState, useRef, useEffect } from "react";
import { REACTIONS_LIST } from "../../constants/reactions";
import "./ReactionPicker.css";

/**
 * @param {Object} props
 * @param {Function} props.onReactionSelect - Callback when reaction is selected
 * @param {Function} props.onMouseEnter - Keep picker open on hover
 * @param {Function} props.onMouseLeave - Close picker when mouse leaves
 * @param {string} props.currentReaction - Current user's reaction type
 */
const ReactionPicker = ({
  onReactionSelect,
  onMouseEnter,
  onMouseLeave,
  currentReaction,
}) => {
  const [hoveredReaction, setHoveredReaction] = useState("");
  const pickerRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  /**
   * Handle mouse enter on picker
   * Clear any pending close timeout
   */
  const handlePickerMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (onMouseEnter) {
      onMouseEnter();
    }
  };

  /**
   * Handle mouse leave on picker
   * Add delay before closing (prevents flicker)
   */
  const handlePickerMouseLeave = (e) => {
    // Check if mouse is still within picker bounds (prevents premature closing)
    if (pickerRef.current && pickerRef.current.contains(e.relatedTarget)) {
      return;
    }

    // Add 200ms delay before closing (prevents flicker when moving between buttons)
    leaveTimeoutRef.current = setTimeout(() => {
      if (onMouseLeave) {
        onMouseLeave();
      }
    }, 200);
  };

  /**
   * Handle reaction button click
   */
  const handleReactionClick = (reactionType) => {
    onReactionSelect(reactionType);
  };

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={pickerRef}
      className="reaction-picker"
      onMouseEnter={handlePickerMouseEnter}
      onMouseLeave={handlePickerMouseLeave}
      role="toolbar"
      aria-label="Reaction picker"
    >
      <div className="reaction-picker__container">
        {REACTIONS_LIST.map((reaction, index) => {
          const isSelected = currentReaction === reaction.type;
          const isHovered = hoveredReaction === reaction.type;

          return (
            <button
              key={reaction.type}
              type="button"
              className={`reaction-picker__button ${
                isSelected ? "reaction-picker__button--selected" : ""
              } ${isHovered ? "reaction-picker__button--hovered" : ""}`}
              onClick={() => handleReactionClick(reaction.type)}
              onMouseEnter={() => setHoveredReaction(reaction.type)}
              onMouseLeave={() => setHoveredReaction("")}
              aria-label={`React with ${reaction.label}`}
              style={{
                animationDelay: `${index * 30}ms`,
              }}
            >
              <span
                className="reaction-picker__emoji"
                style={{
                  color: isHovered ? reaction.hoverColor : reaction.color,
                }}
              >
                {reaction.emoji}
              </span>

              {/* Tooltip */}
              <span
                className="reaction-picker__tooltip"
                style={{
                  backgroundColor: isHovered ? reaction.hoverColor : reaction.color,
                }}
              >
                {reaction.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReactionPicker;
