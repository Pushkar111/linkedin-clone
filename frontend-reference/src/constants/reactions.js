/**
 * Reaction Types Configuration
 * LinkedIn-style multi-reaction system
 */

export const REACTION_TYPES = {
  LIKE: "like",
  CELEBRATE: "celebrate",
  SUPPORT: "support",
  FUNNY: "funny",
  LOVE: "love",
  INSIGHTFUL: "insightful",
  CURIOUS: "curious",
};

export const REACTION_CONFIG = {
  [REACTION_TYPES.LIKE]: {
    type: "like",
    label: "Like",
    emoji: "👍",
    color: "#0a66c2",
    hoverColor: "#004182",
  },
  [REACTION_TYPES.CELEBRATE]: {
    type: "celebrate",
    label: "Celebrate",
    emoji: "🎉",
    color: "#6dae4f",
    hoverColor: "#4f8936",
  },
  [REACTION_TYPES.SUPPORT]: {
    type: "support",
    label: "Support",
    emoji: "🫶",
    color: "#e06847",
    hoverColor: "#c74f2f",
  },
  [REACTION_TYPES.FUNNY]: {
    type: "funny",
    label: "Funny",
    emoji: "😂",
    color: "#f09849",
    hoverColor: "#d17e2f",
  },
  [REACTION_TYPES.LOVE]: {
    type: "love",
    label: "Love",
    emoji: "❤️",
    color: "#df704d",
    hoverColor: "#c04f2d",
  },
  [REACTION_TYPES.INSIGHTFUL]: {
    type: "insightful",
    label: "Insightful",
    emoji: "💡",
    color: "#f5b33c",
    hoverColor: "#d9961c",
  },
  [REACTION_TYPES.CURIOUS]: {
    type: "curious",
    label: "Curious",
    emoji: "🤔",
    color: "#8d6cab",
    hoverColor: "#6d4c8b",
  },
};

// Array for easy iteration
export const REACTIONS_LIST = Object.values(REACTION_CONFIG);

// Helper to get reaction config
export const getReactionConfig = (type) => {
  return REACTION_CONFIG[type] || REACTION_CONFIG[REACTION_TYPES.LIKE];
};

// Helper to format reaction counts for display
export const formatReactionCounts = (reactionCounts) => {
  if (!reactionCounts || Object.keys(reactionCounts).length === 0) {
    return [];
  }

  return Object.entries(reactionCounts)
    .map(([type, count]) => ({
      ...getReactionConfig(type),
      count,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
};
