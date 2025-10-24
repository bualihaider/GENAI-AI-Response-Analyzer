# AI Response Quality Analyzer - Frontend

A modern React application built with Next.js 15 that provides an intuitive interface for experimenting with LLM parameters and analyzing response quality through custom metrics.

## 🎯 Overview

The frontend is a sophisticated single-page application that enables users to:
- Configure LLM parameters through interactive controls
- Generate multiple AI responses with different parameter combinations
- Visualize quality metrics through interactive charts and dashboards
- Manage experiment history and export results
- Analyze response quality across multiple dimensions

## 🛠️ Technology Stack

### Core Technologies
- **Next.js 15** - React framework with App Router
- **TypeScript 5.x** - Type-safe development
- **Tailwind CSS 3.x** - Utility-first styling
- **React 18** - Component-based UI library

### Key Libraries
- **Recharts 2.x** - Data visualization and charts
- **Heroicons 2.x** - Icon library
- **Headless UI** - Accessible UI components
- **React Hook Form** - Form management
- **React Markdown** - Markdown rendering

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Next.js Dev Server** - Development server

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 8+** - Comes with Node.js
- **Backend API** - Must be running on port 3001 with Google Gemini integration

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_APP_NAME="AI Response Quality Analyzer"
   NEXT_PUBLIC_DEBUG=true
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (proxy to backend)
│   │   │   ├── experiments/   # Experiment management
│   │   │   ├── export/        # Data export
│   │   │   └── generate/      # Response generation
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Main application page
│   ├── components/            # React components
│   │   ├── Header.tsx         # Navigation and branding
│   │   ├── PromptInput.tsx    # Prompt configuration
│   │   ├── ParameterControls.tsx # LLM parameter sliders
│   │   ├── ResponseDisplay.tsx # Results visualization
│   │   └── ExperimentHistory.tsx # Experiment management
│   └── types/                 # TypeScript definitions
│       └── index.ts           # Shared type definitions
├── public/                    # Static assets
│   ├── icons/                # App icons
│   └── images/               # Images and graphics
├── package.json              # Dependencies and scripts
├── next.config.ts            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🎨 Component Architecture

### Core Components

#### Header.tsx
- **Purpose**: Navigation and application branding
- **Features**: Responsive navigation, theme toggle, user info
- **Props**: None (uses context for state)

#### PromptInput.tsx
- **Purpose**: Prompt configuration and experiment setup
- **Features**: 
  - Text area for prompt input
  - Real-time validation
  - Character count
  - Auto-save functionality
- **Props**: `onPromptChange`, `initialPrompt`

#### ParameterControls.tsx
- **Purpose**: LLM parameter configuration
- **Features**:
  - Interactive sliders for temperature, top-p, max tokens
  - Real-time value display
  - Range validation
  - Preset configurations
- **Props**: `onParameterChange`, `initialParameters`

#### ResponseDisplay.tsx
- **Purpose**: Results visualization and analysis
- **Features**:
  - Interactive charts (radar, bar, line)
  - Response comparison
  - Metric breakdown
  - Export functionality
- **Props**: `responses`, `experimentId`

#### ExperimentHistory.tsx
- **Purpose**: Past experiment management
- **Features**:
  - Paginated experiment list
  - Search and filtering
  - Experiment details modal
  - Bulk operations
- **Props**: `experiments`, `onExperimentSelect`

## 🎨 UI/UX Design

### Design System

#### Color Palette
- **Primary**: `#3B82F6` (Blue) - Trust and reliability
- **Secondary**: `#6B7280` (Gray) - Neutral and balanced
- **Success**: `#10B981` (Green) - Positive feedback
- **Warning**: `#F59E0B` (Orange) - Caution
- **Error**: `#EF4444` (Red) - Errors and critical actions
- **Background**: `#F9FAFB` (Light Gray) - Clean background

#### Typography
- **Primary Font**: Inter (system font fallback)
- **Monospace**: JetBrains Mono (for code/technical content)
- **Scale**: 10px, 12px, 14px, 16px, 18px, 20px, 24px

#### Spacing System
- **Micro**: 4px, 8px
- **Small**: 12px, 16px
- **Medium**: 24px, 32px
- **Large**: 48px, 64px

### Responsive Design

#### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

#### Responsive Strategies
- **Mobile-First**: Design for mobile, enhance for larger screens
- **Flexible Layouts**: CSS Grid and Flexbox
- **Touch-Friendly**: 44px minimum touch targets
- **Content Priority**: Most important content visible on small screens

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors

