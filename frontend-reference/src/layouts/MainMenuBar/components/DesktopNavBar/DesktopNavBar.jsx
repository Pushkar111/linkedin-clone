import { Link } from "react-router-dom";
import { lazy, Suspense } from "react";
// eslint-disable-next-line no-unused-vars
import { User } from "../../../../models/User";
import { NavigationPaths, showNotAvailableToast } from "../../../../utilities";
import { SearchBox } from "../SearchBox/";
import { NavMenuOptions } from "../NavMenuOptions/NavMenuOptions";
import { FadeInAnimationDiv } from "../../../../components/FadeInAnimationDiv/FadeInAnimationDiv";
import NotificationBell from "../../../../components/NotificationBell";
const UserDisplay = lazy(() => import("./components/UserDisplay/UserDisplay"));

/**
 *
 * @param {Object} props
 * @param {User} props.objLoggedUser
 * @returns {JSX.Element}
 */
export function DesktopNavBar({ objLoggedUser }) {
  const handleNotAvailableClick = () => {
    showNotAvailableToast();
  };
  return (
    <nav className="hidden sm:flex justify-center w-full shadow-sm border-b bg-white">
      <FadeInAnimationDiv
        strDuration="duration-700"
        className="flex flex-row gap-1 sm:gap-2 justify-between items-center w-full max-w-7xl px-2 sm:px-4"
      >
        <Link to={"/" + NavigationPaths.FEED} className="text-color-blue flex-shrink-0">
          <svg
            className="w-9 h-9 sm:w-[41px] sm:h-[41px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24"
            height="24"
            focusable="false"
          >
            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
          </svg>
        </Link>
        
        <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-md">
          <SearchBox objLoggedUser={objLoggedUser} />
        </div>

        <div className="flex items-center gap-1">
          <NavMenuOptions objLoggedUser={objLoggedUser} />

          <NotificationBell />

          <Suspense>
            <UserDisplay objLoggedUser={objLoggedUser} />
          </Suspense>
          
          <button
            type="button"
            className="hidden lg:flex items-center flex-col gap-0 h-[52px] w-[80px] min-w-[80px] justify-center border-solid border-b-2 text-color-text-low-emphasis hover:text-black border-b-transparent"
            onClick={handleNotAvailableClick}
          >
            <span className="flex w-auto h-fit flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                data-supported-dps="24x24"
                fill="currentColor"
                width="24"
                height="24"
                focusable="false"
              >
                <path d="M3 3h4v4H3zm7 4h4V3h-4zm7-4v4h4V3zM3 14h4v-4H3zm7 0h4v-4h-4zm7 0h4v-4h-4zM3 21h4v-4H3zm7 0h4v-4h-4zm7 0h4v-4h-4z"></path>
              </svg>
            </span>
            <span className="flex items-center text-sm font-normal break-all leading-[18px]">
              {"Work"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                data-supported-dps="16x16"
                fill="currentColor"
                width="16"
                height="16"
                focusable="false"
              >
                <path d="M8 11L3 6h10z" fillRule="evenodd"></path>
              </svg>
            </span>
          </button>
        </div>
        
        <button
          onClick={handleNotAvailableClick}
          type="button"
          className="hidden xl:block text-[#915907] text-xs sm:text-[13px] leading-[18px] font-normal hover:text-[#5d3b09] underline whitespace-nowrap"
        >
          Try Premium for free
        </button>
      </FadeInAnimationDiv>
    </nav>
  );
}
