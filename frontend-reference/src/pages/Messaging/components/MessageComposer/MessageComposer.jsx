/**
 * MessageComposer Component
 * Text input with send button and typing indicators
 */

import React, { useState, useRef, useEffect } from "react";
import { useSocket } from "../../../../contexts/SocketContext";
import "./MessageComposer.css";

export default function MessageComposer({ onSend, disabled = false, conversationId }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { startTyping, stopTyping } = useSocket();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (conversationId) stopTyping(conversationId);
      }
    };
  }, [conversationId, stopTyping]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Emit typing:start on first character
    if (newValue.length > 0 && message.length === 0 && conversationId) {
      startTyping(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing:stop after 1.5s of inactivity
    if (newValue.length > 0 && conversationId) {
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(conversationId);
      }, 1500);
    } else if (newValue.length === 0 && conversationId) {
      // Immediately stop typing if input cleared
      stopTyping(conversationId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || disabled) return;

    // Stop typing before sending
    if (conversationId) stopTyping(conversationId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    onSend(message);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className="message-composer">
      <form onSubmit={handleSubmit} className="composer-form">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          className="composer-input"
          disabled={disabled}
          rows={1}
          maxLength={5000}
        />
        
        <button
          type="submit"
          className={`composer-send-button ${canSend ? "active" : ""}`}
          disabled={!canSend}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3.993A1 1 0 012.992 3h14.016A.993.993 0 0118 3.993c0 .246-.082.484-.287.755l-7.713 10.502a1.125 1.125 0 01-1.8 0L.487 4.748A.991.991 0 012 3.993z" transform="rotate(-45 10 10)" />
          </svg>
        </button>
      </form>
      
      {message.length > 4500 && (
        <div className="character-count">
          {message.length} / 5000
        </div>
      )}
    </div>
  );
}
