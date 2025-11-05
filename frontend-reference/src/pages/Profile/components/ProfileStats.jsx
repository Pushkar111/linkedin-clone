/**
 * ProfileStats Component
 * 
 * Displays user statistics in a responsive grid:
 * - Posts count
 * - Connections/Followers count
 * - Profile views
 * - Reactions received
 * 
 * Each stat card is clickable with hover animation
 * Uses Framer Motion for staggered entrance and hover effects
 */

import React from "react";
import { motion } from "framer-motion";

export default function ProfileStats({
  postCount,
  connectionsCount,
  followersCount,
  profileViews,
  reactionsReceived
}) {
  const stats = [
    {
      id: "posts",
      label: "Posts",
      value: postCount,
      icon: "fas fa-newspaper",
      color: "text-blue-600",
      onClick: () => console.log("Navigate to posts")
    },
    {
      id: "connections",
      label: "Connections",
      value: connectionsCount,
      icon: "fas fa-users",
      color: "text-green-600",
      onClick: () => console.log("Navigate to connections")
    },
    {
      id: "followers",
      label: "Followers",
      value: followersCount,
      icon: "fas fa-user-friends",
      color: "text-purple-600",
      onClick: () => console.log("Navigate to followers")
    },
    {
      id: "views",
      label: "Profile Views",
      value: profileViews,
      icon: "fas fa-eye",
      color: "text-indigo-600",
      onClick: () => console.log("Navigate to analytics")
    },
    {
      id: "reactions",
      label: "Reactions",
      value: reactionsReceived,
      icon: "fas fa-heart",
      color: "text-red-600",
      onClick: () => console.log("Navigate to reactions")
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.section
      className="bg-white rounded-2xl shadow-sm p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="region"
      aria-label="Profile statistics"
    >
      <h2 className="text-lg font-semibold text-color-text-darker mb-4">
        Analytics
      </h2>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <motion.button
            key={stat.id}
            onClick={stat.onClick}
            variants={itemVariants}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 24px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
            className="bg-color-gray-soft-background rounded-xl p-4 text-left transition-all hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
            aria-label={`${stat.value} ${stat.label}`}
          >
            {/* Icon */}
            <div className={`text-2xl ${stat.color} mb-2`}>
              <i className={stat.icon} aria-hidden="true" />
            </div>

            {/* Value */}
            <div className="text-2xl font-bold text-color-text-darker mb-1">
              {stat.value.toLocaleString()}
            </div>

            {/* Label */}
            <div className="text-xs sm:text-sm text-color-text font-medium">
              {stat.label}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Optional: Private analytics link for owner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 pt-4 border-t border-gray-200"
      >
        <button className="text-sm text-color-button-blue hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-color-button-blue rounded px-1">
          <i className="fas fa-chart-line mr-2" aria-hidden="true" />
          View detailed analytics
        </button>
      </motion.div>
    </motion.section>
  );
}
