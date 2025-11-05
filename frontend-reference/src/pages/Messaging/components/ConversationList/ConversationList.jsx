/**
 * ConversationList Component
 * Displays list of conversations with search
 */

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import "./ConversationList.css";

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserId
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const otherUser = conv.otherParticipant;
    if (!otherUser) return false;
    
    return otherUser.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getLastMessageText = (conv) => {
    if (!conv.lastMessage) return "Start a conversation";
    
    const isOwn = conv.lastMessage.sender?._id === currentUserId || 
                  conv.lastMessage.sender === currentUserId;
    const prefix = isOwn ? "You: " : "";
    return prefix + (conv.lastMessage.content || "");
  };

  return (
    <div className="conversation-list">
      {/* Header */}
      <div className="conversation-list-header">
        <h2 className="text-xl font-semibold">Messaging</h2>
      </div>

      {/* Search */}
      <div className="conversation-search">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="conversation-search-input"
        />
      </div>

      {/* Conversation Items */}
      <div className="conversation-items">
        {filteredConversations.length === 0 ? (
          <div className="empty-state">
            <p className="text-gray-500 text-sm text-center py-8">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const otherUser = conv.otherParticipant;
            const isSelected = selectedConversation?._id === conv._id;
            const unreadCount = conv.unreadCountForUser || 0;

            return (
              <div
                key={conv._id}
                className={`conversation-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectConversation(conv)}
              >
                {/* Avatar */}
                <div className="conversation-avatar">
                  <img
                    src={otherUser?.profilePicURL || "/default-avatar.png"}
                    alt={otherUser?.fullName || "User"}
                    className="avatar-img"
                  />
                  {/* Online indicator - can be added later */}
                </div>

                {/* Content */}
                <div className="conversation-content">
                  <div className="conversation-header-row">
                    <span className="conversation-name">
                      {otherUser?.fullName || "Unknown User"}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="conversation-time">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), {
                          addSuffix: false
                        })}
                      </span>
                    )}
                  </div>
                  
                  <div className="conversation-message-row">
                    <p className="conversation-last-message">
                      {getLastMessageText(conv)}
                    </p>
                    {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
