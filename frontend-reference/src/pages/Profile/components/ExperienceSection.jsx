/**
 * ExperienceSection Component
 * 
 * Displays work experience in timeline format
 * Shows company logo, position, duration, description
 */

import React from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

export default function ExperienceSection({ experiences }) {
  if (!experiences || experiences.length === 0) return null;

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const calculateDuration = (startDate, endDate) => {
    try {
      const start = parseISO(startDate);
      const end = endDate ? parseISO(endDate) : new Date();
      const months = Math.floor((end - start) / (1000 * 60 * 60 * 24 * 30));
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      if (years > 0 && remainingMonths > 0) {
        return `${years} yr${years > 1 ? "s" : ""} ${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
      } else if (years > 0) {
        return `${years} yr${years > 1 ? "s" : ""}`;
      } else {
        return `${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
      }
    } catch {
      return "";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
      role="region"
      aria-label="Experience"
    >
      <h2 className="text-xl font-semibold text-color-text-darker mb-6">
        Experience
      </h2>

      <div className="space-y-6">
        {experiences.map((exp, index) => (
          <motion.article
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            {/* Company Logo/Icon */}
            <div className="flex-shrink-0">
              {exp.companyLogo ? (
                <img
                  src={exp.companyLogo}
                  alt={`${exp.company} logo`}
                  className="w-12 h-12 object-contain rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <i className="fas fa-building text-gray-400" />
                </div>
              )}
            </div>

            {/* Experience Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-color-text-darker">
                {exp.position || exp.title}
              </h3>
              
              <p className="text-sm text-color-text">
                {exp.company}
                {exp.employmentType && (
                  <span className="text-color-text-low-emphasis">
                    {" • "}{exp.employmentType}
                  </span>
                )}
              </p>

              <p className="text-sm text-color-text-low-emphasis mt-1">
                {formatDate(exp.startDate)} -{" "}
                {exp.endDate ? formatDate(exp.endDate) : "Present"}
                {" • "}
                {calculateDuration(exp.startDate, exp.endDate)}
              </p>

              {exp.location && (
                <p className="text-sm text-color-text-low-emphasis">
                  <i className="fas fa-map-marker-alt text-xs mr-1" />
                  {exp.location}
                </p>
              )}

              {exp.description && (
                <p className="text-sm text-color-text mt-3 whitespace-pre-wrap">
                  {exp.description}
                </p>
              )}

              {exp.skills && exp.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {exp.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-sm text-color-text-darker rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
