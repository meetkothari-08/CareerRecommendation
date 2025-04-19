import { CareerQuestion } from '../types/knowledgeBase';

export const commonQuestions: CareerQuestion[] = [
  {
    id: '1',
    question: 'What programming languages should I learn first for software engineering?',
    category: 'Skills',
    answer: `For beginners in software engineering, I recommend starting with:

1. Python
   - Easy to learn and read
   - Great for understanding programming concepts
   - Widely used in various domains

2. JavaScript
   - Essential for web development
   - Huge job market demand
   - Versatile (frontend, backend, mobile)

3. Java
   - Strong foundation in object-oriented programming
   - Enterprise-level applications
   - Android development

Choose based on your interests:
- Web Development → JavaScript/TypeScript
- Mobile Apps → Swift (iOS) or Kotlin (Android)
- Data Science → Python
- Enterprise → Java or C#`,
    relatedQuestions: [
      'What are the best resources to learn programming?',
      'How long does it take to become a software engineer?',
      'Which certifications are valuable for software engineers?'
    ],
    keywords: ['programming', 'languages', 'learn', 'software', 'beginner']
  },
  {
    id: '2',
    question: 'How do I transition from another field into software engineering?',
    category: 'Career Path',
    answer: `Here's a structured path to transition into software engineering:

1. Build Foundation (3-6 months)
   - Learn programming basics (Python/JavaScript)
   - Understand computer science fundamentals
   - Take online courses (Coursera, Udemy)

2. Choose Specialization (1-2 months)
   - Web Development
   - Mobile Development
   - Data Engineering
   - Cloud Computing

3. Practical Experience (3-6 months)
   - Build personal projects
   - Contribute to open source
   - Create portfolio

4. Job Preparation (2-3 months)
   - Resume optimization
   - Interview preparation
   - Network with professionals
   - Consider bootcamps

5. Entry Points
   - Junior Developer roles
   - Internships
   - Apprenticeships
   - Contract work

Total Timeline: 8-17 months depending on dedication and prior experience.`,
    relatedQuestions: [
      'Which bootcamps are best for career changers?',
      'Do I need a computer science degree?',
      'How to build a portfolio?'
    ],
    keywords: ['career change', 'transition', 'switch careers', 'begin', 'start']
  },
  {
    id: '3',
    question: 'What are the highest paying engineering fields?',
    category: 'Career Path',
    answer: `Here are the top-paying engineering fields with median salaries:

1. Software Engineering (Cloud/AI)
   - Senior: $150,000 - $250,000+
   - Architect: $180,000 - $300,000+

2. Data Engineering
   - Senior: $160,000 - $250,000+
   - Lead: $180,000 - $270,000+

3. Machine Learning Engineering
   - Senior: $150,000 - $270,000+
   - Research: $180,000 - $300,000+

4. DevOps/SRE
   - Senior: $140,000 - $230,000+
   - Lead: $160,000 - $250,000+

Factors affecting salary:
- Location (Silicon Valley pays highest)
- Company size and type
- Experience level
- Specialized skills
- Education/certifications`,
    relatedQuestions: [
      'Which companies pay the highest salaries?',
      'What skills are needed for high-paying roles?',
      'How to negotiate salary in tech?'
    ],
    keywords: ['salary', 'pay', 'money', 'compensation', 'highest paying']
  },
  {
    id: '4',
    question: 'What skills are most in-demand for engineers in 2024?',
    category: 'Skills',
    answer: `Top in-demand engineering skills for 2024:

1. Technical Skills
   - Cloud Computing (AWS, Azure, GCP)
   - AI/Machine Learning
   - DevOps/GitOps
   - Containerization (Docker, Kubernetes)
   - Full Stack Development
   - Data Engineering
   - Cybersecurity

2. Programming Languages
   - Python
   - JavaScript/TypeScript
   - Go
   - Rust
   - Java
   - C++

3. Soft Skills
   - Problem-solving
   - Communication
   - Agile methodologies
   - Team collaboration
   - Project management

4. Emerging Technologies
   - Generative AI
   - Web3/Blockchain
   - Edge Computing
   - Quantum Computing
   - Green Tech`,
    relatedQuestions: [
      'How to learn cloud computing?',
      'Best AI/ML learning resources?',
      'Which certifications are most valuable?'
    ],
    keywords: ['skills', 'demand', 'trending', 'popular', 'required']
  },
  {
    id: '5',
    question: 'What are the best resources for learning engineering skills?',
    category: 'Education',
    answer: `Here are the best resources by category:

1. Online Platforms
   - Coursera: University-quality courses
   - Udemy: Practical, project-based learning
   - PluralSight: In-depth technical training
   - freeCodeCamp: Free, comprehensive curriculum

2. Documentation & Tutorials
   - MDN Web Docs: Web development
   - Python.org: Python programming
   - Kubernetes.io: Container orchestration
   - AWS Documentation: Cloud computing

3. Interactive Learning
   - LeetCode: Programming practice
   - HackerRank: Coding challenges
   - Codecademy: Interactive tutorials
   - Katacoda: Hands-on labs

4. Books & Blogs
   - O'Reilly Learning
   - Medium Engineering blogs
   - Company engineering blogs
   - GitHub documentation

5. Communities
   - Stack Overflow
   - Dev.to
   - Reddit (r/programming, etc.)
   - Discord developer communities`,
    relatedQuestions: [
      'Which Coursera courses are best?',
      'How to practice coding effectively?',
      'Best YouTube channels for engineers?'
    ],
    keywords: ['learn', 'study', 'resources', 'courses', 'training']
  }
]; 