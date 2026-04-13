export interface ModelInfo {
  id: string;
  label: string;
  provider: string;
  description: string;
  contextWindow?: string;
  supportsReasoning?: boolean;
}

export interface ModelGroup {
  provider: string;
  models: ModelInfo[];
}

export const MODEL_GROUPS: ModelGroup[] = [
  {
    provider: 'Anthropic',
    models: [
      {
        id: 'claude-opus-4-20250514',
        label: 'Claude Opus 4',
        provider: 'Anthropic',
        description: 'Most capable, best for complex tasks',
        contextWindow: '200K',
        supportsReasoning: true,
      },
      {
        id: 'claude-sonnet-4-20250514',
        label: 'Claude Sonnet 4',
        provider: 'Anthropic',
        description: 'Balanced performance and speed',
        contextWindow: '200K',
        supportsReasoning: true,
      },
      {
        id: 'claude-haiku-3-5-20241022',
        label: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        description: 'Fast and efficient',
        contextWindow: '200K',
        supportsReasoning: false,
      },
    ],
  },
  {
    provider: 'OpenAI',
    models: [
      {
        id: 'gpt-4.1-2025-04-14',
        label: 'GPT-4.1',
        provider: 'OpenAI',
        description: 'Flagship model, strong at coding',
        contextWindow: '1M',
        supportsReasoning: false,
      },
      {
        id: 'gpt-4.1-mini-2025-04-14',
        label: 'GPT-4.1 Mini',
        provider: 'OpenAI',
        description: 'Fast, cost-effective',
        contextWindow: '1M',
        supportsReasoning: false,
      },
      {
        id: 'gpt-4.1-nano-2025-04-14',
        label: 'GPT-4.1 Nano',
        provider: 'OpenAI',
        description: 'Ultra-fast, lightweight tasks',
        contextWindow: '1M',
        supportsReasoning: false,
      },
      {
        id: 'o3-2025-04-16',
        label: 'o3',
        provider: 'OpenAI',
        description: 'Advanced reasoning model',
        contextWindow: '200K',
        supportsReasoning: true,
      },
      {
        id: 'o4-mini-2025-04-16',
        label: 'o4-mini',
        provider: 'OpenAI',
        description: 'Efficient reasoning model',
        contextWindow: '200K',
        supportsReasoning: true,
      },
    ],
  },
  {
    provider: 'Google',
    models: [
      {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        provider: 'Google',
        description: 'Most capable Google model',
        contextWindow: '1M',
        supportsReasoning: true,
      },
      {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        provider: 'Google',
        description: 'Fast with thinking capabilities',
        contextWindow: '1M',
        supportsReasoning: true,
      },
      {
        id: 'gemini-2.0-flash',
        label: 'Gemini 2.0 Flash',
        provider: 'Google',
        description: 'Optimized for speed',
        contextWindow: '1M',
        supportsReasoning: false,
      },
    ],
  },
  {
    provider: 'MiniMax',
    models: [
      {
        id: 'minimax-m1-80k',
        label: 'MiniMax M1',
        provider: 'MiniMax',
        description: 'Strong multilingual reasoning',
        contextWindow: '80K',
        supportsReasoning: true,
      },
    ],
  },
  {
    provider: 'DeepSeek',
    models: [
      {
        id: 'deepseek-r1',
        label: 'DeepSeek R1',
        provider: 'DeepSeek',
        description: 'Open-source reasoning model',
        contextWindow: '128K',
        supportsReasoning: true,
      },
      {
        id: 'deepseek-v3-0324',
        label: 'DeepSeek V3',
        provider: 'DeepSeek',
        description: 'General-purpose, cost-effective',
        contextWindow: '128K',
        supportsReasoning: false,
      },
    ],
  },
  {
    provider: 'Mistral',
    models: [
      {
        id: 'codestral-2501',
        label: 'Codestral',
        provider: 'Mistral',
        description: 'Specialized for code generation',
        contextWindow: '256K',
        supportsReasoning: false,
      },
    ],
  },
  {
    provider: 'xAI',
    models: [
      {
        id: 'grok-3',
        label: 'Grok 3',
        provider: 'xAI',
        description: 'Versatile large model',
        contextWindow: '128K',
        supportsReasoning: false,
      },
      {
        id: 'grok-3-mini',
        label: 'Grok 3 Mini',
        provider: 'xAI',
        description: 'Fast reasoning variant',
        contextWindow: '128K',
        supportsReasoning: true,
      },
    ],
  },
];

export const ALL_MODELS: ModelInfo[] = MODEL_GROUPS.flatMap(g => g.models);

export function findModel(id: string): ModelInfo | undefined {
  return ALL_MODELS.find(m => m.id === id);
}

export function getModelLabel(id: string): string {
  const model = findModel(id);
  return model ? model.label : id || 'Default';
}
