/**
 * ============================================================================
 * LINKEDIN-STYLE USER PROFILE PAGE - PRODUCTION READY
 * ============================================================================
 * 
 * Main Profile Page Component
 * - Two-column responsive layout (66% main / 30% sidebar)
 * - Framer Motion animations
 * - API integration with error handling
 * - Optimistic updates
 * - Accessibility features (ARIA, keyboard navigation)
 * 
 * @version 2.0.0
 * @author Senior Frontend Engineer
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

// Import child components
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";
import ProfileTabs from "./components/ProfileTabs";
import AboutSection from "./components/AboutSection";
import ExperienceSection from "./components/ExperienceSection";
import EducationSection from "./components/EducationSection";
import SkillsSection from "./components/SkillsSection";
import ProfilePostsFeed from "./components/ProfilePostsFeed";
import RightSidebar from "./components/RightSidebar";
import ProfileSkeleton from "./components/ProfileSkeleton";

// API Service
import { getUserProfile } from "../../services/profileAPI";
import { connectionAPI } from "../../services";

// User Context
import { useUser } from "../../contexts/UserContext";

/**
 * Main Profile Page Component
 * Handles data fetching, state management, and layout orchestration
 */
export default function ProfileV2() {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "posts";

  // State management
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger

  // Get current user from context
  const { currentUser } = useUser();
  const currentUserId = currentUser?._id || currentUser?.strUserId;
  const isOwner = currentUserId === userId;

  /**
   * Fetch user profile data
   * Implements error handling and loading states
   */
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getUserProfile(userId);
      
      // Fetch connection degree if not viewing own profile
      if (!isOwner && currentUserId && userId) {
        try {
          const degree = await connectionAPI.getConnectionDegree(currentUserId, userId);
          // Add connection degree to profile data
          data.connectionDegree = degree;
        } catch (degreeError) {
          console.warn("Failed to fetch connection degree:", degreeError);
          // Default to 3rd degree if fetch fails
          data.connectionDegree = 3;
        }
      }
      
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId, isOwner, currentUserId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, refreshKey, fetchProfile]);

  /**
   * Handle profile update from modal
   * Optimistically update the UI with new data
   */
  const handleProfileUpdate = useCallback((updatedUserData) => {
    if (!updatedUserData) return;

    // Transform backend data to profile format
    const updatedProfile = {
      ...profile,
      _id: updatedUserData._id,
      name: updatedUserData.fullName || updatedUserData.name,
      email: updatedUserData.email,
      headline: updatedUserData.profile?.headline || "",
      avatarUrl: updatedUserData.profilePicURL || profile.avatarUrl,
      bannerUrl: updatedUserData.profile?.backgroundPicURL || profile.bannerUrl,
      location: updatedUserData.profile?.location || "",
      bio: updatedUserData.profile?.about || "",
      experience: updatedUserData.profile?.experience || [],
      education: updatedUserData.profile?.education || [],
      skills: updatedUserData.profile?.skills || [],
    };

    // Update profile state immediately (optimistic update)
    setProfile(updatedProfile);

    // Trigger a refresh to sync with backend
    setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
  }, [profile]);



  /**
   * Handle tab changes with URL param updates
   * Enables deep linking and browser back/forward
   */
  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  /**
   * Page animations - staggered entrance
   */
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Loading skeleton
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-color-main-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-md p-8 max-w-md text-center"
        >
          <div className="text-red-500 text-5xl mb-4">
            <i className="fas fa-exclamation-circle" />
          </div>
          <h2 className="text-2xl font-semibold text-color-text-darker mb-2">
            Profile Not Found
          </h2>
          <p className="text-color-text mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-color-button-blue text-white rounded-full hover:bg-color-button-blue-darker transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{profile.name} | {profile.headline || "LinkedIn"}</title>
        <meta name="description" content={profile.bio || profile.headline} />
        <meta property="og:title" content={`${profile.name} - ${profile.headline}`} />
        <meta property="og:image" content={profile.avatarUrl} />
        <meta property="og:type" content="profile" />
      </Helmet>

      {/* Main Container - LinkedIn style background */}
      <motion.div
        className="min-h-screen bg-color-main-background"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Responsive Grid Layout - Full width on mobile, two columns on desktop */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
            
            {/* MAIN CONTENT COLUMN - Full width on mobile, 66% on desktop */}
            <motion.main
              className="lg:col-span-8 space-y-3 sm:space-y-4"
              variants={contentVariants}
              role="main"
              aria-label="Profile main content"
            >
              {/* Profile Header Card - Banner, Avatar, Name, Actions */}
              <ProfileHeader
                profile={profile}
                isOwner={isOwner}
                onProfileUpdate={handleProfileUpdate}
              />

              {/* Stats Bar - Posts, Connections, Views, Reactions */}
              <ProfileStats
                postCount={profile.postCount || 0}
                connectionsCount={profile.connectionsCount || 0}
                followersCount={profile.followersCount || 0}
                profileViews={profile.views || 0}
                reactionsReceived={profile.reactionsReceived || 0}
              />

              {/* Tab Navigation - Posts, About, Activity */}
              <ProfileTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />

   
              {/* Tab Content - Conditional rendering based on active tab */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Posts Tab */}
                {activeTab === "posts" && (
                  <ProfilePostsFeed userId={userId} />
                )}

                {/* About Tab - Show all profile sections */}
                {activeTab === "about" && (
                  <div className="space-y-4">
                    {/* About Section */}
                    <AboutSection profile={profile} />

                    {/* Experience Section */}
                    <ExperienceSection experiences={profile.experience || []} />

                    {/* Education Section */}
                    <EducationSection education={profile.education || []} />

                    {/* Skills Section */}
                    <SkillsSection skills={profile.skills || []} />
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-sm p-12 text-center"
                  >
                    <div className="text-color-text text-5xl mb-4">
                      <i className="fas fa-chart-line" />
                    </div>
                    <h3 className="text-xl font-semibold text-color-text-darker mb-2">
                      Activity Feed
                    </h3>
                    <p className="text-color-text">
                      Recent likes, comments, and profile views coming soon...
                    </p>
                  </motion.div>
                )}

                {/* Connections Tab */}
                {activeTab === "connections" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-sm p-12 text-center"
                  >
                    <div className="text-color-text text-5xl mb-4">
                      <i className="fas fa-users" />
                    </div>
                    <h3 className="text-xl font-semibold text-color-text-darker mb-2">
                      Connections
                    </h3>
                    <p className="text-color-text">
                      View all connections and mutual connections...
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.main>

            {/* RIGHT SIDEBAR - 30% width, sticky on desktop */}
            <motion.aside
              className="lg:col-span-4"
              variants={contentVariants}
              role="complementary"
              aria-label="Profile sidebar"
            >
              <div className="sticky top-20 space-y-4">
                <RightSidebar profile={profile} />
              </div>
            </motion.aside>
          </div>
        </div>
      </motion.div>
    </>
  );
}
