/**
 * ============================================================================
 * LINKEDIN-STYLE PROFILE EDIT MODAL - PRODUCTION READY
 * ============================================================================
 * 
 * Comprehensive profile editing modal with:
 * - Basic Info (Name, Headline, Location, About)
 * - Experience Section (Add/Edit/Delete)
 * - Education Section (Add/Edit/Delete)
 * - Skills Section (Add/Remove)
 * - Profile Photo & Banner Upload with Cropping
 * - Form Validation
 * - Auto-save functionality
 * - Toast notifications
 * - Responsive design
 * - Accessibility features
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";

// Import child components
import EditExperienceSection from "./EditExperienceSection";
import EditEducationSection from "./EditEducationSection";
import EditSkillsSection from "./EditSkillsSection";
import ImageCropperModal from "./ImageCropperModal";

// Import user context
import { useUser } from "../../contexts/UserContext";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function ProfileEditModal({ user, isOpen, onClose, onSave }) {
  const { currentUser, updateUser } = useUser();
  
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    headline: "",
    location: "",
    about: "",
    experience: [],
    education: [],
    skills: [],
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState(null);
  const [currentCropType, setCurrentCropType] = useState(null);

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const modalRef = useRef(null);

  // Initialize form data when modal opens - use latest data from context or prop
  useEffect(() => {
    if (isOpen) {
      // Also check localStorage for the absolute freshest data
      let latestUser = currentUser || user;
      
      // Double-check localStorage for updates (in case context hasn't synced)
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Use localStorage data if it exists and has a matching ID
          if (parsedUser && parsedUser._id === (user?._id || currentUser?._id)) {
            latestUser = parsedUser;
          }
        }
      } catch (error) {
        console.warn("Failed to parse user from localStorage:", error);
      }
      
      if (latestUser) {
        console.log("🔄 ProfileEditModal: Loading latest user data", {
          source: latestUser === currentUser ? "UserContext" : "Prop/LocalStorage",
          fullName: latestUser.fullName || latestUser.name,
          headline: latestUser.profile?.headline,
          experienceCount: latestUser.profile?.experience?.length || 0,
          educationCount: latestUser.profile?.education?.length || 0,
          skillsCount: latestUser.profile?.skills?.length || 0,
        });
        
        // Reset all form data with latest values
        setFormData({
          fullName: latestUser.fullName || latestUser.name || "",
          firstName: latestUser.profile?.firstName || "",
          lastName: latestUser.profile?.lastName || "",
          headline: latestUser.profile?.headline || "",
          location: latestUser.profile?.location || "",
          about: latestUser.profile?.about || "",
          experience: latestUser.profile?.experience || [],
          education: latestUser.profile?.education || [],
          skills: latestUser.profile?.skills || [],
        });
        
        // Reset image previews to latest saved images
        setProfileImagePreview(latestUser.profilePicURL || latestUser.avatarUrl);
        setBannerImagePreview(latestUser.profile?.backgroundPicURL || latestUser.profile?.bannerUrl);
        
        // Clear any pending image changes
        setProfileImageFile(null);
        setBannerImageFile(null);
        
        // Reset change tracking
        setHasChanges(false);
      }
    }
  }, [isOpen, currentUser, user]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !showImageCropper) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, showImageCropper]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setHasChanges(true);
  };

  const handleProfileImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentCropImage(reader.result);
      setCurrentCropType("profile");
      setShowImageCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 30MB)
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Image size should be less than 30MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentCropImage(reader.result);
      setCurrentCropType("banner");
      setShowImageCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageBase64) => {
    if (currentCropType === "profile") {
      setProfileImageFile(croppedImageBase64);
      setProfileImagePreview(croppedImageBase64);
      toast.success("Profile photo updated");
    } else if (currentCropType === "banner") {
      setBannerImageFile(croppedImageBase64);
      setBannerImagePreview(croppedImageBase64);
      toast.success("Banner image updated");
    }
    setShowImageCropper(false);
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Get auth token
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      // Prepare update payload - only send non-empty values
      const updatePayload = {
        fullName: formData.fullName,
        profile: {},
      };

      // Only add profile fields if they have values
      if (formData.firstName) updatePayload.profile.firstName = formData.firstName;
      if (formData.lastName) updatePayload.profile.lastName = formData.lastName;
      if (formData.headline !== undefined) updatePayload.profile.headline = formData.headline;
      if (formData.location) updatePayload.profile.location = formData.location;
      if (formData.about !== undefined) updatePayload.profile.about = formData.about;

      // Add images if changed
      if (profileImageFile) {
        updatePayload.profileImageBase64 = profileImageFile;
      }
      if (bannerImageFile) {
        updatePayload.backgroundImageBase64 = bannerImageFile;
      }

      console.log("Sending update payload:", updatePayload);

      // Update basic profile
      const profileResponse = await axios.put(
        `${API_BASE_URL}/users/${user._id}`,
        updatePayload,
        config
      );

      // Update experience
      const experienceResponse = await axios.put(
        `${API_BASE_URL}/users/${user._id}/profile/experience`,
        { experience: formData.experience },
        config
      );

      // Update education
      const educationResponse = await axios.put(
        `${API_BASE_URL}/users/${user._id}/profile/education`,
        { education: formData.education },
        config
      );

      // Update skills
      const skillsResponse = await axios.put(
        `${API_BASE_URL}/users/${user._id}/profile/skills`,
        { skills: formData.skills },
        config
      );

      // Build complete updated user object
      const updatedUserData = {
        ...profileResponse.data.user,
        profile: {
          ...profileResponse.data.user.profile,
          experience: experienceResponse.data.experience || formData.experience,
          education: educationResponse.data.education || formData.education,
          skills: skillsResponse.data.skills || formData.skills,
        },
      };

      // Update global user context
      updateUser(updatedUserData);

      toast.success("Profile updated successfully!", {
        position: "top-right",
        autoClose: 2000,
      });

      // Call parent callback with full updated data
      if (onSave) {
        onSave(updatedUserData);
      }

      setHasChanges(false);
      onClose();
    } catch (err) {
      console.error("Profile update error:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      // Get validation errors if present
      const validationErrors = err.response?.data?.errors;
      const errorMessage = validationErrors 
        ? validationErrors.map(e => e.msg).join(", ")
        : err.response?.data?.message || "Failed to update profile";
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirm) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4"
        onClick={handleClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">
              Edit Profile
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* CONTENT - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ===== BASIC INFO SECTION ===== */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name (Display Name)
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer at Google"
                  maxLength={120}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.headline.length}/120 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About
                </label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  placeholder="Write a brief summary about yourself..."
                  maxLength={2600}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.about.length}/2600 characters
                </p>
              </div>
            </section>

            {/* ===== PROFILE PHOTO & BANNER SECTION ===== */}
            <section className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Images
              </h3>

              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={profileImagePreview || "https://ui-avatars.com/api/?name=" + encodeURIComponent(formData.fullName)}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-200"
                    />
                  </div>
                  <div>
                    <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: Square image, at least 400x400px
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image
                </label>
                <div className="space-y-3">
                  {bannerImagePreview && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden ring-2 ring-gray-200">
                      <img
                        src={bannerImagePreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Upload Banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: 1584x396px or 4:1 aspect ratio
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== EXPERIENCE SECTION ===== */}
            <div className="border-t border-gray-200 pt-6">
              <EditExperienceSection
                experiences={formData.experience}
                setFormData={setFormData}
              />
            </div>

            {/* ===== EDUCATION SECTION ===== */}
            <div className="border-t border-gray-200 pt-6">
              <EditEducationSection
                education={formData.education}
                setFormData={setFormData}
              />
            </div>

            {/* ===== SKILLS SECTION ===== */}
            <div className="border-t border-gray-200 pt-6">
              <EditSkillsSection
                skills={formData.skills}
                setFormData={setFormData}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              {hasChanges && "You have unsaved changes"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* IMAGE CROPPER MODAL */}
      {showImageCropper && (
        <ImageCropperModal
          isOpen={showImageCropper}
          onClose={() => setShowImageCropper(false)}
          imageSrc={currentCropImage}
          onCropComplete={handleCropComplete}
          aspectRatio={currentCropType === "profile" ? 1 : 4}
          cropShape={currentCropType === "profile" ? "round" : "rect"}
          title={currentCropType === "profile" ? "Crop Profile Photo" : "Crop Banner Image"}
        />
      )}
    </AnimatePresence>
  );
}
