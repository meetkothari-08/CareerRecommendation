import React from 'react';
import { Github, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <main className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <MessageSquare className="h-10 w-10 text-indigo-600 mb-5" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About This Project</h1>
        <p className="text-gray-700 leading-relaxed mb-5">
          Career Recommendation System is an independent portfolio prototype for exploring
          career directions, learning recommendations, and job-market data.
        </p>
        <p className="text-gray-600 leading-relaxed mb-8">
          The application does not currently provide a support team, public contact form,
          or guaranteed career counseling service. For project details, setup instructions,
          and technical limitations, visit the repository.
        </p>
        <a href="https://github.com/meetkothari-08/CareerRecommendation"
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Github size={20} /> View project on GitHub
        </a>
      </div>
    </main>
  );
}
