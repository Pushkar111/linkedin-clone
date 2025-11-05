import { useSelector, useDispatch } from "react-redux";
import { getLoggedUserState } from "../../utilities/ReduxUtils";
import { Navigate } from "react-router-dom";
import { DesktopNavBar } from "./components/DesktopNavBar/";
import { Outlet } from "react-router-dom";
import { MobileNavBarTop } from "./components/MobileNavBar";
import { MobileNavBarBottom } from "./components/MobileNavBar";
import MediaQueries from "../../utilities/MediaQueries";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../redux/thunks";

/**
 * @returns {JSX.Element}
 */
export default function MainMenuBar() {
  const dispatch = useDispatch();
  const objLoggedUser = useSelector(getLoggedUserState);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuthentication = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      console.log("MainMenuBar - Auth check:", { 
        hasToken: !!token, 
        hasSavedUser: !!savedUser,
        hasUserId: !!objLoggedUser.strUserId,
        userId: objLoggedUser.strUserId 
      });
      
      // If token exists but user not loaded in Redux
      if (token && !objLoggedUser.strUserId) {
        console.log("MainMenuBar - Fetching current user...");
        try {
          const user = await dispatch(getCurrentUser()).unwrap();
          console.log("MainMenuBar - User loaded successfully:", user);
        } catch (error) {
          console.error("MainMenuBar - Auth check failed:", error);
          // Clear invalid tokens and user data
          if (isMounted) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
          }
        }
      }
      
      if (isMounted) {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, objLoggedUser.strUserId]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-color-main-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-color-button-blue"></div>
          <p className="mt-4 text-color-text">Loading...</p>
        </div>
      </div>
    );
  }

  // After auth check, if not authenticated and no user, redirect
  const token = localStorage.getItem("token");
  const hasUser = objLoggedUser && objLoggedUser.strUserId && objLoggedUser.strUserId.length > 0;
  
  if (!hasUser && !token) {
    console.log("MainMenuBar - No authenticated user, redirecting to landing");
    return <Navigate to={"/"} replace={true} />;
  }
  
  // If we have a token but still no user after checking, something went wrong
  if (token && !hasUser && !isCheckingAuth) {
    console.log("MainMenuBar - Token exists but no user loaded");
    // Don't redirect immediately, the useEffect will handle this
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      <header>
        {/*Desktop or Mobile Top depending on the screen size*/}
        {MediaQueries.minWidth640px.matches ? (
          <DesktopNavBar objLoggedUser={objLoggedUser} />
        ) : (
          <MobileNavBarTop objLoggedUser={objLoggedUser} />
        )}
      </header>
      <div className="relative h-full flex-1 flex flex-col">
        <Outlet />
        <div id="div-feed-portal"></div>
      </div>
      {/* Mobile Bottom*/}
      {!MediaQueries.minWidth640px.matches ? (
        <div>
          <MobileNavBarBottom objLoggedUser={objLoggedUser} />
        </div>
      ) : null}
    </div>
  );
}
