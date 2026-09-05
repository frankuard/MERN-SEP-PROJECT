const Groq = require('groq-sdk');

let client = null;

const getGroq = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    const err = new Error('GROQ_API_KEY is not configured');
    err.status = 503;
    throw err;
  }
  if (!client) client = new Groq({ apiKey });
  return client;
};

const CHAT_MODEL = 'qwen/qwen3.8-27b';
const CHAT_FALLBACK_MODEL = 'allam-2-7b';

// Robustly pull the first JSON object out of a model reply. Models sometimes
// wrap JSON in code fences or add stray text; this keeps parsing reliable.
const extractJson = (text) => {
  const s = String(text || '').trim();
  const fenced = s.match(/\{[\s\S]*\}/);
  const candidate = fenced ? fenced[0] : s;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

// Ask Groq for a structured JSON answer with graceful retry on 429/503.
const groqJson = async (messages, { maxTokens = 400, model = CHAT_MODEL } = {}) => {
  const client = getGroq();
  const attempt = async (m, useJsonMode) => {
    const opts = { model: m, messages, max_tokens: maxTokens, temperature: 0.2 };
    if (useJsonMode) opts.response_format = { type: 'json_object' };
    const res = await client.chat.completions.create(opts);
    return extractJson(res.choices?.[0]?.message?.content || '');
  };

  try {
    const parsed = await attempt(model, true);
    if (parsed) return parsed;
  } catch (primaryErr) {
    if (primaryErr?.status !== 429 && primaryErr?.status !== 503) {
      throw primaryErr;
    }
  }

  const fallback = await attempt(CHAT_FALLBACK_MODEL, false);
  return fallback;
};

module.exports = { getGroq, groqJson, extractJson, CHAT_MODEL, CHAT_FALLBACK_MODEL };