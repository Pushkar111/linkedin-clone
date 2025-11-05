/**
 * ProfileTabs Component
 * 
 * Tab navigation for profile sections:
 * - Posts
 * - About
 * - Activity
 * - Connections
 * 
 * Features:
 * - Deep linking via URL params
 * - Keyboard navigation (arrow keys)
 * - Active tab indicator with smooth animation
 * - Accessibility (ARIA roles, keyboard support)
 */

import React, { useRef } from "react";
import { motion } from "framer-motion";

export default function ProfileTabs({ activeTab, onTabChange }) {
  const tabsRef = useRef({});

  const tabs = [
    { id: "posts", label: "Posts", icon: "fas fa-th" },
    { id: "about", label: "About", icon: "fas fa-user" },
    { id: "activity", label: "Activity", icon: "fas fa-chart-line" },
    { id: "connections", label: "Connections", icon: "fas fa-users" }
  ];

  // Keyboard navigation handler
  const handleKeyDown = (e, currentIndex) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        e.preventDefault();
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    if (tabsRef.current && tabsRef.current[newIndex]) {
      tabsRef.current[newIndex].focus();
    }
    onTabChange(tabs[newIndex].id);
  };

  return (
    <motion.nav
      className="bg-white rounded-2xl shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      role="tablist"
      aria-label="Profile sections"
    >
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (tabsRef.current) {
                  tabsRef.current[index] = el;
                }
              }}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex-1 min-w-max px-6 py-4 text-sm font-semibold transition-colors relative focus:outline-none focus:ring-2 focus:ring-inset focus:ring-color-button-blue ${
                isActive
                  ? "text-color-button-blue"
                  : "text-color-text hover:text-color-text-darker"
              }`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
            >
              {/* Icon + Label */}
              <span className="flex items-center justify-center gap-2">
                <i className={tab.icon} aria-hidden="true" />
                <span>{tab.label}</span>
              </span>

              {/* Active indicator - animated underline */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-color-button-blue rounded-t"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
