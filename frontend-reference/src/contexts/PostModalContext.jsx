import { createContext, useContext, useState } from "react";

/**
 * Context for managing the Add Post modal state globally
 * This allows the mobile navbar to trigger the same modal as the desktop "Start a post" button
 */
// eslint-disable-next-line no-unused-vars
const PostModalContext = createContext({
  showPostModal: false,
  openPostModal: () => {},
  closePostModal: () => {},
});

/**
 * Hook to use the Post Modal context
 * @returns {Object} { showPostModal, openPostModal, closePostModal }
 */
export const usePostModal = () => {
  const context = useContext(PostModalContext);
  return context;
};

/**
 * Provider component for Post Modal state
 */
export const PostModalProvider = ({ children }) => {
  const [showPostModal, setShowPostModal] = useState(false);

  const openPostModal = () => {
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
  };

  const value = {
    showPostModal,
    openPostModal,
    closePostModal,
  };

  return (
    <PostModalContext.Provider value={value}>
      {children}
    </PostModalContext.Provider>
  );
};
