import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, X, Mic, Square } from 'lucide-react';
import aiChatApi from '../../api/aiChatApi';
import { useAIChat } from '../../context/AIChatContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { themes } from '../../data/themes';
import DashboardMascot from '../student/Dashboard/DashboardMascot';
import DashboardMascotFace from '../student/Dashboard/DashboardMascotFace';

// ── "What can you do" detector — matched client-side, never
// hits the API, so this reply costs zero tokens ────────────
const HELP_PATTERNS = [
  'what can you do', 'what are your features', 'what do you do',
  'how can you help', 'what can you help with', 'features', 'help',
];
const isHelpIntent = (text) => {
  const t = text.trim().toLowerCase();
  return HELP_PATTERNS.some((p) => t === p || t.includes(p));
};
const HELP_SUGGESTIONS = [
  'Show my attendance',
  "What's today's canteen menu?",
  'I lost my wallet',
  'Any upcoming events?',
];

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

// ── Parse [TABLE]...[/TABLE] blocks out of an assistant reply ──────
// Returns an ordered list of { type: 'text', value } / { type: 'table', rows }
// segments so plain sentences and tables can be interleaved in one reply.
const parseMessageContent = (content) => {
  const segments = [];
  const regex = /\[TABLE\]([\s\S]*?)\[\/TABLE\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: 'text', value: text });
    }
    const rows = match[1]
      .trim()
      .split('\n')
      .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean))
      .filter((row) => row.length > 0);
    if (rows.length > 0) segments.push({ type: 'table', rows });
    lastIndex = regex.lastIndex;
  }
  const rest = content.slice(lastIndex).trim();
  if (rest) segments.push({ type: 'text', value: rest });
  return segments.length > 0 ? segments : [{ type: 'text', value: content }];
};

// ── Compact table renderer for assistant replies ────────────────────
const ReplyTable = ({ rows, t }) => {
  const [header, ...body] = rows;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0', fontSize: '12.5px' }}>
      <thead>
        <tr>
          {header.map((cell, i) => (
            <th
              key={i}
              style={{
                textAlign: 'left', padding: '5px 8px',
                borderBottom: `1.5px solid ${t.border}`,
                fontWeight: 800, color: t.textPrimary,
              }}
            >
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  padding: '5px 8px',
                  borderBottom: ri < body.length - 1 ? `1px solid ${t.border}` : 'none',
                  color: ci === 0 ? t.textMuted : t.textPrimary,
                  fontWeight: ci === 0 ? 600 : 700,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ── Action card (confirmations + claim match choices) ───────────────
const CardBlock = ({ card, t, onChoice, onConfirm, onCancel, busy }) => {
  const btnBase = {
    width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '10px',
    border: `1px solid ${t.border}`, background: 'transparent',
    color: t.sidebarActiveBg, fontSize: '12.5px', fontWeight: 700,
    cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
    fontFamily: '"Nunito", sans-serif',
  };

  // Claim flow — pick one of the matches
  if (card.choices) {
    return (
      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: t.textPrimary }}>{card.title}</p>
        {card.choices.map((ch) => (
          <button key={ch.index} type="button" style={btnBase} disabled={busy} onClick={() => onChoice(ch.index)}>
            {ch.index + 1}. {ch.label}
          </button>
        ))}
        <button type="button" style={{ ...btnBase, color: t.textMuted }} disabled={busy} onClick={onCancel}>
          ✕ Cancel request
        </button>
      </div>
    );
  }

  if (card.rows) {
    return (
      <div style={{
        marginTop: '8px', border: `1px solid ${t.border}`, borderRadius: '12px',
        overflow: 'hidden', background: t.pageBg,
      }}>
        <div style={{
          padding: '7px 10px', fontSize: '12px', fontWeight: 800,
          background: t.sidebarActiveBg, color: t.sidebarActiveText,
        }}>
          {card.title}
        </div>
        <div style={{ padding: '6px 10px' }}>
          {card.rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '3px 0' }}>
              <span style={{ fontSize: '11.5px', color: t.textMuted, fontWeight: 600, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: '11.5px', color: t.textPrimary, fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{row.value}</span>
            </div>
          ))}
        </div>
        {card.confirm ? (
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px', borderTop: `1px solid ${t.border}` }}>
            <button
              type="button" disabled={busy}
              onClick={onConfirm}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: '10px', border: 'none',
                background: t.sidebarActiveBg, color: t.sidebarActiveText,
                fontSize: '12.5px', fontWeight: 800, cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1, fontFamily: '"Nunito", sans-serif',
              }}
            >
              Confirm & Submit
            </button>
            <button
              type="button" disabled={busy}
              onClick={onCancel}
              style={{
                padding: '8px 12px', borderRadius: '10px',
                border: `1px solid ${t.border}`, background: 'transparent',
                color: t.textMuted, fontSize: '12.5px', fontWeight: 700,
                cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
                fontFamily: '"Nunito", sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ padding: '6px 10px 8px', fontSize: '11px', color: t.textMuted, fontWeight: 600 }}>
            Review these details — you can correct any of them in the chat.
          </div>
        )}
      </div>
    );
  }

  return null;
};

