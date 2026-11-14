import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Loader2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCombinedRecommendations, type UserInput } from '../services/modelService';
import { getCourseRecommendations } from '../services/courseRecommendationService';

const labels: Record<keyof UserInput, string> = {
  skills: 'Skills (comma-separated)',
  interests: 'Interests',
  experience: 'Relevant experience',
  education: 'Education',
  goals: 'Career goals',
};

const initialProfile: UserInput = {skills: '', interests: '', experience: '', education: '', goals: ''};

export default function CareerRecommendationForm() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserInput>(initialProfile);
  const [advice, setAdvice] = useState('');
  const [courses, setCourses] = useState<{title: string; course_by: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const [result, matchingCourses] = await Promise.all([
        getCombinedRecommendations(profile),
        getCourseRecommendations(profile.skills),
      ]);
      setAdvice(result.recommendations);
      setCourses(matchingCourses);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to retrieve career guidance.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-600 mb-8">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 mb-3">Personalized Career Exploration</h1>
        <p className="text-gray-600 mb-8">Share your background to get AI-assisted career paths and practical suggestions. This is guidance, not a statistical prediction.</p>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-5">
          {(Object.keys(labels) as (keyof UserInput)[]).map(key => (
            <div key={key}>
              <label htmlFor={key} className="block font-medium text-gray-700 mb-2">{labels[key]}</label>
              {key === 'goals' ? (
                <textarea id={key} required maxLength={1000} rows={4} value={profile[key]}
                  onChange={event => setProfile(prev => ({...prev, [key]: event.target.value}))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              ) : (
                <input id={key} required maxLength={1000} value={profile[key]}
                  onChange={event => setProfile(prev => ({...prev, [key]: event.target.value}))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              )}
            </div>
          ))}
          {error && <p role="alert" className="text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {loading ? 'Generating guidance...' : 'Get career guidance'}
          </button>
        </form>
        {advice && (
          <section aria-live="polite" className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mt-8">
            <h2 className="text-2xl font-bold mb-3">Your AI-Generated Career Guidance</h2>
            <p className="text-sm text-gray-600 mb-5">Suggestions are generated from your profile. No model-derived confidence or match percentage is claimed.</p>
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{advice}</div>
            {courses.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><BookOpen size={20} /> Related Courses</h3>
                <p className="text-sm text-gray-600 mb-4">Matched by skill keywords from the local course catalog.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courses.map((course, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-gray-600">{course.course_by}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
