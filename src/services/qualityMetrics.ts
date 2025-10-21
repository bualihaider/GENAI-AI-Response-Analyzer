import { QualityMetrics, MetricDetails, GenerationParameters } from '../types';

export class QualityMetricsService {
  
  /**
   * Calculate coherence metric based on unique word ratio
   * Higher ratio indicates more diverse vocabulary and better coherence
   */
  static calculateCoherence(content: string): MetricDetails {
    const words = content.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words);
    
    // Handle empty content
    if (words.length === 0) {
      return {
        score: 0,
        explanation: 'Coherence measures vocabulary diversity. No words found in content.',
        calculation: 'No words to analyze',
        factors: {
          uniqueWords: 0,
          totalWords: 0,
          uniqueRatio: 0
        }
      };
    }
    
    const uniqueRatio = uniqueWords.size / words.length;
    const score = Math.min(1, uniqueRatio * 1.2);
    
    return {
      score: Math.round(score * 100) / 100,
      explanation: `Coherence measures vocabulary diversity. Score based on unique word ratio (${uniqueWords.size}/${words.length} = ${uniqueRatio.toFixed(3)})`,
      calculation: `unique_words / total_words * 1.2, capped at 1.0`,
      factors: {
        uniqueWords: uniqueWords.size,
        totalWords: words.length,
        uniqueRatio: uniqueRatio
      }
    };
  }

  /**
   * Calculate completeness metric based on direct answer detection
   * Analyzes if the response directly addresses the prompt
   */
  static calculateCompleteness(content: string, prompt: string): MetricDetails {
    const promptWords = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const contentWords = content.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'explain', 'describe', 'tell'];
    const hasQuestion = questionWords.some(q => prompt.toLowerCase().includes(q));
    
    const answerIndicators = ['yes', 'no', 'because', 'therefore', 'however', 'specifically', 'for example'];
    const hasDirectAnswer = answerIndicators.some(a => content.toLowerCase().includes(a));
    
    const promptSet = new Set(promptWords);
    const contentSet = new Set(contentWords);
    const overlap = [...promptSet].filter(word => contentSet.has(word)).length;
    const overlapRatio = promptWords.length > 0 ? overlap / promptWords.length : 0;
    
    let score = Math.min(1, overlapRatio * 1.5);
    
    if (hasQuestion && hasDirectAnswer) {
      score = Math.min(1, score + 0.2);
    }
    
    if (contentWords.length < 10) {
      score *= 0.7;
    }
    
    return {
      score: Math.round(score * 100) / 100,
      explanation: `Completeness measures how well the response addresses the prompt. Based on keyword overlap and answer patterns.`,
      calculation: `keyword_overlap_ratio * 1.5 + direct_answer_bonus, capped at 1.0`,
      factors: {
        keywordOverlap: overlap,
        totalPromptWords: promptWords.length,
        overlapRatio: overlapRatio,
        hasQuestion: hasQuestion ? 1 : 0,
        hasDirectAnswer: hasDirectAnswer ? 1 : 0,
        responseLength: contentWords.length
      }
    };
  }

  /**
   * Calculate readability metric based on sentence structure and complexity
   * Considers average sentence length and sentence variety
   */
  static calculateReadability(content: string): MetricDetails {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      return {
        score: 0,
        explanation: 'No complete sentences found',
        calculation: 'No sentences to analyze',
        factors: { sentenceCount: 0, averageLength: 0 }
      };
    }
    
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const averageLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    
    const optimalLength = 17.5;
    const lengthScore = 1 - Math.abs(averageLength - optimalLength) / optimalLength;
    
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - averageLength, 2), 0) / sentenceLengths.length;
    const varietyScore = Math.min(1, variance / 50); // Normalize variance
    
    const score = (lengthScore * 0.7 + varietyScore * 0.3);
    
    return {
      score: Math.round(score * 100) / 100,
      explanation: `Readability measures sentence structure quality. Based on optimal sentence length (15-20 words) and variety.`,
      calculation: `(length_score * 0.7 + variety_score * 0.3)`,
      factors: {
        sentenceCount: sentences.length,
        averageLength: Math.round(averageLength * 100) / 100,
        lengthScore: Math.round(lengthScore * 100) / 100,
        varietyScore: Math.round(varietyScore * 100) / 100,
        variance: Math.round(variance * 100) / 100
      }
    };
  }

  /**
   * Calculate relevance metric based on semantic keyword overlap
   * Measures how relevant the response is to the original prompt
   */
  static calculateRelevance(content: string, prompt: string): MetricDetails {
    const promptWords = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const contentWords = content.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    const filteredPromptWords = promptWords.filter(word => !stopWords.has(word));
    const filteredContentWords = contentWords.filter(word => !stopWords.has(word));
    
    if (filteredPromptWords.length === 0) {
      return {
        score: 0.5,
        explanation: 'Prompt contains only stop words, using neutral relevance score',
        calculation: 'Neutral score for stop-word-only prompt',
        factors: { promptWords: promptWords.length, contentWords: contentWords.length }
      };
    }
    
    const promptSet = new Set(filteredPromptWords);
    const contentSet = new Set(filteredContentWords);
    const overlap = [...promptSet].filter(word => contentSet.has(word));
    
    const overlapRatio = overlap.length / filteredPromptWords.length;
    
    const topicConsistency = Math.min(1, overlapRatio * 1.3);
    
    let score = topicConsistency;
    if (overlapRatio < 0.1) {
      score *= 0.5; 
    }
    
    return {
      score: Math.round(score * 100) / 100,
      explanation: `Relevance measures how well the response stays on topic. Based on meaningful keyword overlap.`,
      calculation: `meaningful_keyword_overlap * 1.3, with off-topic penalty`,
      factors: {
        promptWords: filteredPromptWords.length,
        contentWords: filteredContentWords.length,
        overlap: overlap.length,
        overlapRatio: Math.round(overlapRatio * 100) / 100,
        topicConsistency: Math.round(topicConsistency * 100) / 100
      }
    };
  }

  /**
   * Calculate overall quality score as weighted average of all metrics
   */
  static calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      coherence: 0.25,
      completeness: 0.30,
      readability: 0.20,
      relevance: 0.25
    };
    
    const weightedSum = 
      metrics.coherence * weights.coherence +
      metrics.completeness * weights.completeness +
      metrics.readability * weights.readability +
      metrics.relevance * weights.relevance;
    
    return Math.round(weightedSum * 100) / 100;
  }

  /**
   * Calculate all quality metrics for a given response
   */
  static calculateAllMetrics(content: string, prompt: string): {
    metrics: QualityMetrics;
    details: Record<string, MetricDetails>;
  } {
    const coherence = this.calculateCoherence(content);
    const completeness = this.calculateCompleteness(content, prompt);
    const readability = this.calculateReadability(content);
    const relevance = this.calculateRelevance(content, prompt);
    
    const metrics: QualityMetrics = {
      coherence: coherence.score,
      completeness: completeness.score,
      readability: readability.score,
      relevance: relevance.score,
      overallScore: 0
    };
    
    metrics.overallScore = this.calculateOverallScore(metrics);
    
    const details = {
      coherence,
      completeness,
      readability,
      relevance
    };
    
    return { metrics, details };
  }
}
