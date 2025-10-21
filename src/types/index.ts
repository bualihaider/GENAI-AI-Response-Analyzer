
export interface GenerationParameters {
  temperature: number;
  top_p: number;
  max_tokens: number;
  model?: string;
}

export interface ParameterRange {
  temperature: { min: number; max: number; step: number };
  top_p: { min: number; max: number; step: number };
  max_tokens: { min: number; max: number; step: number };
}

export interface QualityMetrics {
  coherence: number;
  completeness: number;
  readability: number;
  relevance: number;
  overallScore: number;
}

export interface MetricDetails {
  score: number;
  explanation: string;
  calculation: string;
  factors: Record<string, number>;
}

export interface ResponseData {
  id: string;
  content: string;
  parameters: GenerationParameters;
  metrics: QualityMetrics;
  metricDetails: Record<string, MetricDetails>;
  generatedAt: string;
  model: string;
  tokensUsed?: number | undefined;
  generationTime?: number | undefined;
}

export interface ExperimentData {
  id: string;
  name?: string | undefined;
  description?: string | undefined;
  prompt: string;
  parameterRange: ParameterRange;
  responses: ResponseData[];
  createdAt: string;
  updatedAt: string;
  totalRuns: number;
}

export interface GenerationRequest {
  prompt: string;
  parameterRange: ParameterRange;
  numberOfRuns: number;
  experimentName?: string;
  experimentDescription?: string;
}

export interface GenerationResponse {
  experimentId: string;
  responses: ResponseData[];
  totalRuns: number;
  averageMetrics: QualityMetrics;
}

export interface ExportRequest {
  experimentId: string;
  format: 'json' | 'csv' | 'pdf';
  includeMetrics: boolean;
  includeDetails: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Frontend specific types
export interface UIState {
  currentExperiment: ExperimentData | null;
  isLoading: boolean;
  error: string | null;
  selectedResponses: string[];
}

export interface ChartData {
  name: string;
  coherence: number;
  completeness: number;
  readability: number;
  relevance: number;
  overallScore: number;
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
