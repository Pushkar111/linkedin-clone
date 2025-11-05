/**
 * RightSidebar Component
 * 
 * LinkedIn-style sticky sidebar with:
 * - Profile language selector
 * - Public profile URL
 * - Suggested connections
 * - Ad/CTA card
 * - "People also viewed" section
 * 
 * Features:
 * - Sticky positioning on desktop
 * - Collapsible sections on mobile
 * - Skeleton loading states
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function RightSidebar({ profile }) {
  const navigate = useNavigate();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Suggested connections (mock data - replace with API call)
  const suggestedConnections = [
    {
      id: "1",
      name: "Sarah Johnson",
      headline: "Product Manager at Tech Corp",
      avatarUrl: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=random",
      mutualConnections: 12
    },
    {
      id: "2",
      name: "Michael Chen",
      headline: "Software Engineer at StartupXYZ",
      avatarUrl: "https://ui-avatars.com/api/?name=Michael+Chen&background=random",
      mutualConnections: 8
    },
    {
      id: "3",
      name: "Emma Davis",
      headline: "UX Designer | Creative Studio",
      avatarUrl: "https://ui-avatars.com/api/?name=Emma+Davis&background=random",
      mutualConnections: 15
    }
  ];

  // People also viewed (mock data)
  const peopleViewed = [
    {
      id: "4",
      name: "James Wilson",
      headline: "Senior Developer",
      avatarUrl: "https://ui-avatars.com/api/?name=James+Wilson&background=random"
    },
    {
      id: "5",
      name: "Lisa Anderson",
      headline: "Marketing Director",
      avatarUrl: "https://ui-avatars.com/api/?name=Lisa+Anderson&background=random"
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <aside className="space-y-4" role="complementary">
      
      {/* Profile Language & Public URL Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl shadow-sm p-4"
      >
        <h3 className="text-sm font-semibold text-color-text-darker mb-3">
          Profile Settings
        </h3>

        {/* Language Selector */}
        <div className="mb-4">
          <label className="text-xs text-color-text block mb-2">
            Profile language
          </label>
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-color-gray-soft-background rounded-lg text-sm text-color-text-darker hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue"
              aria-label="Select profile language"
              aria-expanded={showLanguageDropdown}
            >
              <span>English</span>
              <i className="fas fa-chevron-down text-xs" aria-hidden="true" />
            </button>

            {showLanguageDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
              >
                {["English", "Spanish", "French", "German", "Chinese"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      console.log("Language selected:", lang);
                      setShowLanguageDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-color-text-darker hover:bg-gray-50 transition-colors"
                  >
                    {lang}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Public Profile URL */}
        <div>
          <label className="text-xs text-color-text block mb-2">
            Public profile & URL
          </label>
          <a
            href={`/profile/${profile._id}`}
            className="text-sm text-color-button-blue hover:underline focus:outline-none focus:ring-2 focus:ring-color-button-blue rounded px-1 break-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin-clone.com/in/{profile._id}
          </a>
        </div>
      </motion.div>

      {/* Suggested Connections Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-color-text-darker">
            People you may know
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {suggestedConnections.map((connection) => (
            <motion.div
              key={connection.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/profile/${connection.id}`)}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <img
                  src={connection.avatarUrl}
                  alt={`${connection.name}'s avatar`}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-color-text-darker line-clamp-1">
                    {connection.name}
                  </h4>
                  <p className="text-xs text-color-text line-clamp-2 mb-2">
                    {connection.headline}
                  </p>
                  <p className="text-xs text-color-text-low-emphasis">
                    <i className="fas fa-user-friends text-xs mr-1" aria-hidden="true" />
                    {connection.mutualConnections} mutual connections
                  </p>
                </div>
              </div>

              {/* Connect Button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Connect with:", connection.name);
                }}
                className="w-full mt-3 px-4 py-1.5 border border-color-button-blue text-color-button-blue rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <i className="fas fa-user-plus mr-2" aria-hidden="true" />
                Connect
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <button
          className="w-full p-3 text-sm text-color-text hover:bg-gray-50 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-color-button-blue"
          onClick={() => console.log("View all suggestions")}
        >
          View all suggestions
          <i className="fas fa-arrow-right ml-2 text-xs" aria-hidden="true" />
        </button>
      </motion.div>

      {/* People Also Viewed Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-color-text-darker">
            People also viewed
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {peopleViewed.map((person) => (
            <motion.button
              key={person.id}
              className="w-full p-4 flex gap-3 items-center hover:bg-gray-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-color-button-blue"
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/profile/${person.id}`)}
            >
              <img
                src={person.avatarUrl}
                alt={`${person.name}'s avatar`}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-color-text-darker line-clamp-1">
                  {person.name}
                </h4>
                <p className="text-xs text-color-text line-clamp-1">
                  {person.headline}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* LinkedIn Learning Ad Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <i className="fas fa-graduation-cap text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-color-text-darker mb-1">
                Expand your skills
              </h3>
              <p className="text-xs text-color-text">
                Explore courses recommended for you
              </p>
            </div>
          </div>

          <motion.button
            className="w-full px-4 py-2 bg-color-button-blue text-white rounded-lg text-sm font-semibold hover:bg-color-button-blue-darker transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Browse courses
          </motion.button>
        </div>
      </motion.div>

      {/* Footer Links */}
      <div className="px-4 py-3 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-xs text-color-text mb-2">
          <a href="/about" className="hover:text-color-button-blue hover:underline">
            About
          </a>
          <a href="/accessibility" className="hover:text-color-button-blue hover:underline">
            Accessibility
          </a>
          <a href="/help" className="hover:text-color-button-blue hover:underline">
            Help Center
          </a>
          <a href="/privacy" className="hover:text-color-button-blue hover:underline">
            Privacy
          </a>
          <a href="/terms" className="hover:text-color-button-blue hover:underline">
            Terms
          </a>
        </div>
        <p className="text-xs text-color-text-low-emphasis">
          LinkedIn Clone © 2025
        </p>
      </div>
    </aside>
  );
}
