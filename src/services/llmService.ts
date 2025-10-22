import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GenerationParameters } from '../types';

export class LLMService {
  private genAI: GoogleGenerativeAI | null = null;
  private isMockMode: boolean = false;

  constructor() {
    const projectKey = process.env.GEMINI_PROJECT_KEY;
    const projectName = process.env.GEMINI_PROJECT_NAME;
    const projectNumber = process.env.GEMINI_PROJECT_NUMBER;
    
    if (projectKey && projectKey !== 'your_gemini_project_key_here' && 
        projectName && projectName !== 'your_gemini_project_name_here' &&
        projectNumber && projectNumber !== 'your_gemini_project_number_here') {
      this.genAI = new GoogleGenerativeAI(projectKey);
      this.isMockMode = false;
      console.log('✅ Gemini AI initialized with real API credentials');
    } else {
      this.isMockMode = true;
      console.log('⚠️  Running in mock mode - no real Gemini API credentials provided');
    }
  }

  /**
   * Generate a response using Gemini AI or mock data
   */
  async generateResponse(
    prompt: string, 
    parameters: GenerationParameters
  ): Promise<{
    content: string;
    tokensUsed: number;
    generationTime: number;
  }> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`🚀 [${requestId}] Starting Gemini AI request`);
    console.log(`📝 [${requestId}] Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
    console.log(`⚙️  [${requestId}] Parameters:`, {
      model: parameters.model || 'gemini-2.5-flash',
      temperature: parameters.temperature,
      top_p: parameters.top_p,
      max_tokens: 'unlimited (removed for testing)'
    });
    
    if (this.isMockMode) {
      console.log(`🎭 [${requestId}] Using mock response (API not available)`);
      return this.generateMockResponse(prompt, parameters, startTime, requestId);
    }
    
    // Try multiple models in order of preference
    const modelsToTry = [
      parameters.model || 'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    
    for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
      const modelName = modelsToTry[attempt];
      
      try {
        console.log(`🔗 [${requestId}] Attempt ${attempt + 1}: Initializing Gemini model '${modelName}'...`);
        
        const model = this.genAI!.getGenerativeModel({ 
          model: modelName!,
          generationConfig: {
            temperature: parameters.temperature,
            topP: parameters.top_p,
            // Remove maxOutputTokens to let Gemini decide the length
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            }
          ]
        });

        // Enhance the prompt to be more specific and less likely to trigger safety filters
        const enhancedPrompt = this.enhancePrompt(prompt);
        
        console.log(`📡 [${requestId}] Sending request to Gemini API (${modelName})...`);
        console.log(`📝 [${requestId}] Enhanced prompt: "${enhancedPrompt.substring(0, 150)}${enhancedPrompt.length > 150 ? '...' : ''}"`);
        
        const result = await model.generateContent(enhancedPrompt);
        const response = await result.response;
        const content = response.text() || '';
        
        // Check if response is empty (likely due to safety filters)
        if (!content || content.trim().length === 0) {
          console.warn(`⚠️  [${requestId}] Empty response from '${modelName}' - likely blocked by safety filters`);
          console.warn(`⚠️  [${requestId}] Prompt that was blocked: "${prompt.substring(0, 100)}..."`);
          
          // If this was the last attempt, fall back to mock
          if (attempt === modelsToTry.length - 1) {
            console.log(`🔄 [${requestId}] All models returned empty responses, falling back to mock`);
            return this.generateMockResponse(prompt, parameters, startTime, requestId);
          }
          
          // Try next model
          continue;
        }
        
        // Estimate token usage (Gemini doesn't provide exact token counts in the same way)
        const tokensUsed = Math.floor(content.length / 4) + Math.floor(prompt.length / 4);
        const generationTime = Date.now() - startTime;

        console.log(`✅ [${requestId}] Gemini response received from '${modelName}'`);
        console.log(`📊 [${requestId}] Response stats:`, {
          contentLength: content.length,
          estimatedTokens: tokensUsed,
          generationTime: `${generationTime}ms`,
          model: modelName
        });
        console.log(`💬 [${requestId}] Response preview: "${content.substring(0, 150)}${content.length > 150 ? '...' : ''}"`);

        return {
          content,
          tokensUsed,
          generationTime
        };
      } catch (error: any) {
        console.error(`❌ [${requestId}] Attempt ${attempt + 1} failed with '${modelName}':`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message
        });
        
        // Check if it's a retryable error (503, 429, 500, 502)
        const isRetryable = error.status === 503 || error.status === 429 || 
                           error.status === 500 || error.status === 502;
        
        if (isRetryable && attempt < modelsToTry.length - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          console.log(`⏳ [${requestId}] Retrying in ${delay}ms with next model...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If this was the last attempt or non-retryable error, fall back to mock
        if (attempt === modelsToTry.length - 1) {
          console.log(`🔄 [${requestId}] All models failed, falling back to mock response`);
          return this.generateMockResponse(prompt, parameters, startTime, requestId);
        }
      }
    }
    
    // This should never be reached, but just in case
    console.log(`🔄 [${requestId}] Unexpected fallback to mock response`);
    return this.generateMockResponse(prompt, parameters, startTime, requestId);
  }

  /**
   * Generate multiple responses with different parameter combinations
   */
  async generateMultipleResponses(
    prompt: string,
    parameterCombinations: GenerationParameters[]
  ): Promise<Array<{
    content: string;
    parameters: GenerationParameters;
    tokensUsed: number;
    generationTime: number;
  }>> {
    const batchId = Math.random().toString(36).substring(7);
    console.log(`🔄 [${batchId}] Starting batch generation of ${parameterCombinations.length} responses`);
    
    const results = [];
    
    for (let i = 0; i < parameterCombinations.length; i++) {
      const params = parameterCombinations[i];
      if (!params) {
        console.error(`❌ [${batchId}] Invalid parameters at index ${i}`);
        continue;
      }
      
      console.log(`📋 [${batchId}] Generating response ${i + 1}/${parameterCombinations.length}`);
      
      try {
        const result = await this.generateResponse(prompt, params);
        results.push({
          ...result,
          parameters: params
        });
        
        console.log(`✅ [${batchId}] Response ${i + 1} completed successfully`);
        
        // Add delay between requests to avoid rate limiting (except for the last request)
        if (i < parameterCombinations.length - 1) {
          const delay = 1000; // 1 second delay between requests
          console.log(`⏳ [${batchId}] Waiting ${delay}ms before next request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ [${batchId}] Error generating response ${i + 1}:`, error);
        console.error(`❌ [${batchId}] Parameters that failed:`, params);
        
        // Add longer delay after errors to avoid hitting rate limits
        if (i < parameterCombinations.length - 1) {
          const delay = 3000; // 3 second delay after errors
          console.log(`⏳ [${batchId}] Waiting ${delay}ms after error before next request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.log(`🏁 [${batchId}] Batch generation completed: ${results.length}/${parameterCombinations.length} successful`);
    return results;
  }

  /**
   * Enhance prompt to be more specific and less likely to trigger safety filters
   */
  private enhancePrompt(originalPrompt: string): string {
    // Add context to make the prompt more specific and educational
    const enhancedPrompt = `Please provide a helpful, educational response to the following request. Focus on being informative and constructive. 

Request: ${originalPrompt}

Please respond with detailed, well-structured content that addresses the request thoroughly.`;
    
    return enhancedPrompt;
  }

  /**
   * Generate mock responses for testing and development
   */
  private generateMockResponse(
    prompt: string, 
    parameters: GenerationParameters,
    startTime: number,
    requestId?: string
  ): {
    content: string;
    tokensUsed: number;
    generationTime: number;
  } {
    const content = this.generateRealisticMockResponse(prompt, parameters);
    
    const tokensUsed = Math.floor(content.length / 4) + Math.floor(Math.random() * 50);
    const generationTime = Date.now() - startTime + Math.floor(Math.random() * 1000);
    
    if (requestId) {
      console.log(`🎭 [${requestId}] Mock response generated`);
      console.log(`📊 [${requestId}] Mock stats:`, {
        contentLength: content.length,
        estimatedTokens: tokensUsed,
        generationTime: `${generationTime}ms`,
        model: 'mock-gemini'
      });
      console.log(`💬 [${requestId}] Mock preview: "${content.substring(0, 150)}${content.length > 150 ? '...' : ''}"`);
    }
    
    return {
      content,
      tokensUsed,
      generationTime
    };
  }

  /**
   * Generate realistic mock responses based on prompt content (Gemini-style)
   */
  private generateRealisticMockResponse(prompt: string, parameters: GenerationParameters): string {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('story') || promptLower.includes('creative') || promptLower.includes('write')) {
      return this.generateCreativeWritingResponse(prompt, parameters);
    }
    
    if (promptLower.includes('explain') || promptLower.includes('how') || promptLower.includes('what is')) {
      return this.generateExplanationResponse(prompt, parameters);
    }
    
    if (promptLower.includes('?') || promptLower.includes('question')) {
      return this.generateQAResponse(prompt, parameters);
    }
    
    if (promptLower.includes('code') || promptLower.includes('program') || promptLower.includes('function')) {
      return this.generateCodeResponse(prompt, parameters);
    }
    
    return this.generateGeneralResponse(prompt, parameters);
  }

  private generateCreativeWritingResponse(prompt: string, parameters: GenerationParameters): string {
    const creativityLevel = parameters.temperature > 0.7 ? 'highly imaginative' : parameters.temperature > 0.4 ? 'moderately creative' : 'structured';
    
    const responses = [
      `Here's a ${creativityLevel} story that captures the essence of your prompt. The narrative unfolds with careful attention to character development and plot progression, creating an engaging experience that draws readers into the world you've envisioned.`,
      
      `This creative piece demonstrates the power of storytelling through ${creativityLevel} narrative techniques. The characters come to life through dialogue and action, while the plot develops naturally from the initial premise. Each scene builds upon the previous one, creating a cohesive and compelling story.`,
      
      `The story begins with an intriguing premise that immediately captures the reader's attention. Through ${creativityLevel} storytelling, the narrative explores themes of growth, discovery, and human connection. The writing style adapts to the creative parameters, resulting in a unique voice that serves the story well.`,
      
      `In this creative exploration, the author demonstrates mastery of narrative techniques while maintaining focus on the core story elements. The ${creativityLevel} approach ensures that readers remain engaged throughout, with each paragraph contributing to the overall impact of the piece.`,
      
      `This story showcases the art of creative writing through careful attention to detail and character development. The ${creativityLevel} style creates an immersive experience that allows readers to connect with the characters and become invested in their journey.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  private generateExplanationResponse(prompt: string, parameters: GenerationParameters): string {
    const clarityLevel = parameters.temperature < 0.5 ? 'precise and technical' : 'conversational and accessible';
    
    const responses = [
      `Let me explain this concept in a ${clarityLevel} manner. The topic involves several interconnected components that work together to create the overall system. Understanding each part helps build a comprehensive picture of how everything functions together.`,
      
      `This explanation takes a ${clarityLevel} approach to break down complex ideas into understandable components. Each section builds upon the previous one, creating a logical progression that helps readers grasp the fundamental concepts and their practical applications.`,
      
      `To understand this topic fully, we need to examine it from multiple perspectives. This ${clarityLevel} explanation provides the necessary context while maintaining clarity throughout. Key concepts are highlighted and supported with relevant examples that illustrate the main points effectively.`,
      
      `The explanation begins with foundational knowledge and gradually introduces more advanced concepts. This ${clarityLevel} approach ensures that readers can follow the reasoning and build their understanding progressively, making complex topics more accessible.`,
      
      `This comprehensive explanation covers the essential aspects while acknowledging the complexity of the subject matter. The ${clarityLevel} style ensures that readers can grasp both the theoretical framework and practical applications of the concepts being discussed.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  private generateQAResponse(prompt: string, parameters: GenerationParameters): string {
    const directness = parameters.temperature < 0.4 ? 'direct and concise' : 'comprehensive and nuanced';
    
    const responses = [
      `Based on the information available, here's a ${directness} answer to your question. The response considers multiple factors and provides a balanced perspective that addresses the core aspects of what you're asking about.`,
      
      `Your question touches on an important topic that requires careful consideration. This ${directness} response examines the evidence and provides insights that help clarify the situation while acknowledging the complexity involved.`,
      
      `To answer your question effectively, I'll provide a ${directness} response that addresses both the immediate aspects and the broader context. This approach ensures you receive a complete and accurate answer that considers all relevant factors.`,
      
      `The answer to your question involves several key considerations. This ${directness} response provides a thorough analysis that helps explain not just what the answer is, but why it's the case and what implications it might have.`,
      
      `Here's a ${directness} response that addresses your question while providing the necessary context to understand the answer fully. The explanation considers different perspectives and evidence to arrive at a well-informed conclusion.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  private generateCodeResponse(prompt: string, parameters: GenerationParameters): string {
    const complexity = parameters.temperature > 0.6 ? 'detailed and comprehensive' : 'concise and focused';
    
    const responses = [
      `Here's a ${complexity} solution to your programming challenge. The code demonstrates best practices and includes clear comments that explain the logic and approach. The implementation is structured for readability and maintainability.`,
      
      `This programming solution addresses your requirements using ${complexity} techniques. The code follows clean code principles and includes proper error handling, making it robust and suitable for production use.`,
      
      `The solution demonstrates effective problem-solving through ${complexity} programming techniques. Each function has a clear purpose, and the overall architecture makes the code easy to understand, test, and modify as needed.`,
      
      `This code implementation provides a solid foundation for the requested functionality. The ${complexity} approach ensures that the solution is both complete and understandable, making it suitable for learning and practical application.`,
      
      `Here's a ${complexity} programming solution that showcases good software engineering practices. The code balances functionality with code quality, considering edge cases and providing clear documentation for future maintenance.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  private generateGeneralResponse(prompt: string, parameters: GenerationParameters): string {
    const style = parameters.temperature > 0.7 ? 'creative and engaging' : parameters.temperature < 0.3 ? 'formal and structured' : 'balanced and informative';
    
    const responses = [
      `This is an interesting topic that deserves thoughtful consideration. The ${style} approach allows for a comprehensive exploration while maintaining focus on the key points that matter most to your specific question or request.`,
      
      `Your prompt raises several important points that warrant careful analysis. The ${style} style of response ensures that each aspect receives appropriate attention while maintaining coherence throughout the discussion.`,
      
      `This topic encompasses multiple dimensions that are worth exploring in detail. The response takes a ${style} approach, balancing depth with accessibility to provide a meaningful and engaging answer to your prompt.`,
      
      `The subject matter you've raised involves various interconnected elements that work together to create a complex system. A ${style} response allows for thorough coverage while ensuring that the main points are clearly communicated and well-supported.`,
      
      `Your prompt addresses an important area that benefits from careful analysis and thoughtful consideration. The ${style} approach ensures that the response is both informative and engaging, providing value while maintaining clarity and accessibility.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)]!;
  }

  /**
   * Check if the service is in mock mode
   */
  isInMockMode(): boolean {
    return this.isMockMode;
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return [
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-pro'
    ];
  }
}
