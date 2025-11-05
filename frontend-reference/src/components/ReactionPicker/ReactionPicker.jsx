/**
 * ReactionPicker Component
 * LinkedIn-style hover reaction picker with smooth animations
 */
import React, { useState } from "react";
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
  const [hoveredReaction, setHoveredReaction] = useState(null);

  const handleReactionClick = (reactionType) => {
    onReactionSelect(reactionType);
  };

  return (
    <div
      className="reaction-picker"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
              onMouseLeave={() => setHoveredReaction(null)}
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
