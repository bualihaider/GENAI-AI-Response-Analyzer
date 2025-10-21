import express from 'express';
import { LLMService } from '../services/llmService';
import { QualityMetricsService } from '../services/qualityMetrics';
import { PrismaClient } from '@prisma/client';
import { GenerationRequest, GenerationResponse, ParameterRange, GenerationParameters } from '../types';

const router = express.Router();
const prisma = new PrismaClient();
const llmService = new LLMService();

/**
 * Generate responses with different parameter combinations
 */
router.post('/', async (req, res) => {
  const experimentId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`🧪 [${experimentId}] Starting new experiment`);
    const { prompt, parameterRange, numberOfRuns, experimentName, experimentDescription }: GenerationRequest = req.body;

    console.log(`📝 [${experimentId}] Experiment details:`, {
      name: experimentName || 'Unnamed',
      description: experimentDescription || 'No description',
      promptLength: prompt?.length || 0,
      numberOfRuns,
      parameterRange
    });

    if (!prompt || !parameterRange || !numberOfRuns) {
      console.log(`❌ [${experimentId}] Missing required fields`);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, parameterRange, numberOfRuns'
      });
    }

    if (numberOfRuns > 20) {
      console.log(`❌ [${experimentId}] Too many runs requested: ${numberOfRuns}`);
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 runs allowed per request'
      });
    }

    console.log(`⚙️  [${experimentId}] Generating ${numberOfRuns} parameter combinations`);
    const parameterCombinations = generateParameterCombinations(parameterRange, numberOfRuns);

    console.log(`💾 [${experimentId}] Creating experiment record in database`);
    const experiment = await prisma.experiment.create({
      data: {
        name: experimentName || `Experiment ${new Date().toISOString()}`,
        description: experimentDescription || null,
        prompt,
        temperatureMin: parameterRange.temperature.min,
        temperatureMax: parameterRange.temperature.max,
        topPMin: parameterRange.top_p.min,
        topPMax: parameterRange.top_p.max,
        maxTokensMin: parameterRange.max_tokens.min,
        maxTokensMax: parameterRange.max_tokens.max,
        totalRuns: numberOfRuns
      }
    });

    console.log(`🤖 [${experimentId}] Starting AI response generation`);
    const generationResults = await llmService.generateMultipleResponses(prompt, parameterCombinations);

    console.log(`📊 [${experimentId}] Processing ${generationResults.length} responses and calculating metrics`);
    const responses = [];
    let totalCoherence = 0;
    let totalCompleteness = 0;
    let totalReadability = 0;
    let totalRelevance = 0;

    for (let i = 0; i < generationResults.length; i++) {
      const result = generationResults[i];
      if (!result) {
        console.log(`⚠️  [${experimentId}] Skipping undefined result at index ${i}`);
        continue;
      }
      
      console.log(`🔍 [${experimentId}] Processing response ${i + 1}/${generationResults.length}`);
      
      const { metrics, details } = QualityMetricsService.calculateAllMetrics(result.content, prompt);
      
      const response = await prisma.response.create({
        data: {
          experimentId: experiment.id,
          temperature: result.parameters.temperature,
          topP: result.parameters.top_p,
          maxTokens: result.parameters.max_tokens,
          content: result.content,
          coherence: metrics.coherence,
          completeness: metrics.completeness,
          readability: metrics.readability,
          relevance: metrics.relevance,
          overallScore: metrics.overallScore,
          model: result.parameters.model || 'gemini-2.5-flash',
          tokensUsed: result.tokensUsed,
          generationTime: result.generationTime
        }
      });

      for (const [metricType, detail] of Object.entries(details)) {
        await prisma.metricCalculation.create({
          data: {
            responseId: response.id,
            metricType,
            score: detail.score || 0, // Handle NaN values
            details: JSON.stringify(detail)
          }
        });
      }

      responses.push({
        id: response.id,
        content: result.content,
        parameters: result.parameters,
        metrics,
        metricDetails: details,
        generatedAt: response.generatedAt.toISOString(),
        model: response.model,
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime
      });

      totalCoherence += metrics.coherence;
      totalCompleteness += metrics.completeness;
      totalReadability += metrics.readability;
      totalRelevance += metrics.relevance;
    }

    const responseCount = responses.length;
    const averageMetrics = {
      coherence: Math.round((totalCoherence / responseCount) * 100) / 100,
      completeness: Math.round((totalCompleteness / responseCount) * 100) / 100,
      readability: Math.round((totalReadability / responseCount) * 100) / 100,
      relevance: Math.round((totalRelevance / responseCount) * 100) / 100,
      overallScore: 0
    };
    averageMetrics.overallScore = QualityMetricsService.calculateOverallScore(averageMetrics);

    console.log(`📈 [${experimentId}] Average metrics calculated:`, averageMetrics);

    await prisma.experiment.update({
      where: { id: experiment.id },
      data: { totalRuns: responseCount }
    });

    const result: GenerationResponse = {
      experimentId: experiment.id,
      responses,
      totalRuns: responseCount,
      averageMetrics
    };

    console.log(`✅ [${experimentId}] Experiment completed successfully: ${responseCount} responses generated`);

    return res.json({
      success: true,
      data: result,
      message: `Generated ${responseCount} responses successfully`
    });

  } catch (error) {
    console.error(`❌ [${experimentId}] Generation error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate responses',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate parameter combinations based on ranges
 */
function generateParameterCombinations(range: ParameterRange, count: number): GenerationParameters[] {
  const combinations: GenerationParameters[] = [];
  
  for (let i = 0; i < count; i++) {
    const temperature = randomInRange(range.temperature.min, range.temperature.max);
    const topP = randomInRange(range.top_p.min, range.top_p.max);
    const maxTokens = Math.floor(randomInRange(range.max_tokens.min, range.max_tokens.max));
    
    combinations.push({
      temperature: Math.round(temperature * 100) / 100,
      top_p: Math.round(topP * 100) / 100,
      max_tokens: maxTokens,
      model: 'gemini-2.5-flash'
    });
  }
  
  return combinations;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export default router;
