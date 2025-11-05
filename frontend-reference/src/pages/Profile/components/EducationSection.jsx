/**
 * EducationSection Component
 * 
 * Displays education history
 * Shows school logo, degree, field of study, dates
 */

import React from "react";
import { motion } from "framer-motion";

export default function EducationSection({ education }) {
  if (!education || education.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
      role="region"
      aria-label="Education"
    >
      <h2 className="text-xl font-semibold text-color-text-darker mb-6">
        Education
      </h2>

      <div className="space-y-6">
        {education.map((edu, index) => (
          <motion.article
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            {/* School Logo/Icon */}
            <div className="flex-shrink-0">
              {edu.schoolLogo ? (
                <img
                  src={edu.schoolLogo}
                  alt={`${edu.school} logo`}
                  className="w-12 h-12 object-contain rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-gray-400" />
                </div>
              )}
            </div>

            {/* Education Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-color-text-darker">
                {edu.school}
              </h3>
              
              <p className="text-sm text-color-text">
                {edu.degree}
                {edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}
              </p>

              <p className="text-sm text-color-text-low-emphasis mt-1">
                {edu.startYear} - {edu.endYear || "Present"}
              </p>

              {edu.grade && (
                <p className="text-sm text-color-text mt-2">
                  Grade: {edu.grade}
                </p>
              )}

              {edu.activities && (
                <p className="text-sm text-color-text mt-2">
                  Activities: {edu.activities}
                </p>
              )}

              {edu.description && (
                <p className="text-sm text-color-text mt-3 whitespace-pre-wrap">
                  {edu.description}
                </p>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
