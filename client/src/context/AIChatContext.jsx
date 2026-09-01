import { createContext, useContext, useState } from 'react';

const AIChatContext = createContext(null);

export const AIChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  // True while a full-screen mobile overlay (e.g. the Friends modal) is
  // open behind the widget — lets the launcher/bubble lift up so it
  // doesn't cover buttons near the bottom of that overlay.
  const [isObstructed, setIsObstructed] = useState(false);
  // True while the human-to-human chat panel is open — hides the AI
  // launcher/bubble entirely (not just repositions it), so the two chat
  // surfaces never show on screen at the same time.
  const [isSuppressed, setIsSuppressed] = useState(false);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);
  const raiseWidget = () => setIsObstructed(true);
  const lowerWidget = () => setIsObstructed(false);
  // Also close the AI chatbox if it happened to be open — no point hiding
  // the launcher but leaving an open chatbox floating on screen.
  const suppressWidget = () => { setIsSuppressed(true); setIsOpen(false); };
  const unsuppressWidget = () => setIsSuppressed(false);

  return (
    <AIChatContext.Provider
      value={{
        isOpen, openChat, closeChat, toggleChat,
        isObstructed, raiseWidget, lowerWidget,
        isSuppressed, suppressWidget, unsuppressWidget,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (!context) throw new Error('useAIChat must be used within AIChatProvider');
  return context;
};
