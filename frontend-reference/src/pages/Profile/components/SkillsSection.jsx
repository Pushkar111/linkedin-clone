/**
 * SkillsSection Component
 * 
 * Displays user skills with endorsement counts
 * Interactive hover effects and endorsement buttons
 */

import React from "react";
import { motion } from "framer-motion";

export default function SkillsSection({ skills }) {
  if (!skills || skills.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
      role="region"
      aria-label="Skills"
    >
      <h2 className="text-xl font-semibold text-color-text-darker mb-6">
        Skills
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {skills.map((skill, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 bg-color-gray-soft-background rounded-xl hover:bg-blue-50 transition-colors cursor-pointer group"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-color-text-darker group-hover:text-color-button-blue transition-colors">
                {typeof skill === "string" ? skill : skill.name}
              </h3>
              {typeof skill === "object" && skill.endorsements && (
                <p className="text-sm text-color-text mt-1">
                  <i className="fas fa-thumbs-up text-xs text-blue-600 mr-1" />
                  {skill.endorsements} endorsements
                </p>
              )}
            </div>

            {/* Endorse Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                console.log("Endorse skill:", skill);
              }}
              className="ml-4 p-2 rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Endorse ${typeof skill === "string" ? skill : skill.name}`}
            >
              <i className="fas fa-plus text-color-button-blue" />
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Show All Skills Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 w-full py-2 border border-color-button-blue text-color-button-blue rounded-full font-semibold hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
      >
        Show all {skills.length} skills
        <i className="fas fa-arrow-right ml-2 text-xs" />
      </motion.button>
    </motion.section>
  );
}
