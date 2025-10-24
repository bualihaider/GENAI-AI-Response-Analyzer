# AI Response Quality Analyzer - Backend

A robust Node.js API server built with Express.js and TypeScript that provides comprehensive LLM response generation, quality analysis, and experiment management capabilities.

## 🎯 Overview

The backend is a sophisticated API server that handles:
- LLM response generation with Google Gemini integration
- Custom quality metrics calculation
- Experiment data management and storage
- Real-time response analysis
- Data export in multiple formats
- Server health monitoring and maintenance

## 🛠️ Technology Stack

### Core Technologies
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.x** - Web application framework
- **TypeScript 5.x** - Type-safe development
- **MongoDB 7.x** - NoSQL database
- **Prisma 5.x** - Database ORM

### Key Libraries
- **Google Generative AI SDK** - LLM API integration
- **Node-cron** - Scheduled task management
- **Express Rate Limit** - API rate limiting
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logging

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server
- **Prisma Studio** - Database management GUI
- **Jest** - Testing framework

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 8+** - Comes with Node.js
- **MongoDB** - Local installation or MongoDB Atlas account
- **Google Gemini API Key** - [Get API Key](https://ai.google.dev/)

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env` file:
   ```env
   # Database Configuration
   DATABASE_URL="mongodb://localhost:27017/ai-response-analyzer"
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   SERVER_URL=http://localhost:3001
   
   
   # Google Gemini Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-pro
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Verify installation**
   Test API health: [http://localhost:3001/api/health](http://localhost:3001/api/health)

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/                # API route handlers
│   │   ├── experiments.ts    # Experiment CRUD operations
│   │   ├── generation.ts     # Response generation logic
│   │   ├── export.ts         # Data export functionality
│   │   └── health.ts         # Health check endpoint
│   ├── services/             # Business logic services
│   │   ├── llmService.ts     # Google Gemini API integration
│   │   ├── qualityMetrics.ts # Quality calculation engine
│   │   └── cronService.ts    # Background task processing
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Shared type definitions
│   ├── utils/                # Utility functions
│   │   ├── validation.ts     # Input validation helpers
│   │   ├── logger.ts         # Logging utilities
│   │   └── constants.ts      # Application constants
├── prisma/                  # Database schema and migrations
│   └── schema.prisma        # Prisma schema definition
├── dist/                    # Compiled JavaScript output
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🔧 API Architecture

### Route Structure

#### Experiments API (`/api/experiments`)
- `GET /` - List all experiments
- `GET /:id` - Get specific experiment
- `POST /` - Create new experiment
- `PATCH /:id` - Update experiment metadata
- `DELETE /:id` - Delete experiment and responses

#### Generation API (`/api/generate`)
- `POST /` - Generate responses with parameter combinations
- `GET /status/:id` - Check generation status
- `POST /cancel/:id` - Cancel ongoing generation

#### Export API (`/api/export`)
- `POST /` - Export experiment data
- `GET /formats` - List available export formats
- `GET /download/:id` - Download exported file

#### Health API (`/api/health`)
- `GET /` - Health check endpoint
- `GET /metrics` - Server metrics
- `GET /status` - Detailed status information

### Service Layer Architecture

#### LLM Service (`llmService.ts`)
- **Purpose**: Google Gemini API integration and response generation
- **Features**:
  - Multiple model support (gemini-pro, gemini-pro-vision)
  - Retry logic with exponential backoff
  - Rate limiting and error handling
  - Response streaming
  - Cost tracking

#### Quality Metrics Service (`qualityMetrics.ts`)
- **Purpose**: Custom quality calculation engine
- **Features**:
  - Four quality metrics (Coherence, Completeness, Readability, Relevance)
  - Detailed algorithm implementation
  - Batch processing capabilities
  - Metric validation and normalization

#### Cron Service (`cronService.ts`)
- **Purpose**: Background task processing
- **Features**:
  - Server health monitoring
  - Database cleanup tasks
  - Performance metrics collection
  - Automated maintenance

## 🗄️ Database Schema

### Core Models

#### Experiment Model
```typescript
model Experiment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  name          String?
  description   String?
  prompt        String
  temperatureMin Float
  temperatureMax Float
  topPMin       Float
  topPMax       Float
  maxTokensMin  Int
  maxTokensMax  Int
  totalRuns     Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  responses     Response[]
}
```

#### Response Model
```typescript
model Response {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  experimentId String   @db.ObjectId
  experiment   Experiment @relation(fields: [experimentId], references: [id], onDelete: Cascade)
  temperature  Float
  topP         Float
  maxTokens    Int
  content      String
  coherence    Float?
  completeness Float?
  readability  Float?
  relevance    Float?
  overallScore Float?
  generatedAt  DateTime @default(now())
  model        String   @default("gpt-3.5-turbo")
  tokensUsed   Int?
  generationTime Float?
  metricCalculations MetricCalculation[]
}
```

#### Metric Calculation Model
```typescript
model MetricCalculation {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  responseId  String   @db.ObjectId
  response    Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  metricType  String
  score       Float
  details     String?
  calculatedAt DateTime @default(now())
}
```

### Database Operations

#### Prisma Client Usage
```typescript
// Create experiment
const experiment = await prisma.experiment.create({
  data: {
    prompt: "Explain machine learning",
    temperatureMin: 0.1,
    temperatureMax: 0.9,
    totalRuns: 5
  }
});

// Get experiment with responses
const experimentWithResponses = await prisma.experiment.findUnique({
  where: { id: experimentId },
  include: {
    responses: {
      include: {
        metricCalculations: true
      }
    }
  }
});
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with test data
```

### Development Workflow

1. **Start MongoDB** (if using local instance)
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or start manually
   mongod --dbpath /usr/local/var/mongodb
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open Prisma Studio** (optional)
   ```bash
   npm run db:studio
   ```

4. **Make changes** - Server will restart automatically

## 📊 Quality Metrics Implementation

### Metric Calculation Engine

The quality metrics service implements four sophisticated algorithms:

#### Coherence Metric
```typescript
function calculateCoherence(text: string): number {
  const sentenceStructure = analyzeSentenceStructure(text);
  const logicalFlow = detectLogicalFlow(text);
  const consistency = checkConsistency(text);
  const paragraphStructure = analyzeParagraphStructure(text);
  
  return (
    sentenceStructure * 0.3 +
    logicalFlow * 0.3 +
    consistency * 0.2 +
    paragraphStructure * 0.2
  );
}
```

#### Completeness Metric
```typescript
function calculateCompleteness(prompt: string, response: string): number {
  const questionAnswering = analyzeQuestionAnswering(prompt, response);
  const topicCoverage = analyzeTopicCoverage(prompt, response);
  const detailLevel = analyzeDetailLevel(response);
  const conclusion = detectConclusion(response);
  
  return (
    questionAnswering * 0.4 +
    topicCoverage * 0.3 +
    detailLevel * 0.2 +
    conclusion * 0.1
  );
}
```

#### Readability Metric
```typescript
function calculateReadability(text: string): number {
  const sentenceLength = analyzeSentenceLength(text);
  const wordComplexity = analyzeWordComplexity(text);
  const paragraphLength = analyzeParagraphLength(text);
  const passiveVoice = detectPassiveVoice(text);
  
  return (
    sentenceLength * 0.3 +
    wordComplexity * 0.3 +
    paragraphLength * 0.2 +
    passiveVoice * 0.2
  );
}
```

#### Relevance Metric
```typescript
function calculateRelevance(prompt: string, response: string): number {
  const keywordOverlap = calculateKeywordOverlap(prompt, response);
  const topicAlignment = calculateTopicAlignment(prompt, response);
  const contextPreservation = analyzeContextPreservation(prompt, response);
  const offTopicDetection = detectOffTopicContent(prompt, response);
  
  return (
    keywordOverlap * 0.3 +
    topicAlignment * 0.3 +
    contextPreservation * 0.2 +
    offTopicDetection * 0.2
  );
}
```

## 🔌 API Integration

### Google Gemini Integration

#### LLM Service Implementation
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

class LLMService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateResponse(prompt: string, parameters: GenerationParameters): Promise<LLMResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: parameters.model || 'gemini-pro',
        generationConfig: {
          temperature: parameters.temperature,
          topP: parameters.topP,
          maxOutputTokens: parameters.maxTokens,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        model: parameters.model || 'gemini-pro',
        generationTime: Date.now() - startTime
      };
    } catch (error) {
      throw new LLMServiceError('Failed to generate response', error);
    }
  }
}
```

#### Error Handling and Retry Logic
```typescript
async generateWithRetry(prompt: string, parameters: GenerationParameters, maxRetries = 3): Promise<LLMResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.generateResponse(prompt, parameters);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```
## 🚀 Deployment

### Production Build
```bash
npm run build    # Compile TypeScript
npm run start    # Start production server
```

### Deployment Platforms

#### Render
1. Connect repository
2. Configure build settings
3. Set environment variables
4. Deploy
