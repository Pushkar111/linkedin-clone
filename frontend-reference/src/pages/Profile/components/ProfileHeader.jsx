/**
 * ProfileHeader Component
 * 
 * LinkedIn-style profile header with:
 * - Full-width banner with safe area (1584×396)
 * - Circular avatar overlapping banner (~120-150px, overlap by 30-40px)
 * - Name, headline, location
 * - Action buttons (Edit Profile / Message / Connect / More)
 * - Responsive: avatar positioned absolutely, banner responsive height
 * - Framer Motion animations: banner fade-in, avatar scale-up
 * - Accessibility: semantic HTML, ARIA labels, keyboard navigation
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ConnectionButton from "../../../components/ConnectionButton/ConnectionButton";

export default function ProfileHeader({
  profile,
  isOwner
}) {
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Animation variants
  const bannerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const avatarVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2, ease: "easeOut" }
    }
  };

  const infoVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.3 }
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile page or open modal
    console.log("Edit profile");
  };

  const handleMessage = () => {
    console.log("Message user");
  };

  return (
    <motion.section
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      role="region"
      aria-label="Profile header"
    >
      {/* BANNER IMAGE - Full width, responsive height with safe area */}
      <div className="relative w-full h-32 sm:h-40 md:h-48 lg:h-52 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 overflow-hidden">
        {/* Background pattern for visual interest */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Banner image if provided */}
        {profile.bannerUrl && (
          <img
            src={profile.bannerUrl}
            alt=""
            className="w-full h-full object-cover object-center"
            loading="eager"
            role="presentation"
          />
        )}

        {/* Safe area overlay for important content positioning */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
      </div>

      {/* CONTENT CONTAINER - Padding for avatar overlap */}
      <div className="relative px-6 pb-6">
        
        {/* AVATAR - Positioned to overlap banner by 30-40px */}
        <motion.div
          className="relative -mt-16 sm:-mt-20 mb-4"
          variants={avatarVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="inline-block">
            {/* Avatar with ring and hover effect */}
            <motion.button
              onClick={() => navigate(`/profile/${profile._id}`)}
              className="block rounded-full ring-4 ring-white bg-white overflow-hidden focus:outline-none focus:ring-4 focus:ring-color-button-blue transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              aria-label={`View ${profile.name}'s profile picture`}
            >
              <img
                src={profile.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.name)}
                alt={`${profile.name}"s avatar`}
                className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 object-cover"
                loading="eager"
              />
            </motion.button>
          </div>
        </motion.div>

        {/* NAME, HEADLINE, LOCATION - Info section */}
        <motion.div
          variants={infoVariants}
          initial="hidden"
          animate="visible"
          className="mb-4"
        >
          {/* Name - Large, bold, clickable */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-color-text-darker mb-1">
            {profile.name}
          </h1>

          {/* Headline - Medium emphasis */}
          {profile.headline && (
            <p className="text-base sm:text-lg text-color-text mb-2 font-normal">
              {profile.headline}
            </p>
          )}

          {/* Location - Low emphasis with icon */}
          {profile.location && (
            <p className="text-sm text-color-text-low-emphasis flex items-center gap-1">
              <i className="fas fa-map-marker-alt text-xs" aria-hidden="true" />
              <span>{profile.location}</span>
            </p>
          )}

          {/* Bio/About - Short summary */}
          {profile.bio && (
            <p className="text-sm text-color-text mt-3 max-w-2xl line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Followers/Connections count - Clickable */}
          <div className="flex items-center gap-4 mt-3">
            <button
              className="text-sm text-color-button-blue hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-color-button-blue rounded px-1"
              onClick={() => console.log("View connections")}
              aria-label={`${profile.connectionsCount || 0} connections`}
            >
              {profile.connectionsCount || 0} connections
            </button>
            {profile.followersCount > 0 && (
              <span className="text-sm text-color-text">
                {profile.followersCount} followers
              </span>
            )}
          </div>
        </motion.div>

        {/* ACTION BUTTONS - Conditional rendering based on ownership */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center gap-3"
        >
          {isOwner ? (
            <>
              {/* OWNER ACTIONS */}
              <motion.button
                onClick={handleEditProfile}
                className="px-6 py-2 bg-color-button-blue text-white rounded-full font-semibold hover:bg-color-button-blue-darker transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Edit profile"
              >
                <i className="fas fa-pencil-alt mr-2" aria-hidden="true" />
                Edit Profile
              </motion.button>
              
              <motion.button
                className="px-4 py-2 border border-color-gray-ligth text-color-text-darker rounded-full font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add profile section
              </motion.button>
            </>
          ) : (
            <>
              {/* VISITOR ACTIONS */}
              {/* LinkedIn-Style Connection Button */}
              <ConnectionButton
                targetUserId={profile._id}
                isOwner={false}
                size="md"
                showMutualCount={true}
                onStatusChange={(newStatus) => {
                  console.log("Connection status changed:", newStatus);
                }}
                className=""
              />

              {/* Message Button */}
              <motion.button
                onClick={handleMessage}
                className="px-6 py-2 border border-color-gray-ligth text-color-text-darker rounded-full font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Send message"
              >
                <i className="fas fa-envelope mr-2" aria-hidden="true" />
                Message
              </motion.button>

              {/* More Options Dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 border border-color-gray-ligth text-color-text-darker rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-offset-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="More actions"
                  aria-expanded={showMoreMenu}
                  aria-haspopup="true"
                >
                  <i className="fas fa-ellipsis-h px-2" aria-hidden="true" />
                </motion.button>

                {/* Dropdown Menu */}
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                    role="menu"
                  >
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-color-text-darker hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
                      role="menuitem"
                    >
                      <i className="fas fa-share-alt mr-2" aria-hidden="true" />
                      Share profile
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-color-text-darker hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
                      role="menuitem"
                    >
                      <i className="fas fa-flag mr-2" aria-hidden="true" />
                      Report profile
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
