/**
 * HashtagText Component
 * Parses text and renders regular text with clickable hashtags
 */
import React from "react";
import Hashtag from "../Hashtag";
import { parseHashtags } from "../../utilities/hashtags";

/**
 * @param {Object} props
 * @param {string} props.text - Text containing hashtags
 * @param {Function} props.onHashtagClick - Handler for hashtag clicks
 * @param {string} props.className - Additional CSS classes
 */
export default function HashtagText({ text, onHashtagClick, className = "" }) {
  if (!text) {
    return null;
  }

  const segments = parseHashtags(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.isHashtag) {
          return (
            <Hashtag
              key={`hashtag-${index}-${segment.hashtag}`}
              hashtag={segment.hashtag}
              onClick={onHashtagClick}
            />
          );
        } else {
          return (
            <React.Fragment key={`text-${index}`}>
              {segment.text}
            </React.Fragment>
          );
        }
      })}
    </span>
  );
}
