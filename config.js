// The one place for provider settings. Any OpenAI-compatible provider works:
// switching = change endpoint + model here (and the key on the options page).
export const CONFIG = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  model: "openai/gpt-oss-120b", // fallback if this misbehaves: "llama-3.3-70b-versatile"
  // Low = less creative drift; rewriting should stay close to the user's words
  temperature: 0.3,
  apiKeyStorageName: "groqApiKey" // must match options.js
};
