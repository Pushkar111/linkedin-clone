import { useLayoutEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
// eslint-disable-next-line no-unused-vars
import { User } from "../../../../../../../../../../models";
import {
  // MediaTypes,
  showNotAvailableToast,
} from "../../../../../../../../../../utilities";
import TextContentImageButton from "./TextContentImageButton";
import { createTextPost, createPostWithImageBase64 } from "../../../../../../../../../../redux/thunks";

/**
 *
 * @param {Object} props
 * @param {User} props.objLoggedUser
 * @param {function(object):void} props.addPostToFeed
 * @param {function():void} props.handleClosePopUp
 * @returns {JSX.Element}
 */
export default function TextConent({
  objLoggedUser,
  addPostToFeed,
  handleClosePopUp,
}) {
  const dispatch = useDispatch();
  const [enabledPostButton, setEnabledPostButton] = useState(false);
  // const [contentType, setContentType] = useState(MediaTypes.NONE);
  const [selectedImage, setSelectedImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [isPosting, setIsPosting] = useState(false);

  /**
   * @type {HTMLInputElement}
   */
  const emtpyInput = null;
  const refDivText = useRef(emtpyInput);
  /**
   * @type {React.MutableRefObject<HTMLInputElement>}
   */
  const refFileInput = useRef(null);

  useLayoutEffect(() => {
    if (refDivText && refDivText.current) {
      refDivText.current.focus();
    }
  });

  const handleOnPostClick = async () => {
    if (!refDivText.current || !refDivText.current.innerText.trim()) {
      return;
    }

    setIsPosting(true);
    const text = refDivText.current.innerText;

    try {
      // Dispatch the appropriate thunk based on whether there's an image
      let createdPost;
      if (selectedImage) {
        createdPost = await dispatch(createPostWithImageBase64({ text, imageBase64: selectedImage })).unwrap();
      } else {
        createdPost = await dispatch(createTextPost(text)).unwrap();
      }

      // Add post to feed for immediate display
      addPostToFeed({ objPost: createdPost, objProfile: objLoggedUser.objProfile });
      handleClosePopUp();
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleOnChangeText = (e) => {
    setEnabledPostButton(e.target.textContent.length > 0);
  };

  const handleHashTagClick = () => {
    if (refDivText.current) {
      refDivText.current.textContent = refDivText.current.textContent + " #";
    }
  };

  const handleImageUploadClick = () => {
    if (refFileInput.current) {
      refFileInput.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only image files are allowed (JPEG, PNG, GIF, WebP)");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (result && typeof result === "string") {
          setSelectedImage(result);
          setImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage("");
    setImagePreview("");
    if (refFileInput.current) {
      refFileInput.current.value = "";
    }
  };

  return (
    <div className="flex flex-col">
      <div
        ref={refDivText}
        onInput={handleOnChangeText}
        contentEditable={true}
        className="min-h-[96px] h-fit mx-6 my-3 empty:before:content-['What_do_you_want_to_talk_about?'] empty:before:text-color-text cursor-text outline-none border-none overflow-auto text-color-text-darker text-[17px] leading-6"
      ></div>
      
      {/* Image Preview */}
      {imagePreview && (
        <div className="mx-6 mb-3 relative">
          <img 
            src={imagePreview} 
            alt="Upload preview" 
            className="w-full h-auto max-h-96 object-contain rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            title="Remove image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24"
              height="24"
            >
              <path d="M13.42 12L20 18.58 18.58 20 12 13.42 5.42 20 4 18.58 10.58 12 4 5.42 5.42 4 12 10.58 18.58 4 20 5.42z"></path>
            </svg>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleHashTagClick}
        className=" text-[17px] font-bold text-color-blue pt-[15px]  flex items-center justify-start pl-6 pb-[7px]"
      >
        Add hashtag
      </button>
      
      {/* Hidden file input */}
      <input
        ref={refFileInput}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
      <div className="flex py-3 pl-4 pr-6 items-center">
        <div className="flex mr-2">
          <TextContentImageButton
            strText="Add a photo"
            handleClick={handleImageUploadClick}
          />
          <TextContentImageButton
            strText="Add a video"
            handleClick={showNotAvailableToast}
          />
          <TextContentImageButton
            strText="Add a document"
            handleClick={showNotAvailableToast}
          />
          <TextContentImageButton
            strText="Share that you’re hiring"
            handleClick={showNotAvailableToast}
          />
          <TextContentImageButton
            strText="Celebrate an occasion"
            handleClick={showNotAvailableToast}
          />
          <TextContentImageButton
            strText="Create a poll"
            handleClick={showNotAvailableToast}
          />
          <TextContentImageButton
            strText="Add to your post"
            handleClick={showNotAvailableToast}
          />
        </div>
        <div className="border-solid border-l pl-2">
          <button
            type="button"
            onClick={showNotAvailableToast}
            className="flex items-center gap-1 px-3 py-[5px] rounded-[28px] w-fit h-fit hover:bg-black hover:bg-opacity-[0.04] text-color-text "
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                data-supported-dps="16x16"
                fill="currentColor"
                width="16"
                height="16"
                focusable="false"
              >
                <path d="M5 8h5v1H5zm11-.5v.08a6 6 0 01-2.75 5L8 16v-3H5.5A5.51 5.51 0 010 7.5 5.62 5.62 0 015.74 2h4.76A5.5 5.5 0 0116 7.5zm-2 0A3.5 3.5 0 0010.5 4H5.74A3.62 3.62 0 002 7.5 3.53 3.53 0 005.5 11H10v1.33l2.17-1.39A4 4 0 0014 7.58zM5 7h6V6H5z"></path>
              </svg>
            </span>
            <span className=" leading-5 text-[15px] font-bold">Anyone</span>
          </button>
        </div>
        <div className=" flex-1 flex justify-end">
          <button
            type="button"
            onClick={handleOnPostClick}
            disabled={!enabledPostButton}
            className={
              "flex justify-center items-center py-[6px] px-[16px] rounded-[28px] w-fit h-fit font-bold leading-5 text-[18px]" +
              " " +
              (enabledPostButton
                ? "border-color-button-blue bg-color-button-blue hover:bg-color-button-blue-darker text-white"
                : "bg-[#00000014] text-[#0000004d] border-[#0000004d] cursor-not-allowed")
            }
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
