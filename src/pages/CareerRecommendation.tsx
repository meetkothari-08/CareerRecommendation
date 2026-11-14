import React from 'react';
import { Brain, Target, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {title: 'Career Recommendations', description: 'Explore career directions using your skills and goals.', icon: Brain, to: '/career-recommendation', cta: 'Get suggestions'},
  {title: 'Your Profile', description: 'Review and edit your career profile in the local demo.', icon: Target, to: '/profile', cta: 'View profile'},
  {title: 'Career Personality', description: 'Explore preferences and work-style questions.', icon: Star, to: '/user-profile', cta: 'Explore profile'},
  {title: 'Market Analysis', description: 'Review job-posting trends when provider data is available.', icon: TrendingUp, to: '/market-analysis', cta: 'View trends'}
];

export default function CareerRecommendation() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-purple-700 text-center mb-4">Explore Career Paths</h1>
        <p className="text-lg text-gray-600 text-center mb-12">Personalized career guidance, learning directions and job-market exploration.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({title, description, icon: Icon, to, cta}) => (
            <section key={title} className="bg-white rounded-xl shadow-lg p-6">
              <Icon className="h-10 w-10 text-purple-600 mb-4" />
              <h2 className="text-xl font-semibold mb-3">{title}</h2>
              <p className="text-gray-600 mb-5">{description}</p>
              <Link to={to} className="font-semibold text-purple-700 hover:underline">{cta}</Link>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