// ── Message bubble ───────────────────────────────────────
const Bubble = ({ msg, t, showAvatar, onSuggestionClick, onChoice, onConfirm, onCancel, busy }) => {
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
        {msg.role === 'loading' ? (
          <TypingDots color={t.textMuted} />
        ) : isBot ? (
          <>
            {parseMessageContent(msg.content).map((seg, i) =>
              seg.type === 'table' ? (
                <ReplyTable key={i} rows={seg.rows} t={t} />
              ) : (
                <div key={i} style={{ marginBottom: '2px' }}>{seg.value}</div>
              )
            )}
            {msg.card && (
              <CardBlock
                card={msg.card}
                t={t}
                onChoice={onChoice}
                onConfirm={onConfirm}
                onCancel={onCancel}
                busy={busy}
              />
            )}
          </>
        ) : (
          msg.content
        )}
        {msg.suggestions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggestionClick(s)}
                style={{
                  textAlign: 'left', padding: '7px 10px', borderRadius: '10px',
                  border: `1px solid ${t.border}`, background: 'transparent',
                  color: t.sidebarActiveBg, fontSize: '12.5px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: '"Nunito", sans-serif',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main widget ──────────────────────────────────────────
const AIChatWidget = () => {
  // ALL hooks must be called first — before any conditional return
  const { isAuthenticated } = useAuth();
  const { isOpen, toggleChat, closeChat, isObstructed, isSuppressed } = useAIChat();
  const { theme } = useTheme();
  const t = themes[theme] || themes.light;

  const GREETINGS = ['Hello', 'Hola', 'Namaste', 'Ni Hao', 'Bonjour', 'Ciao', 'Konnichiwa',];
  const [messages, setMessages] = useState(() => {
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `${greeting}! How may I assist you today?\nMy name is Chauttari AI — I can check your attendance, canteen prices, timetable, events, and I can also submit requests for you (Lost & Found, CCTV footage, attendance reports, campus help). Just ask, or tap Voice to speak.`,
      },
    ];
  });

  // Full mascot body+face only shows before the student has sent their
  // first message — once a real conversation is underway, we switch to
  // the small "chat head" avatar next to each assistant bubble instead.
  const hasUserMessaged = messages.some((m) => m.role === 'user');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false); // card / voice / image actions in flight
  const [recording, setRecording] = useState(false);
  // 'hidden' | 'visible' | 'fading' — drives the fade-out transition below
  const [greetingBubbleState, setGreetingBubbleState] = useState('hidden');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

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

  // Helper: run an action API call, showing typing dots until it resolves.
  const runAction = useCallback(async (fn) => {
    setMessages(prev => [...prev, { id: 'loading', role: 'loading', content: '' }]);
    setBusy(true);
    try {
      const data = await fn();
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: `a${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role: 'assistant', content: data.reply || '', card: data.card || null },
      ]);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: `e${Date.now()}`, role: 'assistant', content: `⚠️ ${msg}` },
      ]);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleConfirm = useCallback(() => runAction(() => aiChatApi.confirmAction()), [runAction]);
  const handleCancel = useCallback(() => runAction(() => aiChatApi.cancelAction()), [runAction]);
  const handleChoice = useCallback((index) => runAction(() => aiChatApi.chooseMatch(index)), [runAction]);

  const send = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading || busy) return;
    setInput('');

    if (isHelpIntent(text)) {
      setMessages(prev => [
        ...prev,
        { id: `u${Date.now()}`, role: 'user', content: text },
        {
          id: `a${Date.now()}`,
          role: 'assistant',
          content: "Here's what I can help with — tap one to try it, or ask me anything else about campus:",
          suggestions: HELP_SUGGESTIONS,
        },
      ]);
      return;
    }

    setMessages(prev => [
      ...prev,
      { id: `u${Date.now()}`, role: 'user', content: text },
      { id: 'loading', role: 'loading', content: '' },
    ]);
    setLoading(true);
    try {
      const data = await aiChatApi.sendAIMessage(text, buildHistory(messages));
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: `a${Date.now()}`, role: 'assistant', content: data.reply || '', card: data.card || null },
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
  }, [input, loading, busy, messages, buildHistory]);

  // ── Voice → text (MediaRecorder → Groq whisper → editable text) ──
  const handleTranscribe = useCallback(async (blob, type, ext) => {
    setMessages(prev => [...prev, { id: 'loading', role: 'loading', content: '' }]);
    setBusy(true);
    try {
      const { text } = await aiChatApi.transcribeAudio(blob, `voice-${Date.now()}.${ext}`, type);
      const cleaned = String(text || '').trim();
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        {
          id: `a${Date.now()}`,
          role: 'assistant',
          content: cleaned
            ? "Got it. Here's what I heard — feel free to edit it below, then press send."
            : "I couldn't hear anything clearly. Could you try speaking a bit closer?",
        },
      ]);
      if (cleaned) {
        setInput(cleaned);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Voice transcription failed. Please try again.';
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: `e${Date.now()}`, role: 'assistant', content: `⚠️ ${msg}` },
      ]);
    } finally {
      setBusy(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (recording || loading || busy) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessages(prev => [...prev, {
        id: `e${Date.now()}`,
        role: 'assistant',
        content: "⚠️ Voice recording isn't supported in this browser. You can still type your message.",
      }]);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        const type = recorder.mimeType || 'audio/webm';
        const ext = type.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) handleTranscribe(blob, type, ext);
      };
      recorder.onerror = () => setRecording(false);

      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
      setRecording(true);
    } catch {
      setMessages(prev => [...prev, {
        id: `e${Date.now()}`,
        role: 'assistant',
        content: "⚠️ Microphone permission was denied. You can type your message instead.",
      }]);
    }
  }, [recording, loading, busy, handleTranscribe]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { setRecording(false); }
    }
  }, []);

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
  // Hide entirely while the human-to-human chat panel is open.
  if (isSuppressed) return null;

  const isDark = theme === 'dark';
  // Lift the launcher/chatbox up on small screens when a full-screen
  // overlay (e.g. the Friends modal) is covering the bottom of the page,
  // so this floating bubble doesn't sit on top of its buttons. Desktop
  // layouts have room either way, so only shift on mobile widths.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const lift = isObstructed && isMobile;
  const launcherBottom = lift ? '160px' : '24px';
  const chatboxBottom = lift ? '225px' : '88px';

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
          position: 'fixed', bottom: launcherBottom, right: '24px', zIndex: 9999,
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
            position: 'fixed', bottom: chatboxBottom, right: '24px', zIndex: 9998,
            width: 'min(340px, 92vw)', height: 'min(460px, 72vh)',
            transition: 'bottom 0.2s ease',
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
              <Bubble
                key={msg.id}
                msg={msg}
                t={t}
                showAvatar={hasUserMessaged}
                onSuggestionClick={send}
                onChoice={handleChoice}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                busy={busy}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Recording indicator */}
          {recording && (
            <div style={{
              padding: '6px 12px', fontSize: '11px', fontWeight: 700,
              color: '#fff', background: '#c94f4f', fontFamily: '"Nunito", sans-serif',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'chTyping 1s infinite' }} />
              Listening… tap stop to send
            </div>
          )}

          {/* Input */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '7px',
            padding: '9px 10px 10px', borderTop: `1px solid ${t.border}`,
            background: t.cardBg, flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={loading || busy}
              aria-label={recording ? 'Stop recording' : 'Record voice'}
              title={recording ? 'Stop recording' : 'Record voice'}
              style={{
                flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%',
                border: 'none', cursor: loading || busy ? 'default' : 'pointer',
                background: recording ? '#c94f4f' : t.border,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: loading || busy ? 0.5 : 1,
                transition: 'transform 0.12s',
              }}
            >
              {recording ? <Square size={13} /> : <Mic size={15} />}
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything about campus…"
              rows={1}
              disabled={loading || busy}
              style={{
                flex: 1, resize: 'none',
                border: `1px solid ${t.border}`, borderRadius: '10px',
                padding: '7px 11px', fontSize: '13px',
                fontFamily: '"Nunito", sans-serif',
                background: isDark ? t.pageBg : '#fff',
                color: t.textPrimary, outline: 'none',
                maxHeight: '80px', overflowY: 'auto',
                lineHeight: '1.4', scrollbarWidth: 'none',
                opacity: loading || busy ? 0.6 : 1,
              }}
              onFocus={e => e.currentTarget.style.borderColor = t.sidebarActiveBg}
              onBlur={e => e.currentTarget.style.borderColor = t.border}
            />
            <button
              type="button" onClick={() => send()}
              disabled={!input.trim() || loading || busy}
              aria-label="Send"
              style={{
                flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%',
                border: 'none', cursor: !input.trim() || loading || busy ? 'default' : 'pointer',
                background: !input.trim() || loading || busy ? t.border : t.sidebarActiveBg,
                color: !input.trim() || loading || busy ? t.textMuted : t.sidebarActiveText,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, transform 0.12s',
              }}
              onMouseEnter={e => { if (input.trim() && !loading && !busy) e.currentTarget.style.transform = 'scale(1.08)'; }}
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