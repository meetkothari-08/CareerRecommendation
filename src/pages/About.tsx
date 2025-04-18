import React from 'react';
import { Users, Target, Award, User } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About CareerCompass</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're dedicated to helping individuals discover and pursue their ideal career paths through personalized guidance and cutting-edge technology.
          </p>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Personalized Approach</h3>
            <p className="text-gray-600">
              We understand that every individual's career journey is unique, and we tailor our guidance accordingly.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <Target className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Data-Driven Insights</h3>
            <p className="text-gray-600">
              Our recommendations are backed by comprehensive market research and industry trends.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <Award className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Continuous Support</h3>
            <p className="text-gray-600">
              We're committed to supporting you throughout your career development journey.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              {
                name: 'Meet Kothari',
                role: 'Full Stack Developer',
              },
              {
                name: 'Manav Doshi',
                role: 'Full Stack Developer',
              },
            ].map((member) => (
              <div key={member.name} className="text-center bg-gray-50 p-6 rounded-lg">
                <User className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;