import React from 'react';
import { LucideArrowLeft, LucideBookOpen } from 'lucide-react';

interface CourseRecommendationModalProps {
  courses: string[];
  onClose: () => void;
}

const CourseRecommendationModal: React.FC<CourseRecommendationModalProps> = ({ courses, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <button 
            onClick={onClose}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
          >
            <LucideArrowLeft className="mr-2" />
            Back to Assessment
          </button>

          <h2 className="text-2xl font-bold mb-6 text-gray-800">Recommended Courses</h2>
          
          <div className="space-y-4">
            {courses.map((course, index) => (
              <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                <LucideBookOpen className="text-indigo-500 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">{course}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseRecommendationModal;
