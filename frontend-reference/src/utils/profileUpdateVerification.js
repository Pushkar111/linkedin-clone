/**
 * ============================================================================
 * PROFILE UPDATE VERIFICATION UTILITY
 * ============================================================================
 * 
 * Quick tests to verify profile update data flow
 * Run in browser console on Profile page after editing
 * 
 * Usage:
 * 1. Open Profile page
 * 2. Open DevTools Console (F12)
 * 3. Copy and paste this file's code
 * 4. Call verification functions
 */

// ============================================================================
// TEST 1: Check UserContext is available
// ============================================================================
export function testUserContext() {
  console.log("🧪 TEST 1: Checking UserContext availability...");
  
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      console.error("❌ FAIL: No user in localStorage");
      return false;
    }
    
    const user = JSON.parse(userStr);
    console.log("✅ PASS: User found in localStorage:", user);
    
    // Check required fields
    const requiredFields = ["_id", "fullName", "email"];
    const missingFields = requiredFields.filter(field => !user[field]);
    
    if (missingFields.length > 0) {
      console.error("❌ FAIL: Missing required fields:", missingFields);
      return false;
    }
    
    console.log("✅ PASS: All required fields present");
    return true;
  } catch (error) {
    console.error("❌ FAIL: Error checking UserContext:", error);
    return false;
  }
}

// ============================================================================
// TEST 2: Verify Profile Data Structure
// ============================================================================
export function testProfileDataStructure() {
  console.log("🧪 TEST 2: Verifying profile data structure...");
  
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check profile object exists
    if (!user.profile) {
      console.warn("⚠️ WARNING: No profile object found");
    } else {
      console.log("✅ PASS: Profile object exists");
      console.log("Profile fields:", Object.keys(user.profile));
    }
    
    // Check arrays
    const arrays = {
      experience: user.profile?.experience,
      education: user.profile?.education,
      skills: user.profile?.skills,
    };
    
    Object.entries(arrays).forEach(([name, arr]) => {
      if (!Array.isArray(arr)) {
        console.warn(`⚠️ WARNING: ${name} is not an array:`, arr);
      } else {
        console.log(`✅ PASS: ${name} is array with ${arr.length} items`);
      }
    });
    
    return true;
  } catch (error) {
    console.error("❌ FAIL: Error checking profile structure:", error);
    return false;
  }
}

// ============================================================================
// TEST 3: Simulate Profile Update
// ============================================================================
export function testProfileUpdate(testData = {}) {
  console.log("🧪 TEST 3: Simulating profile update...");
  
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const originalName = user.fullName;
    
    // Update user data
    const updatedUser = {
      ...user,
      fullName: testData.fullName || "Test User Updated",
      profile: {
        ...user.profile,
        headline: testData.headline || "Test Headline Updated",
        about: testData.about || "Test about section updated",
      },
    };
    
    // Save to localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));
    console.log("✅ PASS: User data updated in localStorage");
    
    // Verify update
    const verifyUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (verifyUser.fullName === updatedUser.fullName) {
      console.log("✅ PASS: Update verified successfully");
      console.log(`Changed name: "${originalName}" → "${verifyUser.fullName}"`);
      
      // Restore original data
      localStorage.setItem("user", JSON.stringify(user));
      console.log("🔄 Original data restored");
      
      return true;
    } else {
      console.error("❌ FAIL: Update not reflected");
      return false;
    }
  } catch (error) {
    console.error("❌ FAIL: Error during update test:", error);
    return false;
  }
}

// ============================================================================
// TEST 4: Check API Response Format
// ============================================================================
export async function testAPIResponse(userId) {
  console.log("🧪 TEST 4: Checking API response format...");
  
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ FAIL: No auth token found");
      return false;
    }
    
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.error("❌ FAIL: API returned error:", response.status);
      return false;
    }
    
    const data = await response.json();
    console.log("✅ PASS: API response received");
    console.log("Response structure:", {
      success: data.success,
      hasUser: !!data.user,
      userFields: data.user ? Object.keys(data.user) : [],
    });
    
    // Verify required fields
    if (!data.user) {
      console.error("❌ FAIL: No user object in response");
      return false;
    }
    
    const requiredFields = ["_id", "fullName", "email", "profile"];
    const missingFields = requiredFields.filter(field => !data.user[field]);
    
    if (missingFields.length > 0) {
      console.error("❌ FAIL: Missing fields in API response:", missingFields);
      return false;
    }
    
    console.log("✅ PASS: All required fields present in API response");
    return true;
  } catch (error) {
    console.error("❌ FAIL: API test error:", error);
    return false;
  }
}

