import { cosineSimilarity } from './mathUtils';
import Papa from 'papaparse';

interface Course {
  title: string;
  course_by: string;
  skills: string;
}

let tfidfVectorizer: any;
let tfidfMatrix: any;
let courseData: Course[] = [];

export async function initializeCourseRecommender() {
  // In a real app, this would fetch from your backend API
  // For now we'll mock the TF-IDF functionality
  await loadCourseData();
  tfidfVectorizer = { transform: () => {} };
  tfidfMatrix = [];
}

export function recommendCoursesBySkills(userSkills: string, topN = 5): string[] {
  // Mock implementation - replace with actual TF-IDF logic
  const mockCourses = [
    "Machine Learning with Python",
    "Data Science Fundamentals",
    "Advanced Python Programming",
    "AI For Everyone",
    "Deep Learning Specialization"
  ];
  return mockCourses.slice(0, topN);
}

// Load and parse the CSV file
const loadCourseData = async () => {
  try {
    const response = await fetch('/data/coursera.csv');
    const csvText = await response.text();
    
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        courseData = results.data as Course[];
      }
    });
  } catch (error) {
    console.error('Error loading course data:', error);
  }
};

// Initialize the course data when the service is loaded
loadCourseData();

// Function to Recommend Courses Based on Skills Matching - Matches the Python implementation
export const recommendCourses = (userSkills: string, topN: number = 3): { title: string; course_by: string }[] => {
  if (!courseData.length) {
    console.warn('Course data not loaded yet');
    return [];
  }

  const skillsList = userSkills.toLowerCase().split(',').map(skill => skill.trim());

  // Find courses that match any of the user's skills - exact match with Python implementation
  const matchedCourses = courseData.filter(course => 
    skillsList.some(skill => 
      course.skills?.toLowerCase().includes(skill)
    )
  );

  // Return top N courses with title and instructor
  return matchedCourses
    .slice(0, topN)
    .map(({ title, course_by }) => ({ 
      title, 
      course_by 
    }));
};

export const getCourseRecommendations = async (skills: string) => {
  // If course data hasn't been loaded yet, load it
  if (!courseData.length) {
    await loadCourseData();
  }

  return recommendCourses(skills);
};
