/**
 * AboutSection Component
 * 
 * Displays user bio/about information
 * Expandable "Show more" for long text
 */

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function AboutSection({ profile }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_LENGTH = 300;

  if (!profile.bio && !profile.about) return null;

  const aboutText = profile.bio || profile.about || "";
  const needsExpansion = aboutText.length > MAX_LENGTH;
  const displayText = expanded || !needsExpansion
    ? aboutText
    : aboutText.slice(0, MAX_LENGTH) + "...";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
      role="region"
      aria-label="About"
    >
      <h2 className="text-xl font-semibold text-color-text-darker mb-4">
        About
      </h2>
      
      <p className="text-color-text whitespace-pre-wrap break-words">
        {displayText}
      </p>

      {needsExpansion && (
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-color-button-blue font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-color-button-blue rounded px-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {expanded ? "Show less" : "Show more"}
          <i
            className={`fas fa-chevron-${expanded ? "up" : "down"} ml-2 text-xs`}
            aria-hidden="true"
          />
        </motion.button>
      )}
    </motion.section>
  );
}
