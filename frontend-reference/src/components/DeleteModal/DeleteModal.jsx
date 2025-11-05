/**
 * DeleteModal Component
 * Custom modal for delete confirmation
 */
import React from "react";
import "./DeleteModal.css";

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close modal handler
 * @param {Function} props.onConfirm - Confirm delete handler
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message
 * @param {boolean} props.isDeleting - Whether deletion is in progress
 */
export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Post",
  message = "Are you sure you want to delete this post? This action cannot be undone.",
  isDeleting = false,
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div className="delete-modal-backdrop" onClick={handleBackdropClick}>
      <div className="delete-modal">
        <div className="delete-modal-header">
          <h2 className="delete-modal-title">{title}</h2>
          {!isDeleting && (
            <button
              className="delete-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M13.42 12l4.79-4.8a1 1 0 00-1.41-1.41L12 10.58 7.21 5.79a1 1 0 00-1.42 1.41L10.58 12l-4.79 4.79a1 1 0 000 1.42 1 1 0 001.41 0L12 13.41l4.8 4.8a1 1 0 001.41 0 1 1 0 000-1.42z"></path>
              </svg>
            </button>
          )}
        </div>

        <div className="delete-modal-body">
          <div className="delete-modal-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="48"
              height="48"
            >
              <path d="M21 6h-5V4.33A2.42 2.42 0 0013.5 2h-3A2.42 2.42 0 008 4.33V6H3v2h1.5l.9 12.58A3 3 0 008.38 23h7.24a3 3 0 003-2.42L19.5 8H21zM10 4.33c0-.16.21-.33.5-.33h3c.29 0 .5.17.5.33V6h-4zM17.49 20.38a1 1 0 01-1 .81H8.38a1 1 0 01-.98-.8L6.52 8h11z"></path>
            </svg>
          </div>
          <p className="delete-modal-message">{message}</p>
        </div>

        <div className="delete-modal-footer">
          <button
            className="delete-modal-btn delete-modal-btn-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="delete-modal-btn delete-modal-btn-delete"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="delete-modal-spinner"></span>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
