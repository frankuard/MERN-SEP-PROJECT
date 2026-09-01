import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import aiChatApi from '../../api/aiChatApi';
import { useAIChat } from '../../context/AIChatContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { themes } from '../../data/themes';
import DashboardMascot from '../student/Dashboard/DashboardMascot';
import DashboardMascotFace from '../student/Dashboard/DashboardMascotFace';

// ── Typing dots ──────────────────────────────────────────
const TypingDots = ({ color }) => (
  <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: color, display: 'inline-block',
          animation: 'chTyping 1.1s ease-in-out infinite',
          animationDelay: `${i * 0.18}s`,
        }}
      />
    ))}
  </span>
);

// ── Message bubble ───────────────────────────────────────
const Bubble = ({ msg, t, showAvatar }) => {
  const isUser = msg.role === 'user';
  const isBot = msg.role === 'assistant' || msg.role === 'loading';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px', marginBottom: '8px' }}>
      {isBot && showAvatar && (
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#fcd9b6' }}>
          <DashboardMascotFace className="h-full w-full" />
        </div>
      )}
      <div
        style={{
          maxWidth: '80%',
          padding: '8px 12px',
          borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          background: isUser ? t.sidebarActiveBg : t.cardBg,
          color: isUser ? t.sidebarActiveText : t.textPrimary,
          border: isUser ? 'none' : `1px solid ${t.border}`,
          fontSize: '13px',
          lineHeight: '1.5',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          fontFamily: '"Nunito", sans-serif',
        }}
      >
        {msg.role === 'loading' ? <TypingDots color={t.textMuted} /> : msg.content}
      </div>
    </div>
  );
};

