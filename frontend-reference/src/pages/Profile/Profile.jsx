/**
 * Profile Page Component - LinkedIn Style with Framer Motion
 * Modern, animated user profile with tabs, stats, and responsive design
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UserPostCard from "./components/UserPostCard";
import ProfileSkeleton from "./components/ProfileSkeleton";
import "./Profile.css";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const bannerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
  };

  const avatarVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.4, staggerChildren: 0.1 },
    },
  };

  const statItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
  };

  // Check if viewing own profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setIsOwnProfile(data._id === userId);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };

    fetchCurrentUser();
  }, [userId]);

  // Fetch profile data and user posts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        // API returns { success: true, user: {...} }
        setProfile(data.user || data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      try {
        setLoadingPosts(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/posts/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user posts");
        }

        const data = await response.json();
        console.log("Posts API Response:", data);
        // API returns { success: true, posts: [...] }
        setUserPosts(data.posts || data);
      } catch (err) {
        console.error("Error fetching user posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchProfile();
    fetchUserPosts();
  }, [userId]);

  // Show loading skeleton
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <motion.div
        className="profile-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="profile-error">
          <i className="fas fa-exclamation-circle"></i>
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={() => navigate("/feed")}>
            <i className="fas fa-arrow-left"></i> Back to Feed
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="profile-container"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Header Card */}
      <motion.div className="profile-card" variants={bannerVariants}>
        {/* Banner with gradient */}
        <div className="profile-banner">
          <div className="banner-gradient"></div>
        </div>

        {/* Avatar and Info Section */}
        <div className="profile-info-section">
          <motion.div
            className="profile-avatar-wrapper"
            variants={avatarVariants}
          >
            <img
              src={
                profile.profilePicURL || "https://via.placeholder.com/150"
              }
              alt={profile.fullName}
              className="profile-avatar"
            />
          </motion.div>

          <div className="profile-details">
            <motion.h1
              className="profile-name"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {profile.fullName}
            </motion.h1>
            <motion.p
              className="profile-headline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {profile.profile?.headline || "LinkedIn User"}
            </motion.p>
            {profile.profile?.about && (
              <motion.p
                className="profile-bio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {profile.profile.about}
              </motion.p>
            )}
          </div>

          {/* Edit Profile Button (only for own profile) */}
          {isOwnProfile && (
            <motion.button
              className="btn-edit-profile"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-edit"></i> Edit Profile
            </motion.button>
          )}
        </div>

        {/* Stats Section with hover animations */}
        <motion.div
          className="profile-stats"
          variants={statsVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="stat-item"
            variants={statItemVariants}
            whileHover={{ y: -4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          >
            <span className="stat-number">{profile.postCount || 0}</span>
            <span className="stat-label">Posts</span>
          </motion.div>
          <motion.div
            className="stat-item"
            variants={statItemVariants}
            whileHover={{ y: -4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          >
            <span className="stat-number">0</span>
            <span className="stat-label">Connections</span>
          </motion.div>
          <motion.div
            className="stat-item"
            variants={statItemVariants}
            whileHover={{ y: -4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          >
            <span className="stat-number">
              {userPosts.reduce((acc, post) => acc + (post.reactions?.length || 0), 0)}
            </span>
            <span className="stat-label">Reactions</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        className="profile-tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          className={`tab-button ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          <i className="fas fa-th"></i> Posts
        </button>
        <button
          className={`tab-button ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          <i className="fas fa-user"></i> About
        </button>
        <button
          className={`tab-button ${
            activeTab === "activity" ? "active" : ""
          }`}
          onClick={() => setActiveTab("activity")}
        >
          <i className="fas fa-chart-line"></i> Activity
        </button>
      </motion.div>

      {/* Tab Content with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        {/* Posts Tab */}
        {activeTab === "posts" && (
          <motion.div
            className="tab-content"
            key="posts"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {loadingPosts ? (
              <div className="loading-posts">
                <div className="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            ) : userPosts.length > 0 ? (
              <motion.div
                className="posts-grid"
                initial="hidden"
                animate="visible"
              >
                {userPosts.map((post, index) => (
                  <UserPostCard key={post._id} post={post} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="no-posts"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <i className="fas fa-inbox"></i>
                <p>No posts yet</p>
                {isOwnProfile && (
                  <button
                    className="btn-create-post"
                    onClick={() => navigate("/feed")}
                  >
                    Create Your First Post
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <motion.div
            className="tab-content"
            key="about"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="about-section">
              <motion.div
                className="about-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2>
                  <i className="fas fa-info-circle"></i> About
                </h2>
                <p>{profile.profile?.about || "No bio available"}</p>
              </motion.div>
              <motion.div
                className="about-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2>
                  <i className="fas fa-address-card"></i> Contact Information
                </h2>
                <div className="contact-info">
                  <p>
                    <i className="fas fa-envelope"></i> {profile.email}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <motion.div
            className="tab-content"
            key="activity"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="activity-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="activity-placeholder">
                <i className="fas fa-chart-line"></i>
                <h3>Activity Feed</h3>
                <p>Coming soon...</p>
                <p className="activity-description">
                  Here you&apos;ll be able to see recent likes, comments, and
                  profile views.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
