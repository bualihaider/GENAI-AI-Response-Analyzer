import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ExperimentData, ResponseData } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get all experiments with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [experiments, total] = await Promise.all([
      prisma.experiment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          results: {
            select: {
              id: true,
              content: true,
              temperature: true,
              topP: true,
              maxTokens: true,
              coherence: true,
              completeness: true,
              readability: true,
              relevance: true,
              overallScore: true,
              generatedAt: true,
              model: true,
              tokensUsed: true,
              generationTime: true
            }
          }
        }
      }),
      prisma.experiment.count()
    ]);

    const formattedExperiments: ExperimentData[] = experiments.map(exp => ({
      id: exp.id,
      name: exp.name || undefined,
      description: exp.description || undefined,
      prompt: exp.prompt,
      parameterRange: {
        temperature: { min: exp.temperatureMin || 0, max: exp.temperatureMax || 1, step: 0.1 },
        top_p: { min: exp.topPMin || 0, max: exp.topPMax || 1, step: 0.1 },
        max_tokens: { min: exp.maxTokensMin || 100, max: exp.maxTokensMax || 2000, step: 100 }
      },
      responses: exp.results.map(result => ({
        id: result.id,
        content: result.content,
        parameters: {
          temperature: result.temperature,
          top_p: result.topP,
          max_tokens: result.maxTokens,
          model: result.model
        },
        metrics: {
          coherence: result.coherence || 0,
          completeness: result.completeness || 0,
          readability: result.readability || 0,
          relevance: result.relevance || 0,
          overallScore: result.overallScore || 0
        },
        metricDetails: {},
        generatedAt: result.generatedAt.toISOString(),
        model: result.model,
        tokensUsed: result.tokensUsed || undefined,
        generationTime: result.generationTime || undefined
      })),
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
      totalRuns: exp.totalRuns
    }));

    return res.json({
      success: true,
      data: {
        experiments: formattedExperiments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get experiments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch experiments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get a specific experiment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            metricCalculations: true
          }
        }
      }
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const formattedExperiment: ExperimentData = {
      id: experiment.id,
      name: experiment.name || undefined,
      description: experiment.description || undefined,
      prompt: experiment.prompt,
      parameterRange: {
        temperature: { min: experiment.temperatureMin || 0, max: experiment.temperatureMax || 1, step: 0.1 },
        top_p: { min: experiment.topPMin || 0, max: experiment.topPMax || 1, step: 0.1 },
        max_tokens: { min: experiment.maxTokensMin || 100, max: experiment.maxTokensMax || 2000, step: 100 }
      },
      responses: experiment.results.map(result => {
        const metricDetails: Record<string, any> = {};
        
        // Parse metric calculation details
        result.metricCalculations.forEach(calc => {
          try {
            metricDetails[calc.metricType] = JSON.parse(calc.details || '{}');
          } catch (e) {
            metricDetails[calc.metricType] = { score: calc.score };
          }
        });

        return {
          id: result.id,
          content: result.content,
          parameters: {
            temperature: result.temperature,
            top_p: result.topP,
            max_tokens: result.maxTokens,
            model: result.model
          },
          metrics: {
            coherence: result.coherence || 0,
            completeness: result.completeness || 0,
            readability: result.readability || 0,
            relevance: result.relevance || 0,
            overallScore: result.overallScore || 0
          },
          metricDetails,
          generatedAt: result.generatedAt.toISOString(),
          model: result.model,
          tokensUsed: result.tokensUsed || undefined,
          generationTime: result.generationTime || undefined
        };
      }),
      createdAt: experiment.createdAt.toISOString(),
      updatedAt: experiment.updatedAt.toISOString(),
      totalRuns: experiment.totalRuns
    };

    return res.json({
      success: true,
      data: formattedExperiment
    });

  } catch (error) {
    console.error('Get experiment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch experiment'
    });
  }
});

/**
 * Delete an experiment
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const experiment = await prisma.experiment.findUnique({
      where: { id }
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    await prisma.experiment.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Experiment deleted successfully'
    });

  } catch (error) {
    console.error('Delete experiment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete experiment'
    });
  }
});

/**
 * Update experiment metadata
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const experiment = await prisma.experiment.findUnique({
      where: { id }
    });

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const updatedExperiment = await prisma.experiment.update({
      where: { id },
      data: {
        name: name || experiment.name,
        description: description || experiment.description
      }
    });

    return res.json({
      success: true,
      data: {
        id: updatedExperiment.id,
        name: updatedExperiment.name,
        description: updatedExperiment.description,
        updatedAt: updatedExperiment.updatedAt.toISOString()
      },
      message: 'Experiment updated successfully'
    });

  } catch (error) {
    console.error('Update experiment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update experiment'
    });
  }
});

export default router;
