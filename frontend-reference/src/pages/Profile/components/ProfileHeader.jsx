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

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ConnectionButton from "../../../components/ConnectionButton/ConnectionButton";
import { ProfileEditModal } from "../../../components/ProfileEditModal";

export default function ProfileHeader({
  profile,
  isOwner,
  onProfileUpdate
}) {
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

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
    setShowEditModal(true);
  };

  const handleSaveProfile = (updatedUserData) => {
    // Pass updated data to parent ProfileV2 component
    if (onProfileUpdate) {
      onProfileUpdate(updatedUserData);
    }
  };


  return (
    <motion.section
      className="bg-white rounded-2xl shadow-sm"
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      role="region"
      aria-label="Profile header"
    >
      {/* BANNER IMAGE - Full width, responsive height with safe area */}
      <div className="relative w-full h-32 sm:h-40 md:h-48 lg:h-52 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl">
        {/* Background pattern for visual interest */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
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
              aria-label={`View ${profile.name}"s profile picture`}
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
          {/* Name with Connection Degree - Large, bold */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-semibold text-color-text-darker">
              {profile.name}
            </h1>
            {/* Connection Degree Badge - Only show for non-owners */}
            {!isOwner && profile.connectionDegree !== undefined && (
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {profile.connectionDegree === 1 && "1st"}
                {profile.connectionDegree === 2 && "2nd"}
                {profile.connectionDegree === 3 && "3rd"}
                {profile.connectionDegree > 3 && `${profile.connectionDegree}th`}
              </span>
            )}
          </div>

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


              {/* More Options Dropdown - Enhanced Visibility & Smooth Animation */}
              <div className="relative z-50" ref={dropdownRef}>
                {/* Three-Dot Button - Always Visible with SVG Icon */}
                <motion.button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`
                    relative flex items-center justify-center
                    w-11 h-11 rounded-full border-2 
                    transition-all duration-150 ease-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${showMoreMenu 
                      ? "border-blue-500 bg-blue-50 text-blue-600 shadow-md" 
                      : "border-gray-500 text-gray-800 hover:border-gray-600 hover:bg-gray-100 shadow-sm"
                    }
                  `}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  aria-label="More actions"
                  aria-expanded={showMoreMenu}
                  aria-haspopup="true"
                >
                  {/* Three-Dot SVG Icon - Always Visible */}
                  <svg 
                    className="w-5 h-5" 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="4" cy="12" r="2" />
                    <circle cx="20" cy="12" r="2" />
                  </svg>
                </motion.button>

                {/* Dropdown Menu - Positioned Below Button */}
                <AnimatePresence mode="wait">
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100] overflow-visible"
                      role="menu"
                      style={{ transformOrigin: "top right" }}
                    >
                      {/* Share Profile Option */}
                      <button
                        onClick={() => setShowMoreMenu(false)}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150 ease-out focus:outline-none focus:bg-blue-50 flex items-center gap-3 group"
                        role="menuitem"
                      >
                        {/* Share Icon SVG */}
                        <svg 
                          className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>Share profile</span>
                      </button>

                      {/* Divider */}
                      <hr className="my-1 border-gray-200" />

                      {/* Report Profile Option */}
                      <button
                        onClick={() => setShowMoreMenu(false)}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-150 ease-out focus:outline-none focus:bg-red-50 flex items-center gap-3 group"
                        role="menuitem"
                      >
                        {/* Flag/Report Icon SVG */}
                        <svg 
                          className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        <span>Report profile</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        key={`${profile._id}-${profile.avatarUrl}-${profile.bannerUrl}-${showEditModal}`}
        user={profile}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
      />
    </motion.section>
  );
}
