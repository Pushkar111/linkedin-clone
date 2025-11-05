import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { Post, Profile, User } from "../../../../models";
// New REST API services
import { postAPI, adaptPostsFromAPI } from "../../../../services";
// Legacy Firebase imports (kept for compatibility)
import { getNextBatch } from "../../../../services/servicePost";
import { getMainProfileAll } from "../../../../services/serviceProfile";
import { MediaQueries } from "../../../../utilities";
import { AddPost } from "./components/AddPost";
import ListFilter from "./components/ListFilter/ListFilter";
import { PostList } from "./components/PostsList";

/**
 *
 * @param {Object} props
 * @param {User} props.objLoggedUser
 * @returns {JSX.Element}
 */
export default function NewsFeed({ objLoggedUser }) {
  /**
   * @type {Array<{objPost:Post,objProfile: Profile}>}
   */
  const arrInitialValue = [];
  const [arrPostsProfile, setArrPostsProfile] = useState(arrInitialValue);

  /**
   * @type {Date}
   */
  // @ts-ignore
  const dtInitialValue = null;
  const [dtStartPoint, setDtStartPoint] = useState(dtInitialValue);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Try new REST API first
        const page = Math.floor(arrPostsProfile.length / 10) + 1;
        const response = await postAPI.getPosts(page, 10);
        
        if (response && response.posts && response.posts.length > 0) {
          // Adapt posts from API format to frontend format
          const arrPostsAdapted = adaptPostsFromAPI(response.posts);
          
          // Posts from API already include user profile info in objProfile
          const arrPostProfile = arrPostsAdapted.map((objPost) => ({
            objPost,
            objProfile: objPost.objProfile, // This is now properly populated by adapter
          }));

          // Filter out any posts without profiles (safety check)
          const validPosts = arrPostProfile.filter(item => item.objProfile !== null);

          if (validPosts.length > 0) {
            setArrPostsProfile((prevState) => {
              const newState = [...prevState, ...validPosts];
              return newState;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching posts from REST API, using fallback:", error);
        // Fallback to legacy Firebase method
        getNextBatch(objLoggedUser.strUserId, dtStartPoint).then(
          (arrPostsResponse) => {
            if (arrPostsResponse && arrPostsResponse.length > 0) {
              const arrUserOwnerIds = arrPostsResponse.map(
                (objPost) => objPost.strUserId
              );

              if (arrUserOwnerIds.length > 0) {
                getMainProfileAll(Array.from(new Set(arrUserOwnerIds))).then(
                  (arrProfilesResponse) => {
                    if (arrProfilesResponse && arrProfilesResponse.length > 0) {
                      const arrPostProfile = arrPostsResponse.map((objPost) => {
                        const arrProfiles = arrProfilesResponse.filter(
                          (objProfile) => objProfile.strUserId === objPost.strUserId
                        );

                        if (arrProfiles.length === 1) {
                          return { objPost, objProfile: arrProfiles[0] };
                        }

                        throw new Error(
                          "PostList.useEffect: Every Post must have a corresponding Profile object."
                        );
                      });

                      if (arrPostProfile.length > 0) {
                        setArrPostsProfile((prevState) => {
                          const newState = [...prevState, ...arrPostProfile];
                          return newState;
                        });
                      }
                    }
                  }
                );
              }
            }
          }
        );
      }
    };

    fetchPosts();
  }, [dtStartPoint]);

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight +
          Math.max(
            window.pageYOffset,
            document.documentElement.scrollTop,
            document.body.scrollTop
          ) >
        document.documentElement.offsetHeight - 10
      ) {
        if (arrPostsProfile.length > 0) {
          setDtStartPoint(
            arrPostsProfile[arrPostsProfile.length - 1].objPost.dtCreatedOn
          );
        }
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [arrPostsProfile]);

  /**
   *
   * @param {{objPost:Post,objProfile: Profile}} arrPostProfile
   */
  const addPostToFeed = (arrPostProfile) => {
    setArrPostsProfile((prevState) => {
      const newState = [...prevState];
      newState.unshift(arrPostProfile);
      return newState;
    });
  };

  return (
    <div className=" flex flex-col">
      {MediaQueries.minWidth640px.matches ? (
        <AddPost objLoggedUser={objLoggedUser} addPostToFeed={addPostToFeed} />
      ) : null}
      <div className="sm:w-[545px] flex flex-col">
        {MediaQueries.minWidth640px.matches ? <ListFilter /> : null}
        <PostList
          objLoggedUser={objLoggedUser}
          arrPostsProfile={arrPostsProfile}
        />
      </div>
    </div>
  );
}