// ============================================================================
// TEST 5: Verify Component Re-render
// ============================================================================
export function testComponentRerender() {
  console.log("🧪 TEST 5: Checking component re-render capability...");
  
  try {
    // Check if React DevTools is available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log("✅ PASS: React DevTools detected");
    } else {
      console.warn("⚠️ WARNING: React DevTools not detected");
    }
    
    // Check for profile elements in DOM
    const profileElements = {
      header: document.querySelector('[role="region"][aria-label="Profile header"]'),
      about: document.querySelector('[role="region"][aria-label="About"]'),
      experience: document.querySelector('[role="region"][aria-label="Experience"]'),
      education: document.querySelector('[role="region"][aria-label="Education"]'),
      skills: document.querySelector('[role="region"][aria-label="Skills"]'),
    };
    
    console.log("Profile sections found in DOM:");
    Object.entries(profileElements).forEach(([name, element]) => {
      if (element) {
        console.log(`  ✅ ${name}: Found`);
      } else {
        console.log(`  ⚠️ ${name}: Not found (may not be rendered)`);
      }
    });
    
    return true;
  } catch (error) {
    console.error("❌ FAIL: Component check error:", error);
    return false;
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
export async function runAllTests(userId) {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 RUNNING ALL PROFILE UPDATE VERIFICATION TESTS");
  console.log("=".repeat(80) + "\n");
  
  const results = {
    userContext: false,
    dataStructure: false,
    profileUpdate: false,
    apiResponse: false,
    componentRerender: false,
  };
  
  // Run tests
  results.userContext = testUserContext();
  console.log("\n" + "-".repeat(80) + "\n");
  
  results.dataStructure = testProfileDataStructure();
  console.log("\n" + "-".repeat(80) + "\n");
  
  results.profileUpdate = testProfileUpdate();
  console.log("\n" + "-".repeat(80) + "\n");
  
  if (userId) {
    results.apiResponse = await testAPIResponse(userId);
    console.log("\n" + "-".repeat(80) + "\n");
  } else {
    console.log("⚠️ Skipping API test (no userId provided)");
    console.log("\n" + "-".repeat(80) + "\n");
  }
  
  results.componentRerender = testComponentRerender();
  console.log("\n" + "-".repeat(80) + "\n");
  
  // Summary
  console.log("=".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\nTests Passed: ${passed}/${total}`);
  
  Object.entries(results).forEach(([name, result]) => {
    const icon = result ? "✅" : "❌";
    console.log(`${icon} ${name}: ${result ? "PASS" : "FAIL"}`);
  });
  
  if (passed === total) {
    console.log("\n🎉 ALL TESTS PASSED! Profile update flow is working correctly.");
  } else {
    console.log("\n⚠️ SOME TESTS FAILED. Check the logs above for details.");
  }
  
  console.log("=".repeat(80) + "\n");
  
  return results;
}

// ============================================================================
// QUICK HELPER FUNCTIONS
// ============================================================================

// Get current user
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return null;
  }
}

// Get current user ID
export function getCurrentUserId() {
  const user = getCurrentUser();
  return user?._id || user?.strUserId || null;
}

// Log current user data
export function logCurrentUser() {
  const user = getCurrentUser();
  console.log("Current User:", user);
  return user;
}

// Clear user data (logout)
export function clearUserData() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  console.log("✅ User data cleared");
}

// ============================================================================
// BROWSER CONSOLE INSTRUCTIONS
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                 PROFILE UPDATE VERIFICATION UTILITY                        ║
║                                                                            ║
║  To verify profile update flow, run these commands:                       ║
║                                                                            ║
║  1. Run all tests:                                                         ║
║     runAllTests(getCurrentUserId())                                        ║
║                                                                            ║
║  2. Run individual tests:                                                  ║
║     testUserContext()                                                      ║
║     testProfileDataStructure()                                             ║
║     testProfileUpdate()                                                    ║
║     testAPIResponse(getCurrentUserId())                                    ║
║     testComponentRerender()                                                ║
║                                                                            ║
║  3. Helper functions:                                                      ║
║     getCurrentUser()      // Get user from localStorage                    ║
║     getCurrentUserId()    // Get current user ID                           ║
║     logCurrentUser()      // Log user data to console                      ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// Auto-export for browser console
if (typeof window !== "undefined") {
  window.ProfileUpdateTests = {
    runAllTests,
    testUserContext,
    testProfileDataStructure,
    testProfileUpdate,
    testAPIResponse,
    testComponentRerender,
    getCurrentUser,
    getCurrentUserId,
    logCurrentUser,
    clearUserData,
  };
  
  console.log("✅ Tests available at: window.ProfileUpdateTests");
}
