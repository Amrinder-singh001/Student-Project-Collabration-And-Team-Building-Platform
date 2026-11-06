/**
 * Mock data for UI development only.
 * Replaced by real backend data in a later phase.
 */

export type ProjectStatus = "Recruiting" | "In Progress" | "Completed";

export interface ProjectRole {
  title: string;
  skills: string[];
  filled: boolean;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  status: ProjectStatus;
  skills: string[];
  teamSize: number;
  teamFilled: number;
  commitment: string;
  duration: string;
  mode: "Remote" | "On-campus" | "Hybrid";
  college: string;
  createdAt: string;
  applicants: number;
  owner: { name: string; role: string; initials: string };
  roles: ProjectRole[];
  milestones: { label: string; done: boolean }[];
}

export const projects: Project[] = [
  {
    id: "campus-ride-share",
    title: "CampusPool",
    tagline: "Ride sharing for late-night campus commutes",
    description:
      "CampusPool matches students heading in the same direction after evening labs and library sessions. We are building a React Native app with live ride matching, verified college email onboarding and an SOS check-in flow. Looking for teammates who care about safety-first product design.",
    category: "Mobile App",
    status: "Recruiting",
    skills: ["React Native", "Node.js", "PostgreSQL", "UI/UX", "Maps API"],
    teamSize: 5,
    teamFilled: 3,
    commitment: "8-10 hrs / week",
    duration: "4 months",
    mode: "Hybrid",
    college: "Punjab Engineering College",
    createdAt: "3 days ago",
    applicants: 14,
    owner: { name: "Ananya Rao", role: "CSE, 3rd Year", initials: "AR" },
    roles: [
      { title: "Mobile Developer", skills: ["React Native", "TypeScript"], filled: false },
      { title: "Backend Engineer", skills: ["Node.js", "PostgreSQL"], filled: true },
      { title: "Product Designer", skills: ["Figma", "UI/UX"], filled: false },
    ],
    milestones: [
      { label: "Idea validation & campus survey", done: true },
      { label: "Wireframes and design system", done: true },
      { label: "Ride matching MVP", done: false },
      { label: "Pilot with 200 students", done: false },
    ],
  },
  {
    id: "notesnest-ai",
    title: "NotesNest AI",
    tagline: "Turn messy lecture notes into structured study guides",
    description:
      "An AI study companion that ingests handwritten notes and lecture slides, then generates summaries, flashcards and practice quizzes. The core pipeline is done; we now need a front-end teammate and someone who enjoys prompt evaluation.",
    category: "AI / ML",
    status: "Recruiting",
    skills: ["Python", "LLMs", "React", "FastAPI", "Prompt Engineering"],
    teamSize: 4,
    teamFilled: 2,
    commitment: "6-8 hrs / week",
    duration: "3 months",
    mode: "Remote",
    college: "IIIT Hyderabad",
    createdAt: "1 week ago",
    applicants: 27,
    owner: { name: "Kabir Menon", role: "ECE, 4th Year", initials: "KM" },
    roles: [
      { title: "Frontend Developer", skills: ["React", "Tailwind"], filled: false },
      { title: "ML Engineer", skills: ["Python", "LLMs"], filled: true },
      { title: "QA & Evaluation", skills: ["Prompt Engineering"], filled: false },
    ],
    milestones: [
      { label: "OCR ingestion pipeline", done: true },
      { label: "Summary + flashcard generation", done: true },
      { label: "Student-facing web app", done: false },
      { label: "Campus beta launch", done: false },
    ],
  },
  {
    id: "greenprint",
    title: "GreenPrint",
    tagline: "Measure and cut your hostel's energy footprint",
    description:
      "IoT sensors plus a dashboard that shows real-time electricity usage per hostel block, with weekly leaderboards to nudge students toward lower consumption. Hardware prototype exists; we need dashboard and data-viz help.",
    category: "IoT / Hardware",
    status: "In Progress",
    skills: ["Arduino", "MQTT", "React", "D3.js", "Data Analysis"],
    teamSize: 6,
    teamFilled: 5,
    commitment: "5 hrs / week",
    duration: "6 months",
    mode: "On-campus",
    college: "NIT Trichy",
    createdAt: "2 weeks ago",
    applicants: 9,
    owner: { name: "Sara Fernandes", role: "EEE, 2nd Year", initials: "SF" },
    roles: [
      { title: "Data Visualisation Dev", skills: ["D3.js", "React"], filled: false },
      { title: "Firmware Developer", skills: ["Arduino", "MQTT"], filled: true },
    ],
    milestones: [
      { label: "Sensor prototype", done: true },
      { label: "Data ingestion service", done: true },
      { label: "Block leaderboard dashboard", done: false },
      { label: "Deployment across 4 hostels", done: false },
    ],
  },
  {
    id: "internhub",
    title: "InternHub",
    tagline: "A verified internship board built by students, for students",
    description:
      "Scrapes and verifies internship listings, flags scam postings and lets seniors leave honest reviews of the companies they interned at. Looking for a backend teammate and a content/community lead.",
    category: "Web App",
    status: "Recruiting",
    skills: ["Next.js", "TypeScript", "Web Scraping", "Community"],
    teamSize: 4,
    teamFilled: 1,
    commitment: "4-6 hrs / week",
    duration: "3 months",
    mode: "Remote",
    college: "Delhi Technological University",
    createdAt: "5 days ago",
    applicants: 18,
    owner: { name: "Rahul Iyer", role: "IT, 3rd Year", initials: "RI" },
    roles: [
      { title: "Backend Developer", skills: ["Node.js", "Scraping"], filled: false },
      { title: "Community Lead", skills: ["Content", "Community"], filled: false },
    ],
    milestones: [
      { label: "Listing scraper", done: true },
      { label: "Verification workflow", done: false },
      { label: "Review system", done: false },
    ],
  },
  {
    id: "sign-sense",
    title: "SignSense",
    tagline: "Real-time sign language translation on the browser",
    description:
      "A webcam-based sign language recogniser running fully on-device with TensorFlow.js, aimed at making campus events more accessible. We have a working model for 40 signs and want to expand the vocabulary.",
    category: "AI / ML",
    status: "In Progress",
    skills: ["TensorFlow.js", "Computer Vision", "React", "Accessibility"],
    teamSize: 5,
    teamFilled: 4,
    commitment: "7 hrs / week",
    duration: "5 months",
    mode: "Hybrid",
    college: "VIT Vellore",
    createdAt: "3 weeks ago",
    applicants: 22,
    owner: { name: "Meera Joshi", role: "CSE, 4th Year", initials: "MJ" },
    roles: [
      { title: "ML Engineer", skills: ["Computer Vision"], filled: true },
      { title: "Accessibility Researcher", skills: ["Accessibility"], filled: false },
    ],
    milestones: [
      { label: "Dataset collection", done: true },
      { label: "Baseline model (40 signs)", done: true },
      { label: "Vocabulary expansion", done: false },
      { label: "Public demo", done: false },
    ],
  },
  {
    id: "hackdeck",
    title: "HackDeck",
    tagline: "Pitch decks that build themselves during a hackathon",
    description:
      "A tool that watches your repo activity and drafts a judge-ready pitch deck with architecture diagrams, commit highlights and a demo script. Built at a 36-hour hackathon, now being cleaned up for a public release.",
    category: "Developer Tools",
    status: "Completed",
    skills: ["React", "GitHub API", "Design", "Storytelling"],
    teamSize: 3,
    teamFilled: 3,
    commitment: "Wrapped up",
    duration: "6 weeks",
    mode: "Remote",
    college: "BITS Pilani",
    createdAt: "2 months ago",
    applicants: 6,
    owner: { name: "Devansh Kapoor", role: "CSE, 4th Year", initials: "DK" },
    roles: [
      { title: "Frontend Developer", skills: ["React"], filled: true },
      { title: "Designer", skills: ["Design"], filled: true },
    ],
    milestones: [
      { label: "Hackathon prototype", done: true },
      { label: "Repo analysis engine", done: true },
      { label: "Public release", done: true },
    ],
  },
];

