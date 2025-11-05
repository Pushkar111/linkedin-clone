/**
 * ReactionButton Component
 * LinkedIn-style reaction button with multi-reaction support
 */
import React from "react";
import { getReactionConfig, REACTION_TYPES } from "../../constants/reactions";
import "./ReactionButton.css";

/**
 * @param {Object} props
 * @param {boolean} props.hasReacted - Whether user has reacted
 * @param {string} props.reactionType - Current user's reaction type
 * @param {number} props.reactionCount - Total reactions
 * @param {boolean} props.isAnimating - Animation state
 * @param {boolean} props.isPending - API request pending
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onMouseEnter - Mouse enter handler
 * @param {Function} props.onMouseLeave - Mouse leave handler
 */
const ReactionButton = ({
  hasReacted,
  reactionType,
  reactionCount,
  isAnimating,
  isPending,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const reactionConfig = hasReacted && reactionType
    ? getReactionConfig(reactionType)
    : getReactionConfig(REACTION_TYPES.LIKE);

  const displayColor = hasReacted ? reactionConfig.color : "#666";
  const displayLabel = hasReacted ? reactionConfig.label : "Like";
  const displayEmoji = reactionConfig.emoji;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={isPending}
      className={`reaction-button ${isPending ? "reaction-button--pending" : ""}`}
      aria-label={hasReacted ? `Change reaction from ${displayLabel}` : "React to post"}
      aria-pressed={hasReacted}
    >
      <div className="reaction-button__content">
        <span
          className={`reaction-button__icon ${
            hasReacted ? "reaction-button__icon--reacted" : ""
          } ${isAnimating ? "reaction-button__icon--animating" : ""}`}
          style={{ color: displayColor }}
        >
          {displayEmoji}
        </span>
        <span
          className={`reaction-button__text ${
            hasReacted ? "reaction-button__text--reacted" : ""
          }`}
          style={{ color: displayColor }}
        >
          {displayLabel}
        </span>
        {reactionCount > 0 && (
          <span
            className={`reaction-button__count ${
              isAnimating ? "reaction-button__count--animating" : ""
            }`}
            style={{
              color: hasReacted ? displayColor : "#666",
              backgroundColor: hasReacted 
                ? `${displayColor}1A` 
                : "rgba(102, 102, 102, 0.1)",
            }}
          >
            {reactionCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default ReactionButton;
