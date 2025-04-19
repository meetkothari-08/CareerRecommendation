import { EngineeringField } from '../types/knowledgeBase';

export const engineeringFields: EngineeringField[] = [
  {
    name: 'Software Engineering',
    description: 'Design, development, and maintenance of software systems and applications',
    subFields: [
      {
        name: 'Full Stack Development',
        description: 'Development of both client-side and server-side applications',
        keySkills: [
          {
            name: 'JavaScript/TypeScript',
            category: 'Technical',
            description: 'Modern web development using JavaScript and TypeScript',
            importance: 'Essential',
            learningResources: [
              {
                title: 'TypeScript Handbook',
                type: 'Documentation',
                provider: 'TypeScript',
                url: 'https://www.typescriptlang.org/docs/',
                duration: 'Self-paced',
                cost: 'Free',
                rating: 4.8,
                difficulty: 'Intermediate'
              },
              {
                title: 'Modern JavaScript Course',
                type: 'Course',
                provider: 'Udemy',
                url: 'https://www.udemy.com/course/modern-javascript/',
                duration: '40 hours',
                cost: '$12.99',
                rating: 4.7,
                difficulty: 'Beginner'
              }
            ]
          },
          {
            name: 'React/Angular/Vue',
            category: 'Technical',
            description: 'Modern frontend frameworks',
            importance: 'Essential',
            learningResources: [
              {
                title: 'React - The Complete Guide',
                type: 'Course',
                provider: 'Udemy',
                url: 'https://www.udemy.com/course/react-the-complete-guide/',
                duration: '48 hours',
                cost: '$12.99',
                rating: 4.8,
                difficulty: 'Intermediate'
              }
            ]
          },
          {
            name: 'Node.js',
            category: 'Technical',
            description: 'Server-side JavaScript runtime',
            importance: 'Essential',
            learningResources: [
              {
                title: 'Node.js Developer Course',
                type: 'Course',
                provider: 'Udemy',
                url: 'https://www.udemy.com/course/nodejs-developer/',
                duration: '35 hours',
                cost: '$12.99',
                rating: 4.7,
                difficulty: 'Intermediate'
              }
            ]
          }
        ],
        roles: [
          {
            title: 'Full Stack Developer',
            description: 'Develop and maintain both frontend and backend applications',
            responsibilities: [
              'Design and implement user interfaces',
              'Develop server-side logic',
              'Manage databases and APIs',
              'Ensure application security and performance'
            ],
            requiredSkills: ['JavaScript', 'HTML/CSS', 'Node.js', 'SQL'],
            preferredSkills: ['TypeScript', 'React', 'Docker', 'AWS'],
            experienceLevel: 'Mid',
            salaryRange: {
              min: 80000,
              max: 150000,
              currency: 'USD'
            },
            careerPath: {
              nextRoles: ['Senior Full Stack Developer', 'Technical Lead', 'Solution Architect'],
              timeToProgress: '2-3 years'
            }
          }
        ],
        toolsAndTechnologies: [
          'VS Code',
          'Git',
          'Docker',
          'AWS/Azure/GCP',
          'MongoDB',
          'PostgreSQL'
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            provider: 'Amazon',
            description: 'Certification for cloud development on AWS',
            difficulty: 'Intermediate',
            duration: '3-6 months',
            cost: '$150',
            validity: '3 years',
            prerequisites: ['Basic cloud knowledge', 'Programming experience'],
            value: 'High'
          }
        ],
        industryDemand: 'High'
      },
      {
        name: 'Mobile Development',
        description: 'Development of mobile applications for iOS and Android',
        keySkills: [
          {
            name: 'Swift/Kotlin',
            category: 'Technical',
            description: 'Native mobile development languages',
            importance: 'Essential',
            learningResources: [
              {
                title: 'iOS & Swift - The Complete Guide',
                type: 'Course',
                provider: 'Udemy',
                url: 'https://www.udemy.com/course/ios-swift/',
                duration: '55 hours',
                cost: '$12.99',
                rating: 4.8,
                difficulty: 'Intermediate'
              }
            ]
          },
          {
            name: 'React Native',
            category: 'Technical',
            description: 'Cross-platform mobile development',
            importance: 'Preferred',
            learningResources: [
              {
                title: 'React Native - The Practical Guide',
                type: 'Course',
                provider: 'Udemy',
                url: 'https://www.udemy.com/course/react-native-guide/',
                duration: '45 hours',
                cost: '$12.99',
                rating: 4.7,
                difficulty: 'Intermediate'
              }
            ]
          }
        ],
        roles: [
          {
            title: 'Mobile Developer',
            description: 'Develop mobile applications for iOS and Android platforms',
            responsibilities: [
              'Design and build mobile applications',
              'Ensure app performance and quality',
              'Implement security measures',
              'Optimize application for performance'
            ],
            requiredSkills: ['Swift or Kotlin', 'Mobile UI Design', 'RESTful APIs'],
            preferredSkills: ['React Native', 'Firebase', 'CI/CD'],
            experienceLevel: 'Mid',
            salaryRange: {
              min: 85000,
              max: 160000,
              currency: 'USD'
            },
            careerPath: {
              nextRoles: ['Senior Mobile Developer', 'Mobile Architect', 'Technical Lead'],
              timeToProgress: '2-3 years'
            }
          }
        ],
        toolsAndTechnologies: [
          'Xcode',
          'Android Studio',
          'Firebase',
          'Git',
          'Jira'
        ],
        certifications: [
          {
            name: 'Google Associate Android Developer',
            provider: 'Google',
            description: 'Entry-level Android development certification',
            difficulty: 'Intermediate',
            duration: '2-4 months',
            cost: '$149',
            validity: 'Lifetime',
            prerequisites: ['Java/Kotlin knowledge', 'Android basics'],
            value: 'High'
          }
        ],
        industryDemand: 'High'
      }
    ],
    requiredEducation: [
      "Bachelor's in Computer Science",
      "Bachelor's in Software Engineering",
      "Related technical degree"
    ],
    averageSalaryRange: {
      entry: '$60,000 - $85,000',
      mid: '$85,000 - $150,000',
      senior: '$150,000 - $250,000+'
    },
    jobOutlook: 'Excellent growth prospects with 22% projected growth through 2030',
    workEnvironments: [
      'Tech Companies',
      'Startups',
      'Consulting Firms',
      'Remote Work',
      'Enterprise Companies'
    ]
  },
  {
    name: 'Data Engineering',
    description: 'Design and implementation of systems for collecting, storing, and analyzing data',
    subFields: [
      {
        name: 'Big Data Engineering',
        description: 'Building and maintaining large-scale data processing systems',
        keySkills: [
          {
            name: 'Apache Spark',
            category: 'Technical',
            description: 'Distributed data processing framework',
            importance: 'Essential',
            learningResources: [
              {
                title: 'Apache Spark with Scala',
                type: 'Course',
                provider: 'Udemy',
                url: 'https://www.udemy.com/course/apache-spark-scala/',
                duration: '35 hours',
                cost: '$12.99',
                rating: 4.6,
                difficulty: 'Advanced'
              }
            ]
          },
          {
            name: 'Python',
            category: 'Technical',
            description: 'Programming language for data processing',
            importance: 'Essential',
            learningResources: [
              {
                title: 'Python for Data Engineering',
                type: 'Course',
                provider: 'DataCamp',
                url: 'https://www.datacamp.com/courses/python-for-data-engineering',
                duration: '20 hours',
                cost: '$25/month',
                rating: 4.7,
                difficulty: 'Intermediate'
              }
            ]
          }
        ],
        roles: [
          {
            title: 'Big Data Engineer',
            description: 'Design and implement large-scale data processing systems',
            responsibilities: [
              'Build data pipelines',
              'Optimize data systems',
              'Implement data warehouses',
              'Ensure data quality and reliability'
            ],
            requiredSkills: ['Spark', 'Python', 'SQL', 'Hadoop'],
            preferredSkills: ['Scala', 'Kafka', 'Airflow', 'Cloud Platforms'],
            experienceLevel: 'Mid',
            salaryRange: {
              min: 100000,
              max: 180000,
              currency: 'USD'
            },
            careerPath: {
              nextRoles: ['Senior Data Engineer', 'Data Architect', 'Technical Lead'],
              timeToProgress: '2-3 years'
            }
          }
        ],
        toolsAndTechnologies: [
          'Apache Spark',
          'Hadoop',
          'Kafka',
          'Airflow',
          'AWS/Azure/GCP'
        ],
        certifications: [
          {
            name: 'Google Cloud Professional Data Engineer',
            provider: 'Google',
            description: 'Certification for data engineering on Google Cloud',
            difficulty: 'Advanced',
            duration: '4-6 months',
            cost: '$200',
            validity: '2 years',
            prerequisites: ['Cloud experience', 'Programming skills'],
            value: 'High'
          }
        ],
        industryDemand: 'High'
      }
    ],
    requiredEducation: [
      "Bachelor's in Computer Science",
      "Bachelor's in Data Science",
      "Master's in Data Engineering"
    ],
    averageSalaryRange: {
      entry: '$70,000 - $95,000',
      mid: '$95,000 - $160,000',
      senior: '$160,000 - $250,000+'
    },
    jobOutlook: 'Very strong growth with increasing demand for data professionals',
    workEnvironments: [
      'Tech Companies',
      'Financial Services',
      'Healthcare',
      'Consulting Firms',
      'Research Organizations'
    ]
  }
]; 