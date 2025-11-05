import { lazy, Suspense, useState, useEffect } from "react";
const Landing = lazy(() => import("./pages/Landing/Landing"));
const Feed = lazy(() => import("./pages/Feed/Feed"));
// const Profile = lazy(() => import("./pages/Profile/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword/ResetPassword"));
const MainMenuBar = lazy(() => import("./layouts/MainMenuBar/MainMenuBar"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const MessagingPage = lazy(() => import("./pages/Messaging/MessagingPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetail"));
const ToastContainer = lazy(() =>
  import("react-toastify").then((module) => ({
    default: module.ToastContainer,
  }))
);
import { NavigationPaths } from "./utilities";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import ProfileV2 from "./pages/Profile/ProfileV2";
import { SocketProvider } from "./contexts/SocketContext";
import { ReactionProvider } from "./contexts/ReactionContext";
import { UserProvider } from "./contexts/UserContext";
import { PostModalProvider } from "./contexts/PostModalContext";

function App() {
  // Get current user from localStorage for ReactionProvider
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        setCurrentUser(JSON.parse(user));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
    }

    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          setCurrentUser(JSON.parse(user));
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Suspense>
      <BrowserRouter basename={NavigationPaths.BASE}>
        <UserProvider>
          <ReactionProvider currentUser={currentUser}>
            <SocketProvider>
              <PostModalProvider>
                <Routes>
                  <Route index element={<Landing />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route element={<MainMenuBar />}>
                    <Route path={NavigationPaths.FEED} element={<Feed />} />
                    <Route path="/profile/:userId" element={<ProfileV2 />} />
                    <Route path="/post/:postId" element={<PostDetailPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path={NavigationPaths.MESSAGING} element={<MessagingPage />} />
                    <Route path={`${NavigationPaths.MESSAGING}/:userId`} element={<MessagingPage />} />
                  </Route>
                </Routes>
              </PostModalProvider>
            </SocketProvider>
          </ReactionProvider>
        </UserProvider>
      </BrowserRouter>
      <ToastContainer />
    </Suspense>
  );
}

export default App;
