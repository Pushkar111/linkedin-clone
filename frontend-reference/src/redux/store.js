import { configureStore } from "@reduxjs/toolkit";
import logedUserReducer from "./states/logedUserSlice";
import postReducer from "./states/postSlice";

const store = configureStore({
  reducer: {
    loggedUser: logedUserReducer,
    posts: postReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: [
          "payload.dtCreatedOn",
          "payload.objProfile.dtCreatedOn",
          "payload.setProfile",
          "payload.posts",
          "payload.post.dtCreatedOn",
        ],
        ignoredPaths: [
          "loggedUser.value.dtCreatedOn",
          "loggedUser.value.objProfile.dtCreatedOn",
          "loggedUser.value.setProfile",
          "posts.posts",
          "posts.currentPost.dtCreatedOn",
        ],
      }, //false
    }),
});

/**
 * @typedef {ReturnType<typeof store.getState>} RootState
 */

export default store;
