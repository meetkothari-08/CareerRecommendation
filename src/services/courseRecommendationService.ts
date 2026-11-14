import Papa from 'papaparse';

interface Course {
  title: string;
  course_by: string;
  skills: string;
}

let coursePromise: Promise<Course[]> | null = null;

async function loadCourses(): Promise<Course[]> {
  if (!coursePromise) {
    coursePromise = fetch('/data/coursera.csv')
      .then(response => {
        if (!response.ok) throw new Error('Unable to load the course catalog');
        return response.text();
      })
      .then(csv => Papa.parse<Course>(csv, {header: true, skipEmptyLines: true}).data)
      .catch(error => {
        coursePromise = null;
        console.error('Course catalog unavailable:', error);
        return [];
      });
  }
  return coursePromise;
}

/** Basic skill-keyword matching, not a trained recommendation model. */
export async function getCourseRecommendations(skills: string, topN = 3): Promise<Pick<Course, 'title' | 'course_by'>[]> {
  const terms = skills.toLowerCase().split(',').map(term => term.trim()).filter(Boolean);
  if (terms.length === 0) return [];
  const courses = await loadCourses();
  return courses
    .filter(course => terms.some(term => course.skills?.toLowerCase().includes(term)))
    .slice(0, Math.max(0, topN))
    .map(({title, course_by}) => ({title, course_by}));
}
