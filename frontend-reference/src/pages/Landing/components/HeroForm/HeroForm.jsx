import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  RoundedTextButton,
  ButtonRounded,
} from "../../../../components/form-controls/";
import {
  showCustomTextToast,
  showNotAvailableToast,
} from "../../../../utilities";

export default function HeroForm() {
  const objNavigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    headline: "",
    countryLoc: "",
    postalCodeLoc: "",
  });
  const [isRegistering, setIsRegistering] = useState(true); // Toggle between register/login
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showCustomTextToast("Image size must be less than 5MB", 3);
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        showCustomTextToast("Only image files are allowed (JPEG, PNG, GIF, WebP)", 3);
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const handleAgreeAndJoinClick = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.email || !formData.password) {
      showCustomTextToast("Please enter both email and password", 3);
      return;
    }

    if (formData.password.length < 6) {
      showCustomTextToast("Password must be at least 6 characters", 3);
      return;
    }

    // Additional validation for registration
    if (isRegistering) {
      if (!formData.firstName || !formData.lastName) {
        showCustomTextToast("Please enter your first and last name", 3);
        return;
      }
    }

    // Import and call the appropriate handler
    import("./HeroFormUtil").then(({ handleEmailRegister, handleEmailLogin }) => {
      if (isRegistering) {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        handleEmailRegister(
          { 
            email: formData.email, 
            password: formData.password, 
            fullName: fullName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            headline: formData.headline,
            countryLoc: formData.countryLoc,
            postalCodeLoc: formData.postalCodeLoc,
            profileImage: profileImage, // Pass profile image file
          }, 
          dispatch, 
          objNavigate
        );
      } else {
        handleEmailLogin(
          { 
            email: formData.email, 
            password: formData.password 
          }, 
          dispatch, 
          objNavigate
        );
      }
    });
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    objNavigate("/forgot-password");
  };

  const handleJoinGoogleClick = (e) => {
    e.preventDefault();
    import("./HeroFormUtil").then(({ handleAsyncJoinGoogle }) => {
      handleAsyncJoinGoogle(dispatch, objNavigate);
    });
  };

  const handleTermsAndConditions = () => {
    showNotAvailableToast();
  };

  return (
    <form className="w-full sm:w-[408px]" onSubmit={handleAgreeAndJoinClick}>
      <p className="pb-[24px] sm:pb-0 text-[33px] sm:text-[58px] text-color-text-accent sm:font-light leading-[1.2]  sm:text-opacity-90">
        Welcome to your professional community
      </p>
      <div className=" pt-3 pb-7 sm:pt-8 sm:pb-4">
        <div className="flex flex-col gap-3">
          {isRegistering && (
            <>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
                  type="text"
                  name="firstName"
                  id="input-text-firstname"
                  placeholder="First Name*"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  className="flex-1 h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
                  type="text"
                  name="lastName"
                  id="input-text-lastname"
                  placeholder="Last Name*"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {/* Profile Picture Upload */}
              <div className="w-full border-color-button-gray rounded-sm bg-transparent p-3">
                <label className="block text-sm font-medium text-color-text mb-2">
                  Profile Picture (Optional)
                </label>
                {profileImagePreview ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-color-blue"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-color-button-gray rounded-md cursor-pointer hover:border-color-blue transition-colors">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-color-text-low-emphasis" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm text-color-text-low-emphasis">Click to upload photo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-color-text-low-emphasis mt-1">
                  Max size: 5MB. Formats: JPEG, PNG, GIF, WebP
                </p>
              </div>
            </>
          )}
          <input
            className="w-full h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
            type="email"
            name="email"
            id="input-text-email"
            placeholder="Email or phone number"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input
            className="w-full h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
            type="password"
            name="password"
            id="input-text-pass"
            placeholder="Password (6+ characters)"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
          />
          {isRegistering && (
            <>
              <input
                className="w-full h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
                type="text"
                name="headline"
                id="input-text-headline"
                placeholder="Professional Headline (e.g., Software Engineer at XYZ)"
                value={formData.headline}
                onChange={handleInputChange}
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
                  type="text"
                  name="countryLoc"
                  id="input-text-country"
                  placeholder="Country"
                  value={formData.countryLoc}
                  onChange={handleInputChange}
                />
                <input
                  className="flex-1 h-12 border-color-button-gray rounded-sm bg-transparent px-3 text-base"
                  type="text"
                  name="postalCodeLoc"
                  id="input-text-postalcode"
                  placeholder="Postal Code"
                  value={formData.postalCodeLoc}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
        </div>
        {!isRegistering && (
          <div className="text-right mt-2">
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-color-blue hover:underline text-sm font-semibold"
            >
              Forgot password?
            </button>
          </div>
        )}
        <p className=" py-3 text-[15px] leading-5 text-color-text font-medium">
          By clicking Agree & Join, you agree to the LinkedIn{" "}
          <span
            onClick={handleTermsAndConditions}
            className=" hover:cursor-pointer hover:underline text-color-blue font-bold"
          >
            User Agreement, Privacy Policy
          </span>
          {" and "}
          <span
            onClick={handleTermsAndConditions}
            className="hover:cursor-pointer hover:underline text-color-blue  font-bold"
          >
            Cookie Policy
          </span>
          .
        </p>
        <div className="sm:text-xl">
          <RoundedTextButton
            strColor="blue"
            strText={isRegistering ? "Agree & Join" : "Sign In"}
            booBorder={true}
            booColoredBackground={true}
            booFullWidth={true}
            handleClick={handleAgreeAndJoinClick}
          />
        </div>
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-color-blue hover:underline text-sm"
          >
            {isRegistering 
              ? "Already have an account? Sign in" 
              : "New to LinkedIn? Join now"}
          </button>
        </div>
        <div className=" mt-4">
          <ButtonRounded onClick={handleJoinGoogleClick}>
            <div className="flex gap-4 sm:gap-6 items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 24 24"
                width="24px"
                height="24px"
                x="0"
                y="0"
                preserveAspectRatio="xMinYMin meet"
                focusable="false"
              >
                <g>
                  <path
                    fill="#E94435"
                    d="M12.1,5.8c1.6-0.1,3.1,0.5,4.3,1.6l2.6-2.7c-1.9-1.8-4.4-2.7-6.9-2.7c-3.8,0-7.2,2-9,5.3l3,2.4C7.1,7.2,9.5,5.7,12.1,5.8z"
                  ></path>
                  <path
                    fill="#F8BB15"
                    d="M5.8,12c0-0.8,0.1-1.6,0.4-2.3l-3-2.4C2.4,8.7,2,10.4,2,12c0,1.6,0.4,3.3,1.1,4.7l3.1-2.4C5.9,13.6,5.8,12.8,5.8,12z"
                  ></path>
                  <path
                    fill="#34A751"
                    d="M15.8,17.3c-1.2,0.6-2.5,1-3.8,0.9c-2.6,0-4.9-1.5-5.8-3.9l-3.1,2.4C4.9,20,8.3,22.1,12,22c2.5,0.1,4.9-0.8,6.8-2.3L15.8,17.3z"
                  ></path>
                  <path
                    fill="#547DBE"
                    d="M22,12c0-0.7-0.1-1.3-0.2-2H12v4h6.1v0.2c-0.3,1.3-1.1,2.4-2.2,3.1l3,2.4C21,17.7,22.1,14.9,22,12z"
                  ></path>
                </g>
              </svg>
              <p className=" text-color-button-gray text-lg sm:text-xl font-medium">
                Join with Google
              </p>
            </div>
          </ButtonRounded>
        </div>
      </div>
    </form>
  );
}
