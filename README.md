# Career Recommendation System

A modern web application that provides personalized career recommendations using AI. The system combines LSTM model predictions with Groq API to deliver comprehensive career guidance.

## Features

- AI-powered career recommendations using Groq API
- Interactive user interface for profile input
- Personalized career path suggestions
- Skill development recommendations
- Market analysis with job trends
- Salary insights and global demand analysis

## Tech Stack

- Frontend:
  - React + TypeScript
  - Vite
  - Tailwind CSS
  - Recharts for data visualization

- Backend:
  - Flask (Python)
  - LSTM model for career prediction
  - Groq API integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd career-recommendation-system
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Groq API key:
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

4. Start the frontend development server:
```bash
npm run dev
```

### Environment Variables

Required environment variables:
- `VITE_GROQ_API_KEY`: Your Groq API key for AI recommendations

## Features in Detail

1. **Career Recommendations**
   - AI-powered analysis of user profiles
   - Personalized career path suggestions
   - Skill development recommendations

2. **Market Analysis**
   - Job demand trends
   - Salary insights
   - Global demand analysis

3. **User Profile Management**
   - Skills assessment
   - Interest analysis
   - Education and experience tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 