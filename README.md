# CoverRun AI - Financial Management System

## Overview
CoverRun AI is an intelligent financial management system that helps users manage their finances through a dynamic jar allocation system, AI-powered transaction classification, and personalized financial advice. The system features an AI chatbot that can analyze receipts, manage transactions, and provide financial insights.

## Features

### Core Financial Management
- **6-Jar System**: Automatic allocation across Necessity, Play, Education, Investment, Charity, and Savings jars
- **Smart Transaction Management**: Add, categorize, and track income and expenses
- **Savings Goals**: Set and track progress toward financial targets
- **Predictive Analytics**: Forecast savings based on historical data

### AI-Powered Features
- **Intelligent Chatbot**: Natural language interface for financial management
- **Receipt Analysis**: receipt scanning and transaction extraction
- **Transaction Classification**: Automatic categorization of expenses
- **Financial Insights**: Personalized advice based on spending patterns
- **Web Search Integration**: Real-time information about products and deals

### Analytics & Visualization
- **Interactive Dashboards**: Visual representation of spending patterns
- **Money Flow Analysis**: Track income and expense trends
- **Jar Distribution Charts**: Monitor allocation across different categories
- **Savings Progress Tracking**: Visual progress toward financial goals

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Charts**: Chart.js and Recharts for data visualization
- **Authentication**: Supabase Auth
- **State Management**: React Context API

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL via Supabase
- **AI/ML**: 
  - Google Gemini 2.5 Flash for conversational AI
  - LangChain for AI orchestration
  - LangGraph for complex AI workflows
  - Tavily Search for web information

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend), Python backend server

## Project Structure

```
Coverrun-AI/
├── app/                          # Next.js app directory
│   ├── (main)/                  # Main application routes
│   │   ├── analytics/           # Analytics dashboard
│   │   ├── home/               # Landing page
│   │   ├── jars/               # Jar management
│   │   ├── overview/           # Financial overview
│   │   ├── profile/            # User profile
│   │   └── transactions/       # Transaction management
│   ├── auth/                   # Authentication pages
│   └── components/             # Shared components
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Main FastAPI application
│   └── requirements.txt       # Python dependencies
├── components/                 # Reusable UI components
├── context/                   # React context providers
├── services/                  # API service layers
├── hooks/                     # Custom React hooks
├── lib/                       # Utility libraries
└── public/                    # Static assets
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Supabase account
- Google AI API key
- Tavily Search API key

### Frontend Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Coverrun-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the backend directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_API_KEY=your_google_ai_api_key
   TAVILY_API_KEY=your_tavily_api_key
   ```

5. Run the backend server:
   ```bash
   python main.py
   ```

### Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `new_accumulative_db_schema.sql`
3. Set up Row Level Security (RLS) policies
4. Configure authentication providers

## API Endpoints

### Backend API (FastAPI)
- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /chat/stream` - Streaming chat interface with AI

### Key Features of Chat API
- Real-time streaming responses
- Multi-modal support (text + images)
- Function calling for financial operations
- Conversation history management
- User context awareness

## AI Capabilities

### Chatbot Functions
- **add_monthly_income**: Allocate monthly income across jars
- **update_transaction**: Add income/expense transactions
- **set_saving_target**: Set financial goals
- **predict_savings**: Forecast goal achievement
- **get_transaction_schema**: Analyze database structure
- **sql_executor**: Query transaction history
- **search_web**: Find product information and deals

### Supported Operations
- Natural language transaction entry
- Receipt scanning and processing
- Spending pattern analysis
- Financial goal planning
- Budget recommendations
- Deal and offer discovery

## Database Schema

### Key Tables
- **users**: User profiles and settings
- **transactions**: All financial transactions
- **jar_categories**: Six jar types (Necessity, Play, etc.)
- **monthly_income_entries**: Monthly income allocations
- **savings_targets**: User financial goals

## Development

### Running Tests
```bash
npm run test        # Frontend tests
python -m pytest   # Backend tests (if configured)
```

### Code Quality
```bash
npm run lint        # ESLint for frontend
black backend/      # Python code formatting
```

### Building for Production
```bash
npm run build       # Build frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Backend (.env)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_API_KEY=
TAVILY_API_KEY=
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend
1. Choose a Python hosting service (Railway, Render, etc.)
2. Set environment variables
3. Deploy the FastAPI application

## Troubleshooting

### Common Issues
1. **Supabase Connection**: Verify URL and API keys
2. **AI API Limits**: Check API quotas and billing
3. **CORS Issues**: Ensure backend allows frontend origin
4. **Database Permissions**: Verify RLS policies

### Support
- Check the issues section on GitHub
- Review the development plan in DEVELOPMENT_PLAN.md
- Contact the development team

## License
This project is proprietary software developed for CoverRun AI.

## Acknowledgments
- Built with Next.js, FastAPI, and Supabase
- AI powered by Google Gemini and LangChain
- UI components from shadcn/ui
- Charts powered by Chart.js and Recharts

---

For detailed development information, see DEVELOPMENT_PLAN.md
For AI analysis insights, see JARGON_AI_ANALYSIS.md
