/**
 * Curated short-list of OpenRouter models shown in the chat model picker.
 * The point isn't completeness — OpenRouter has hundreds of models — it's
 * to surface 8–10 options that cover the useful cost/quality/speed mix
 * without making the dropdown a 30-second scroll.
 *
 * Add or remove freely; the picker reads this directly.
 */
export type ModelOption = {
  slug: string;
  label: string;
  /** One-word hint shown next to the label, e.g. "fast", "deep", "cheap". */
  hint?: string;
};

export const MODEL_OPTIONS: ModelOption[] = [
  { slug: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5", hint: "default" },
  { slug: "anthropic/claude-opus-4.1", label: "Claude Opus 4.1", hint: "deep" },
  { slug: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", hint: "fast" },
  { slug: "openai/gpt-5", label: "GPT-5", hint: "rival flagship" },
  { slug: "openai/gpt-5-mini", label: "GPT-5 mini", hint: "cheap" },
  { slug: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "long ctx" },
  { slug: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "fast & cheap" },
  { slug: "deepseek/deepseek-chat-v3.1", label: "DeepSeek V3.1", hint: "cheap reasoner" },
  { slug: "x-ai/grok-4", label: "Grok 4", hint: "variety" },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].slug;
