// Redux thunks for authentication
import {
  registerUser,
  loginUser,
  loginWithGoogle,
} from "../../../../redux/thunks/authThunks";
import { NavigationPaths } from "../../../../utilities";
// eslint-disable-next-line no-unused-vars
import { NavigateFunction } from "react-router-dom";

/**
 * @module HeroFormUtil
 * @description Authentication utility functions using REST API and Redux (No Firebase)
 */

/**
 * Handle user registration with email and password
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - User password
 * @param {string} params.fullName - User full name
 * @param {string} params.firstName - User first name
 * @param {string} params.lastName - User last name
 * @param {string} params.headline - User headline/title
 * @param {string} params.countryLoc - User country location
 * @param {string} params.postalCodeLoc - User postal code
 * @param {Function} dispatch - Redux dispatch function
 * @param {NavigateFunction} navigate - React Router navigate function
 * @returns {Promise<void>}
 */
export const handleEmailRegister = async (params, dispatch, navigate) => {
  try {
    console.log("Starting email registration for:", params.email);
    const result = await dispatch(registerUser(params));
    console.log("Registration result:", result);
    
    if (result.type.includes("fulfilled")) {
      console.log("Registration successful, navigating to feed");
      // Registration successful, navigate to feed
      navigate(NavigationPaths.FEED, { state: { loggedIn: true } });
    } else {
      console.error("Registration rejected:", result);
    }
  } catch (error) {
    console.error("Registration error:", error);
  }
};

/**
 * Handle user login with email and password
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - User password
 * @param {Function} dispatch - Redux dispatch function
 * @param {NavigateFunction} navigate - React Router navigate function
 * @returns {Promise<void>}
 */
export const handleEmailLogin = async ({ email, password }, dispatch, navigate) => {
  try {
    console.log("Starting email login for:", email);
    const result = await dispatch(loginUser({ email, password }));
    console.log("Login result:", result);
    
    if (result.type.includes("fulfilled")) {
      console.log("Login successful, navigating to feed");
      // Login successful, navigate to feed
      navigate(NavigationPaths.FEED, { state: { loggedIn: true } });
    } else {
      console.error("Login rejected:", result);
    }
  } catch (error) {
    console.error("Login error:", error);
  }
};

/**
 * Handle Google OAuth authentication using popup method (more reliable for localhost)
 * @param {Function} dispatch - Redux dispatch function
 * @param {NavigateFunction} navigate - React Router navigate function
 * @returns {Promise<void>}
 */
export const handleAsyncJoinGoogle = async (dispatch, navigate) => {
  try {
    console.log("Starting Google Sign-In process");
    
    // Wait for Google SDK to load (with timeout)
    const waitForGoogle = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds total
        
        const checkGoogle = setInterval(() => {
          attempts++;
          
          if (window.google && window.google.accounts) {
            clearInterval(checkGoogle);
            resolve(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkGoogle);
            reject(new Error("Google SDK failed to load"));
          }
        }, 100);
      });
    };

    try {
      await waitForGoogle();
      console.log("Google SDK loaded successfully");
    } catch (error) {
      console.error("Google Sign-In SDK not loaded");
      alert("Google Sign-In is temporarily unavailable. Please try email/password or guest login.");
      return;
    }

    // Use the renderButton method instead of prompt for better localhost support
    const buttonDiv = document.createElement("div");
    buttonDiv.style.display = "none";
    document.body.appendChild(buttonDiv);
    
    console.log("Initializing Google Sign-In with Client ID:", process.env.REACT_APP_GOOGLE_CLIENT_ID);
    
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          console.log("Google Sign-In callback received");
          document.body.removeChild(buttonDiv);
          
          // Decode the JWT token from Google
          const decoded = JSON.parse(atob(response.credential.split(".")[1]));
          console.log("Decoded Google user:", { email: decoded.email, name: decoded.name });
          
          const googleUser = {
            email: decoded.email,
            displayName: decoded.name,
            photoURL: decoded.picture,
            googleId: decoded.sub,
          };
          
          console.log("Dispatching loginWithGoogle action");
          const result = await dispatch(loginWithGoogle(googleUser));
          console.log("Login result:", result);
          
          if (result.type.includes("fulfilled")) {
            console.log("Login successful, navigating to feed");
            navigate(NavigationPaths.FEED, { state: { loggedIn: true } });
          } else {
            console.error("Login failed:", result);
            alert("Google login failed. Please try again.");
          }
        } catch (error) {
          console.error("Google authentication error:", error);
          alert("Google authentication failed: " + error.message);
        }
      },
      ux_mode: "popup", // Use popup mode instead of redirect
      context: "signin",
    });
    
    // Render button and auto-click it
    window.google.accounts.id.renderButton(buttonDiv, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
    });
    
    // Trigger the button click
    setTimeout(() => {
      const googleButton = buttonDiv.querySelector("div[role=\"button\"]");
      if (googleButton) {
        console.log("Triggering Google Sign-In");
        googleButton.click();
      } else {
        // Fallback to prompt
        console.log("Falling back to prompt method");
        window.google.accounts.id.prompt((notification) => {
          console.log("Prompt notification:", notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Prompt was not shown, show manual instruction
            alert("Please click the Google Sign-In button again or use email/password login.");
          }
        });
      }
    }, 100);
    
  } catch (error) {
    console.error("Google sign-in initialization error:", error);
    alert("An error occurred during Google Sign-In. Please try email/password or guest login.");
  }
};

/**
 * Handle forgot password request
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const handleForgotPassword = async (email) => {
  try {
    // TODO: Implement forgot password API call
    // const response = await authAPI.forgotPassword(email);
    console.log("Forgot password requested for:", email);
    alert(`Password reset link would be sent to: ${email}\n(Feature coming soon)`);
  } catch (error) {
    console.error("Forgot password error:", error);
  }
};
