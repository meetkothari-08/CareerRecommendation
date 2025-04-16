import React, { useState } from 'react';
import { Brain, Heart, Users, Sun, Shield } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
}

const questions: Question[] = [
  {
    id: 1,
    text: "I am curious about many different things",
    trait: "openness"
  },
  {
    id: 2,
    text: "I am organized and follow a schedule",
    trait: "conscientiousness"
  },
  {
    id: 3,
    text: "I enjoy being around people",
    trait: "extraversion"
  },
  {
    id: 4,
    text: "I am sympathetic to others' feelings",
    trait: "agreeableness"
  },
  {
    id: 5,
    text: "I handle stress well",
    trait: "neuroticism"
  },
  // Add more questions for each trait
];

const traitDescriptions = {
  openness: {
    icon: <Brain className="h-8 w-8 text-indigo-600" />,
    title: "Openness to Experience",
    description: "Reflects curiosity, creativity, and preference for variety"
  },
  conscientiousness: {
    icon: <Shield className="h-8 w-8 text-indigo-600" />,
    title: "Conscientiousness",
    description: "Indicates organization, responsibility, and goal-oriented behavior"
  },
  extraversion: {
    icon: <Users className="h-8 w-8 text-indigo-600" />,
    title: "Extraversion",
    description: "Measures sociability, energy, and assertiveness"
  },
  agreeableness: {
    icon: <Heart className="h-8 w-8 text-indigo-600" />,
    title: "Agreeableness",
    description: "Shows compassion, cooperation, and consideration for others"
  },
  neuroticism: {
    icon: <Sun className="h-8 w-8 text-indigo-600" />,
    title: "Emotional Stability",
    description: "Reflects emotional regulation and stress management"
  }
};

const Big5PersonalityTest: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Record<string, number>>({});

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateResults = () => {
    const traitScores: Record<string, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: []
    };

    questions.forEach(question => {
      if (answers[question.id] !== undefined) {
        traitScores[question.trait].push(answers[question.id]);
      }
    });

    const averageScores: Record<string, number> = {};
    Object.entries(traitScores).forEach(([trait, scores]) => {
      if (scores.length > 0) {
        averageScores[trait] = scores.reduce((a, b) => a + b, 0) / scores.length;
      } else {
        averageScores[trait] = 0;
      }
    });

    setResults(averageScores);
    setShowResults(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
        Big Five Personality Assessment
      </h2>

      {!showResults ? (
        <div className="space-y-8">
          {questions.map(question => (
            <div key={question.id} className="bg-gray-50 p-6 rounded-xl">
              <p className="text-lg font-medium mb-4">{question.text}</p>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-500">Strongly Disagree</span>
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(question.id, value)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      answers[question.id] === value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
                <span className="text-sm text-gray-500">Strongly Agree</span>
              </div>
            </div>
          ))}

          <button
            onClick={calculateResults}
            disabled={Object.keys(answers).length !== questions.length}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
              Object.keys(answers).length === questions.length
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            View Your Results
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(results).map(([trait, score]) => (
              <div key={trait} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  {traitDescriptions[trait as keyof typeof traitDescriptions].icon}
                  <h3 className="text-xl font-semibold">
                    {traitDescriptions[trait as keyof typeof traitDescriptions].title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {traitDescriptions[trait as keyof typeof traitDescriptions].description}
                </p>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                        Score: {Math.round(score * 20)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                    <div
                      style={{ width: `${score * 20}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setShowResults(false);
              setAnswers({});
            }}
            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Retake Test
          </button>
        </div>
      )}
    </div>
  );
};

export default Big5PersonalityTest;