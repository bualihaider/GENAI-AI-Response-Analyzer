import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ExportRequest } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Export experiment data in various formats
 */
router.post('/', async (req, res) => {
  try {
    const { experimentId, format, includeMetrics, includeDetails }: ExportRequest = req.body;

    if (!experimentId || !format) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: experimentId, format'
      });
    }

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        results: {
          include: {
            metricCalculations: includeDetails
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

    let exportData: any;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        exportData = formatAsJSON(experiment, includeMetrics, includeDetails);
        contentType = 'application/json';
        filename = `experiment_${experimentId}.json`;
        break;

      case 'csv':
        exportData = formatAsCSV(experiment, includeMetrics, includeDetails);
        contentType = 'text/csv';
        filename = `experiment_${experimentId}.csv`;
        break;

      case 'pdf':
        // For PDF, we'll return a JSON structure that can be used to generate PDF on frontend
        exportData = formatAsPDFData(experiment, includeMetrics, includeDetails);
        contentType = 'application/json';
        filename = `experiment_${experimentId}_pdf_data.json`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported format. Supported formats: json, csv, pdf'
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(exportData);

  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export experiment data'
    });
  }
});

/**
 * Format experiment data as JSON
 */
function formatAsJSON(experiment: any, includeMetrics: boolean, includeDetails: boolean): string {
  const exportData = {
    experiment: {
      id: experiment.id,
      name: experiment.name,
      description: experiment.description,
      prompt: experiment.prompt,
      createdAt: experiment.createdAt,
      updatedAt: experiment.updatedAt,
      totalRuns: experiment.totalRuns,
      parameterRange: {
        temperature: { min: experiment.temperatureMin, max: experiment.temperatureMax },
        top_p: { min: experiment.topPMin, max: experiment.topPMax },
        max_tokens: { min: experiment.maxTokensMin, max: experiment.maxTokensMax }
      }
    },
    responses: experiment.results.map((result: any) => {
      const responseData: any = {
        id: result.id,
        content: result.content,
        parameters: {
          temperature: result.temperature,
          top_p: result.topP,
          max_tokens: result.maxTokens,
          model: result.model
        },
        generatedAt: result.generatedAt,
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime
      };

      if (includeMetrics) {
        responseData.metrics = {
          coherence: result.coherence,
          completeness: result.completeness,
          readability: result.readability,
          relevance: result.relevance,
          overallScore: result.overallScore
        };
      }

      if (includeDetails && result.metricCalculations) {
        responseData.metricDetails = {};
        result.metricCalculations.forEach((calc: any) => {
          try {
            responseData.metricDetails[calc.metricType] = JSON.parse(calc.details || '{}');
          } catch (e) {
            responseData.metricDetails[calc.metricType] = { score: calc.score };
          }
        });
      }

      return responseData;
    }),
    summary: {
      totalResponses: experiment.results.length,
      averageMetrics: calculateAverageMetrics(experiment.results),
      parameterRange: {
        temperature: { min: experiment.temperatureMin, max: experiment.temperatureMax },
        top_p: { min: experiment.topPMin, max: experiment.topPMax },
        max_tokens: { min: experiment.maxTokensMin, max: experiment.maxTokensMax }
      }
    },
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Format experiment data as CSV
 */
function formatAsCSV(experiment: any, includeMetrics: boolean, includeDetails: boolean): string {
  const headers = [
    'Response ID',
    'Content',
    'Temperature',
    'Top P',
    'Max Tokens',
    'Model',
    'Generated At',
    'Tokens Used',
    'Generation Time (ms)'
  ];

  if (includeMetrics) {
    headers.push('Coherence', 'Completeness', 'Readability', 'Relevance', 'Overall Score');
  }

  if (includeDetails) {
    headers.push('Coherence Details', 'Completeness Details', 'Readability Details', 'Relevance Details');
  }

  const rows = experiment.results.map((result: any) => {
    const row = [
      result.id,
      `"${result.content.replace(/"/g, '""')}"`,
      result.temperature,
      result.topP,
      result.maxTokens,
      result.model,
      result.generatedAt,
      result.tokensUsed || '',
      result.generationTime || ''
    ];

    if (includeMetrics) {
      row.push(
        result.coherence || '',
        result.completeness || '',
        result.readability || '',
        result.relevance || '',
        result.overallScore || ''
      );
    }

    if (includeDetails && result.metricCalculations) {
      const details: Record<string, any> = {};
      result.metricCalculations.forEach((calc: any) => {
        try {
          details[calc.metricType] = JSON.parse(calc.details || '{}');
        } catch (e) {
          details[calc.metricType] = { score: calc.score };
        }
      });

      row.push(
        `"${JSON.stringify(details.coherence || {}).replace(/"/g, '""')}"`,
        `"${JSON.stringify(details.completeness || {}).replace(/"/g, '""')}"`,
        `"${JSON.stringify(details.readability || {}).replace(/"/g, '""')}"`,
        `"${JSON.stringify(details.relevance || {}).replace(/"/g, '""')}"`
      );
    }

    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Format experiment data for PDF generation
 */
function formatAsPDFData(experiment: any, includeMetrics: boolean, includeDetails: boolean): string {
  const pdfData = {
    title: `Experiment Report: ${experiment.name || experiment.id}`,
    experiment: {
      id: experiment.id,
      name: experiment.name,
      description: experiment.description,
      prompt: experiment.prompt,
      createdAt: experiment.createdAt,
      totalRuns: experiment.totalRuns
    },
    responses: experiment.results.map((result: any) => ({
      id: result.id,
      content: result.content,
      parameters: {
        temperature: result.temperature,
        top_p: result.topP,
        max_tokens: result.maxTokens,
        model: result.model
      },
      metrics: includeMetrics ? {
        coherence: result.coherence,
        completeness: result.completeness,
        readability: result.readability,
        relevance: result.relevance,
        overallScore: result.overallScore
      } : undefined,
      generatedAt: result.generatedAt
    })),
    summary: {
      totalResponses: experiment.results.length,
      averageMetrics: calculateAverageMetrics(experiment.results),
      bestResponse: findBestResponse(experiment.results),
      worstResponse: findWorstResponse(experiment.results)
    },
    generatedAt: new Date().toISOString()
  };

  return JSON.stringify(pdfData, null, 2);
}

/**
 * Calculate average metrics across all responses
 */
function calculateAverageMetrics(results: any[]): any {
  if (results.length === 0) return {};

  const totals = results.reduce((acc, result) => ({
    coherence: acc.coherence + (result.coherence || 0),
    completeness: acc.completeness + (result.completeness || 0),
    readability: acc.readability + (result.readability || 0),
    relevance: acc.relevance + (result.relevance || 0),
    overallScore: acc.overallScore + (result.overallScore || 0)
  }), { coherence: 0, completeness: 0, readability: 0, relevance: 0, overallScore: 0 });

  return {
    coherence: Math.round((totals.coherence / results.length) * 100) / 100,
    completeness: Math.round((totals.completeness / results.length) * 100) / 100,
    readability: Math.round((totals.readability / results.length) * 100) / 100,
    relevance: Math.round((totals.relevance / results.length) * 100) / 100,
    overallScore: Math.round((totals.overallScore / results.length) * 100) / 100
  };
}

/**
 * Find the response with the highest overall score
 */
function findBestResponse(results: any[]): any {
  if (results.length === 0) return null;
  
  return results.reduce((best, current) => 
    (current.overallScore || 0) > (best.overallScore || 0) ? current : best
  );
}

/**
 * Find the response with the lowest overall score
 */
function findWorstResponse(results: any[]): any {
  if (results.length === 0) return null;
  
  return results.reduce((worst, current) => 
    (current.overallScore || 0) < (worst.overallScore || 0) ? current : worst
  );
}

export default router;
