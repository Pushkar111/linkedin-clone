import { lazy, Suspense, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import MediaQueries from "../../utilities/MediaQueries";
import { getLoggedUserState } from "../../utilities/ReduxUtils";
import { LinkedInLoader } from "../../components";
//import { AdsContainer } from "";
import { NewsFeed } from "./components/NewsFeed";
import UserInformation from "./components/UserInformation/UserInformation";
const AdsContainer = lazy(() =>
  import("./components/AdsContainer").then((mod) => ({
    default: mod.AdsContainer,
  }))
);

export default function Feed() {
  const objLoggedUser = useSelector(getLoggedUserState);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    console.log("Feed mounted - showing loader");
    // Always show loader for 1.5 seconds when Feed page is loaded
    const timer = setTimeout(() => {
      console.log("Loader timeout complete - hiding loader");
      setIsInitialLoading(false);
    }, 1500);

    return () => {
      console.log("Feed unmounting - clearing timer");
      clearTimeout(timer);
    };
  }, []);

  console.log("Feed render - isInitialLoading:", isInitialLoading);

  // Show LinkedIn loader on initial load
  if (isInitialLoading) {
    console.log("Rendering LinkedInLoader");
    return <LinkedInLoader />;
  }

  return (
    <div className="bg-color-main-background min-h-screen w-full flex justify-center px-2 sm:px-4 lg:px-6 pt-2 sm:pt-4 lg:pt-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-center w-full max-w-7xl">
        {/* Left Sidebar - Hidden on mobile, visible on desktop */}
        {MediaQueries.minWidth640px.matches ? (
          <aside className="w-full sm:w-64 lg:w-60 flex-shrink-0">
            <UserInformation objLoggedUser={objLoggedUser} />
          </aside>
        ) : null}
        
        {/* Main Feed - Full width on mobile, flex-grow on desktop */}
        <main className="w-full lg:flex-1 max-w-full lg:max-w-2xl mx-auto">
          <NewsFeed objLoggedUser={objLoggedUser} />
        </main>

        {/* Right Sidebar - Hidden on mobile and tablet, visible on large screens */}
        {MediaQueries.minWidth640px.matches ? (
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <Suspense fallback={<div className="bg-white rounded-lg p-4 shadow-sm h-32 animate-pulse" />}>
              <AdsContainer objLoggedUser={objLoggedUser} />
            </Suspense>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
