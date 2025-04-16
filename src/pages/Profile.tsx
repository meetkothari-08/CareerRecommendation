import React from 'react';
import { User, BookOpen, Award, Briefcase } from 'lucide-react';

const Profile: React.FC = () => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-20 w-20 text-indigo-600" />
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900">John Doe</h1>
              <p className="text-gray-600">Software Developer</p>
              <p className="text-sm text-gray-500">Member since January 2024</p>
            </div>
          </div>
        </div>

        {/* Career Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <BookOpen className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Skills Assessment</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Programming</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Problem Solving</span>
                  <span className="text-sm font-medium">90%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Award className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Certifications</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                <span>AWS Certified Developer</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                <span>React Developer Certification</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Briefcase className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Career Goals</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                <span>Senior Developer Position</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                <span>Team Leadership</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {[
              {
                title: 'Completed Python Course',
                date: '2 days ago',
                description: 'Finished advanced Python programming course',
              },
              {
                title: 'Career Assessment',
                date: '1 week ago',
                description: 'Took comprehensive career assessment test',
              },
              {
                title: 'Resume Update',
                date: '2 weeks ago',
                description: 'Updated professional resume with new skills',
              },
            ].map((activity, index) => (
              <div key={index} className="border-l-4 border-indigo-600 pl-4">
                <h3 className="font-semibold">{activity.title}</h3>
                <p className="text-sm text-gray-500">{activity.date}</p>
                <p className="text-gray-600">{activity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;