export const categories = [
  "All categories",
  "Web App",
  "Mobile App",
  "AI / ML",
  "IoT / Hardware",
  "Developer Tools",
];

export const skillFilters = [
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "UI/UX",
  "Figma",
  "Machine Learning",
  "Flutter",
  "PostgreSQL",
  "Data Analysis",
];

export const currentStudent = {
  name: "Amrinder Singh",
  initials: "AS",
  headline: "Full-stack developer & product tinkerer",
  college: "Chandigarh University",
  branch: "Computer Science Engineering",
  year: "3rd Year",
  location: "Chandigarh, India",
  availability: "10 hrs / week",
  bio: "I like building products that solve small, annoying campus problems. Currently deep into TypeScript, distributed systems and design systems. Looking for a team to ship something real before graduation.",
  skills: [
    { name: "React", level: "Advanced" },
    { name: "TypeScript", level: "Advanced" },
    { name: "Node.js", level: "Intermediate" },
    { name: "PostgreSQL", level: "Intermediate" },
    { name: "Figma", level: "Intermediate" },
    { name: "Python", level: "Beginner" },
  ],
  interests: ["EdTech", "Developer Tools", "Open Source", "Accessibility"],
  stats: [
    { label: "Projects joined", value: "5" },
    { label: "Teams led", value: "2" },
    { label: "Applications", value: "11" },
    { label: "Profile strength", value: "82%" },
  ],
  experience: [
    {
      title: "Frontend Intern",
      org: "Nimbus Labs",
      period: "May 2026 - Jul 2026",
      detail: "Shipped a design-system refresh used across three internal dashboards.",
    },
    {
      title: "Core Team, Coding Club",
      org: "Chandigarh University",
      period: "2025 - Present",
      detail: "Ran weekly build sessions and mentored 40+ first-year students.",
    },
  ],
};

export const dashboardActivity = [
  { text: "Ananya Rao invited you to CampusPool", time: "2h ago", type: "invite" as const },
  { text: "Your application to NotesNest AI was viewed", time: "6h ago", type: "view" as const },
  { text: "New milestone added on GreenPrint", time: "1d ago", type: "update" as const },
  { text: "Rahul Iyer commented on your profile", time: "2d ago", type: "comment" as const },
];

export const suggestedTeammates = [
  { name: "Nikhil Verma", initials: "NV", role: "Backend, 3rd Year", skills: ["Node.js", "Go"], match: 94 },
  { name: "Priya Nair", initials: "PN", role: "Designer, 2nd Year", skills: ["Figma", "UI/UX"], match: 89 },
  { name: "Aditya Bose", initials: "AB", role: "ML, 4th Year", skills: ["Python", "PyTorch"], match: 85 },
];