// ── Main widget ──────────────────────────────────────────
const AIChatWidget = () => {
  // ALL hooks must be called first — before any conditional return
  const { isAuthenticated } = useAuth();
  const { isOpen, toggleChat, closeChat } = useAIChat();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: "Hello! How may I assist you today?\nI'm Chautari AI — ask me anything about campus: timetable, attendance, canteen prices, events, and more." },
  ]);

  // Full mascot body+face only shows before the student has sent their
  // first message — once a real conversation is underway, we switch to
  // the small "chat head" avatar next to each assistant bubble instead.
  const hasUserMessaged = messages.some((m) => m.role === 'user');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // 'hidden' | 'visible' | 'fading' — drives the fade-out transition below
  const [greetingBubbleState, setGreetingBubbleState] = useState('hidden');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-popup speech bubble beside the launcher: appears once shortly
  // after page load, stays for 3 seconds, then fades out over 400ms.
  useEffect(() => {
    const showTimer = setTimeout(() => setGreetingBubbleState('visible'), 1500);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (greetingBubbleState !== 'visible') return;
    const fadeTimer = setTimeout(() => setGreetingBubbleState('fading'), 3000);
    return () => clearTimeout(fadeTimer);
  }, [greetingBubbleState]);

  useEffect(() => {
    if (greetingBubbleState !== 'fading') return;
    const hideTimer = setTimeout(() => setGreetingBubbleState('hidden'), 400);
    return () => clearTimeout(hideTimer);
  }, [greetingBubbleState]);

  useEffect(() => {
    if (isOpen) setGreetingBubbleState('hidden');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const buildHistory = useCallback((msgs) =>
    msgs
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-8)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', parts: m.content })),
    []
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [
      ...prev,
      { id: `u${Date.now()}`, role: 'user', content: text },
      { id: 'loading', role: 'loading', content: '' },
    ]);
    setLoading(true);
    try {
      const { reply } = await aiChatApi.sendAIMessage(text, buildHistory(messages));
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: `a${Date.now()}`, role: 'assistant', content: reply },
      ]);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not reach server. Please try again.';
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: `e${Date.now()}`, role: 'assistant', content: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, buildHistory]);

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById('ch-ai-style')) return;
    const s = document.createElement('style');
    s.id = 'ch-ai-style';
    s.textContent = `
      @keyframes chTyping { 0%,80%,100%{opacity:.2;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
      @keyframes chSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    `;
    document.head.appendChild(s);
  }, []);

  // ── Auth guard: hide on login / signup / public pages ──
  // Placed AFTER all hooks to satisfy React's rules of hooks
  if (!isAuthenticated) return null;

  const isDark = theme === 'dark';

  return (
    <>
      {/* Auto-popup greeting bubble: visible for 3s, then fades out */}
      {greetingBubbleState !== 'hidden' && !isOpen && (
        <div
          style={{
            position: 'fixed', bottom: '32px', right: '86px', zIndex: 9999,
            maxWidth: '210px',
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: '14px 14px 3px 14px',
            padding: '10px 14px',
            boxShadow: t.shadowCard,
            fontFamily: '"Nunito", sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            color: t.textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: greetingBubbleState === 'fading' ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <span>Hello! How can I assist you today?</span>
          <button
            type="button"
            onClick={() => setGreetingBubbleState('hidden')}
            aria-label="Dismiss"
            style={{
              flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer',
              color: t.textMuted, padding: 0, display: 'flex', alignItems: 'center',
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={toggleChat}
        aria-label="Chauttari AI"
        title="Chauttari AI"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '52px', height: '52px', borderRadius: '50%',
          border: `1.5px solid ${t.border}`,
          background: t.sidebarActiveBg,
          color: t.sidebarActiveText,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: t.shadowCard,
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1.07)'}
      >
        {isOpen ? (
          <X size={20} />
        ) : (
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', background: '#fcd9b6' }}>
            <DashboardMascotFace className="h-full w-full" />
          </div>
        )}
      </button>

      {/* Chatbox */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chauttari AI"
          style={{
            position: 'fixed', bottom: '88px', right: '24px', zIndex: 9998,
            width: 'min(340px, 92vw)', height: 'min(460px, 72vh)',
            display: 'flex', flexDirection: 'column',
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: '16px', boxShadow: t.shadowCard,
            overflow: 'hidden',
            animation: 'chSlideUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderBottom: `1px solid ${t.border}`,
            background: t.sidebarActiveBg, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', background: '#fcd9b6', flexShrink: 0 }}>
                <DashboardMascotFace className="h-full w-full" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: t.sidebarActiveText, fontFamily: '"Nunito", sans-serif', lineHeight: 1.2 }}>
                  Chauttari AI
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: t.sidebarActiveText, opacity: 0.65, fontFamily: '"Nunito", sans-serif' }}>
                  Campus Assistant
                </p>
              </div>
            </div>
            <button
              type="button" onClick={closeChat} aria-label="Close"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.sidebarActiveText, opacity: 0.7, padding: '3px', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 10px 6px',
            display: 'flex', flexDirection: 'column',
            scrollbarWidth: 'none',
            background: isDark ? t.pageBg : '#f9f9f9',
          }}>
            {!hasUserMessaged && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 6px 14px', textAlign: 'center' }}>
                <DashboardMascot className="h-24 w-auto" />
              </div>
            )}
            {messages.map(msg => (
              <Bubble key={msg.id} msg={msg} t={t} showAvatar={hasUserMessaged} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '7px',
            padding: '9px 10px 10px', borderTop: `1px solid ${t.border}`,
            background: t.cardBg, flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything about campus…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, resize: 'none',
                border: `1px solid ${t.border}`, borderRadius: '10px',
                padding: '7px 11px', fontSize: '13px',
                fontFamily: '"Nunito", sans-serif',
                background: isDark ? t.pageBg : '#fff',
                color: t.textPrimary, outline: 'none',
                maxHeight: '80px', overflowY: 'auto',
                lineHeight: '1.4', scrollbarWidth: 'none',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={e => e.currentTarget.style.borderColor = t.sidebarActiveBg}
              onBlur={e => e.currentTarget.style.borderColor = t.border}
            />
            <button
              type="button" onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send"
              style={{
                flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%',
                border: 'none', cursor: !input.trim() || loading ? 'default' : 'pointer',
                background: !input.trim() || loading ? t.border : t.sidebarActiveBg,
                color: !input.trim() || loading ? t.textMuted : t.sidebarActiveText,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, transform 0.12s',
              }}
              onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
