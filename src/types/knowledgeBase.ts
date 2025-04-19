export interface EngineeringField {
  name: string;
  description: string;
  subFields: EngineeringSubField[];
  requiredEducation: string[];
  averageSalaryRange: {
    entry: string;
    mid: string;
    senior: string;
  };
  jobOutlook: string;
  workEnvironments: string[];
}

export interface EngineeringSubField {
  name: string;
  description: string;
  keySkills: Skill[];
  roles: CareerRole[];
  toolsAndTechnologies: string[];
  certifications: Certification[];
  industryDemand: 'High' | 'Medium' | 'Low';
}

export interface Skill {
  name: string;
  category: 'Technical' | 'Soft' | 'Domain';
  description: string;
  importance: 'Essential' | 'Preferred' | 'Optional';
  learningResources: LearningResource[];
}

export interface CareerRole {
  title: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: 'Entry' | 'Mid' | 'Senior';
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  careerPath: {
    nextRoles: string[];
    timeToProgress: string;
  };
}

export interface Certification {
  name: string;
  provider: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  cost: string;
  validity: string;
  prerequisites: string[];
  value: 'High' | 'Medium' | 'Low';
}

export interface LearningResource {
  title: string;
  type: 'Course' | 'Book' | 'Tutorial' | 'Documentation' | 'Video' | 'Website';
  provider: string;
  url: string;
  duration: string;
  cost: string;
  rating: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface CareerQuestion {
  id: string;
  question: string;
  category: 'Skills' | 'Education' | 'Career Path' | 'Industry' | 'Job Search' | 'General';
  answer: string;
  relatedQuestions: string[];
  keywords: string[];
} 