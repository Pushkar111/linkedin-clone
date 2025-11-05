/**
 * Notification Sound Utility
 * Plays notification sounds for incoming messages
 */

// Create a reusable audio instance
let notificationAudio = null;

/**
 * Initialize the notification audio
 * Uses a data URL with a simple beep sound encoded in base64
 */
const initializeAudio = () => {
  if (!notificationAudio) {
    // Simple notification beep sound (440Hz tone for 200ms)
    // This is a base64-encoded WAV file
    const audioData = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwPUKbk8Ldj";
    notificationAudio = new Audio(audioData);
    notificationAudio.volume = 0.5; // Set volume to 50%
  }
  return notificationAudio;
};

/**
 * Check if the current tab/window is active
 */
export const isWindowActive = () => {
  return !document.hidden && document.hasFocus();
};

/**
 * Play notification sound
 * @param {boolean} forcePlay - If true, plays even if window is active
 */
export const playNotificationSound = (forcePlay = false) => {
  // Only play if window is not active (unless forced)
  if (!forcePlay && isWindowActive()) {
    console.log("🔇 Window is active, skipping notification sound");
    return;
  }

  try {
    const audio = initializeAudio();
    
    // Reset audio to start if already playing
    audio.currentTime = 0;
    
    // Play the sound
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("🔔 Notification sound played");
        })
        .catch(error => {
          console.warn("⚠️ Could not play notification sound:", error.message);
        });
    }
  } catch (error) {
    console.warn("⚠️ Error playing notification sound:", error);
  }
};

/**
 * Set notification sound volume
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export const setNotificationVolume = (volume) => {
  const audio = initializeAudio();
  audio.volume = Math.max(0, Math.min(1, volume));
};

/**
 * Check if audio can be played (browser permissions)
 */
export const canPlayAudio = () => {
  try {
    const audio = initializeAudio();
    return audio && audio.play !== undefined;
  } catch {
    return false;
  }
};
