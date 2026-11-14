import React from 'react';
import { ArrowRight, Briefcase, BookOpen, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { title: 'Career Exploration', icon: Briefcase, description: 'Explore career directions based on your interests, skills and goals.' },
  { title: 'Skill Development', icon: BookOpen, description: 'Discover courses and practical steps to build relevant skills.' },
  { title: 'Goal Setting', icon: Target, description: 'Identify realistic next steps for your professional growth.' }
];

export default function Home() {
  return (
    <div className="bg-gray-50">
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Explore Your Next Career Direction</h1>
          <p className="text-xl md:text-2xl mb-8">Get AI-assisted suggestions informed by your skills, interests and goals.</p>
          <Link to="/career-recommendation" className="inline-flex items-center px-8 py-3 rounded-md bg-white text-indigo-700 font-semibold hover:bg-gray-100">
            Explore career paths <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ title, icon: Icon, description }) => (
            <div key={title} className="bg-white p-6 rounded-xl shadow-md">
              <Icon className="h-12 w-12 text-indigo-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">{title}</h2>
              <p className="text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-gray-900 text-white py-16 text-center px-4">
        <h2 className="text-3xl font-bold mb-4">Build a Career Plan That Fits You</h2>
        <p className="max-w-2xl mx-auto mb-8">Recommendations are exploratory guidance, not a validated prediction of career success.</p>
        <Link to="/career-recommendation" className="inline-block bg-white text-gray-900 px-7 py-3 rounded-md font-semibold">Get recommendations</Link>
      </section>
    </div>
  );
}
