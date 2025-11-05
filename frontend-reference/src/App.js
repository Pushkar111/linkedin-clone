import { lazy, Suspense } from "react";
const Landing = lazy(() => import("./pages/Landing/Landing"));
const Feed = lazy(() => import("./pages/Feed/Feed"));
// const Profile = lazy(() => import("./pages/Profile/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword/ResetPassword"));
const MainMenuBar = lazy(() => import("./layouts/MainMenuBar/MainMenuBar"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const ToastContainer = lazy(() =>
  import("react-toastify").then((module) => ({
    default: module.ToastContainer,
  }))
);
import { NavigationPaths } from "./utilities";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import ProfileV2 from "./pages/Profile/ProfileV2";

function App() {
  return (
    <Suspense>
      <BrowserRouter basename={NavigationPaths.BASE}>
        <Routes>
          <Route index element={<Landing />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<MainMenuBar />}>
            <Route path={NavigationPaths.FEED} element={<Feed />} />
            <Route path="/profile/:userId" element={<ProfileV2 />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </Suspense>
  );
}

export default App;
