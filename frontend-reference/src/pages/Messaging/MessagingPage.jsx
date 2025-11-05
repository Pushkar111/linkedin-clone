/**
 * Messaging Page
 * Main messaging interface with conversation list and chat window
 * Real-time messaging with Socket.io
 */

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getLoggedUserState } from "../../utilities/ReduxUtils";
import { messageAPI } from "../../services";
import { useSocket } from "../../contexts/SocketContext";
import ConversationList from "./components/ConversationList";
import ChatWindow from "./components/ChatWindow";
import "./MessagingPage.css";

export default function MessagingPage() {
  const { userId: recipientId } = useParams();
  const loggedUser = useSelector(getLoggedUserState);
  const { socket } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await messageAPI.getConversations();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // If recipientId is provided in URL, create/get conversation with that user
  useEffect(() => {
    const initConversationWithUser = async () => {
      if (recipientId && loggedUser) {
        try {
          const conversation = await messageAPI.getOrCreateConversation(recipientId);
          console.log("📩 Created/fetched conversation:", conversation);
          console.log("📩 Other participant:", conversation.otherParticipant);
          setSelectedConversation(conversation);
          setIsMobileChatOpen(true);
          
          // Add to conversations list if not already there
          setConversations(prev => {
            const exists = prev.some(c => c._id === conversation._id);
            if (!exists) {
              return [conversation, ...prev];
            }
            return prev;
          });
        } catch (error) {
          console.error("Failed to create conversation:", error);
        }
      }
    };

    initConversationWithUser();
  }, [recipientId, loggedUser]);

  // Socket.io real-time messaging
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on("new_message", ({ message, conversationId }) => {
      // Update conversation list with new message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId
            ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
            : conv
        )
      );
    });

    // Cleanup on unmount
    return () => {
      socket.off("new_message");
    };
  }, [socket]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setIsMobileChatOpen(true);
  };

  const handleBackToList = () => {
    setIsMobileChatOpen(false);
  };

  const handleNewMessage = (message) => {
    // Update last message in conversation list
    setConversations(prev => 
      prev.map(conv => 
        conv._id === message.conversation
          ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
          : conv
      )
    );
  };

  if (loading) {
    return (
      <div className="messaging-page">
        <div className="messaging-container">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messaging-page">
      <div className="messaging-container">
        {/* Conversation List - Hidden on mobile when chat is open */}
        <div className={`conversation-list-panel ${isMobileChatOpen ? "mobile-hidden" : ""}`}>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleConversationSelect}
            currentUserId={loggedUser?.strUserId}
          />
        </div>

        {/* Chat Window - Hidden on mobile when no conversation selected */}
        <div className={`chat-window-panel ${!isMobileChatOpen && !selectedConversation ? "mobile-hidden" : ""}`}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={loggedUser?.strUserId}
              onBack={handleBackToList}
              onNewMessage={handleNewMessage}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