# Type checking
npm run type-check   # Run TypeScript compiler
npm run type-check:watch # Watch mode for type checking
```

### Development Workflow

1. **Start backend server** (in separate terminal)
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Start frontend development server**
   ```bash
   npm run dev
   ```

3. **Open browser** to [http://localhost:3000](http://localhost:3000)

4. **Make changes** - Hot reload will update automatically

### Code Standards

#### TypeScript
- **Strict Mode**: Enabled for type safety
- **No Implicit Any**: All types must be explicit
- **Interface Definitions**: All props and state must be typed
- **Import Organization**: Grouped imports (React, libraries, local)

#### Component Guidelines
- **Functional Components**: Use React hooks
- **Props Interface**: Define interface for all props
- **Default Props**: Use default parameters
- **Error Boundaries**: Wrap components in error boundaries
- **Accessibility**: Include ARIA labels and keyboard navigation

#### Styling Guidelines
- **Tailwind Classes**: Use utility classes
- **Custom CSS**: Only when Tailwind doesn't provide the needed style
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Support for dark theme (future enhancement)

## 📊 State Management

### Local State
- **useState**: Component-level state
- **useEffect**: Side effects and lifecycle
- **useCallback**: Memoized functions
- **useMemo**: Memoized values

### Global State
- **Context API**: For theme and user preferences
- **Local Storage**: For persistent settings
- **URL State**: For experiment sharing

### Data Flow
```
User Input → Component State → API Call → Backend → Database
     ↑                                                      ↓
     └── UI Update ← State Update ← Response Processing ←────┘
```

## 🔌 API Integration

### Backend Communication
- **Base URL**: `NEXT_PUBLIC_API_URL` environment variable
- **API Client**: Native fetch API for Google Gemini backend communication
- **Error Handling**: Try-catch with user-friendly messages
- **Loading States**: Skeleton screens and progress indicators

### API Endpoints Used
- `GET /api/experiments` - Fetch experiment history
- `POST /api/generate` - Generate new responses
- `POST /api/export` - Export experiment data
- `GET /api/health` - Health check

### Error Handling Strategy
- **Network Errors**: Retry with exponential backoff
- **API Errors**: Display user-friendly error messages
- **Validation Errors**: Show field-specific errors
- **Fallback UI**: Graceful degradation for failed requests

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Full user workflow testing (future)
- **Visual Tests**: Screenshot testing for UI consistency

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Structure
```
__tests__/
├── components/       # Component tests
├── utils/           # Utility function tests
├── api/             # API integration tests
└── __mocks__/       # Mock implementations
```

## 🚀 Deployment

### Build Process
```bash
npm run build        # Create production build
npm run start        # Start production server
```

### Environment Variables

#### Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="AI Response Quality Analyzer"
NEXT_PUBLIC_DEBUG=true
```

#### Production (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME="AI Response Quality Analyzer"
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_GA_TRACKING_ID=your_ga_id
```

### Deployment Platforms

#### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### Netlify
1. Connect repository
2. Configure build settings
3. Set environment variables
4. Deploy

#### Self-Hosted
1. Build the application: `npm run build`
2. Serve static files with nginx/apache
3. Configure reverse proxy to backend

## 🔍 Performance Optimization

### Built-in Optimizations
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: `npm run analyze`
- **Tree Shaking**: Dead code elimination

### Custom Optimizations
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Prevent unnecessary re-renders
- **Debouncing**: API calls and user input
- **Caching**: API response caching

### Performance Monitoring
- **Web Vitals**: Core web vitals tracking
- **Bundle Size**: Monitor bundle size growth
- **API Performance**: Track API response times
- **User Experience**: Monitor loading states

## 🐛 Troubleshooting

### Common Issues

#### Development Server Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### API Connection Issues
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` environment variable
- Test API endpoint: `curl http://localhost:3001/api/health`

#### Build Errors
```bash
# Check TypeScript errors
npm run type-check

# Fix linting errors
npm run lint:fix

# Clear Next.js cache
rm -rf .next
npm run build
```

#### Styling Issues
- Verify Tailwind CSS is properly configured
- Check for conflicting CSS classes
- Ensure responsive breakpoints are correct

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Learning Resources
- [Next.js Learn Course](https://nextjs.org/learn)
- [React Tutorial](https://react.dev/learn)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs/utility-first)

### Community
- [Next.js GitHub](https://github.com/vercel/next.js)
- [React GitHub](https://github.com/facebook/react)
- [Tailwind CSS GitHub](https://github.com/tailwindlabs/tailwindcss)

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Components are accessible
- [ ] Responsive design is implemented
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] Performance is considered

---