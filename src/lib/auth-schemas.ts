import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(80),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    college: z.string().trim().min(2, "College / University is required").max(120),
    course: z.string().trim().min(2, "Course is required").max(120),
    semester: z.string().min(1, "Select your semester"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the code of conduct" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const colleges = [
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "NIT Trichy",
  "NIT Warangal",
  "NIT Surathkal",
  "BITS Pilani",
  "IIIT Hyderabad",
  "Delhi Technological University",
  "VIT Vellore",
  "SRM Institute of Science and Technology",
  "Manipal Institute of Technology",
  "Anna University",
  "Jadavpur University",
  "University of Mumbai",
  "University of Delhi",
  "Amity University",
  "Lovely Professional University",
  "Chandigarh University",
  "Rayat Bahra University Mohali",
  "Other",
] as const;

export const courses = [
  "B.Tech Computer Science",
  "B.Tech Information Technology",
  "B.Tech Electronics & Communication",
  "B.Tech Electrical Engineering",
  "B.Tech Mechanical Engineering",
  "B.Tech Civil Engineering",
  "BCA (Bachelor of Computer Applications)",
  "B.Sc Computer Science",
  "B.Sc Data Science",
  "BBA (Bachelor of Business Administration)",
  "B.Com (Bachelor of Commerce)",
  "BA (Bachelor of Arts)",
  "B.Des (Bachelor of Design)",
  "MCA (Master of Computer Applications)",
  "M.Tech",
  "M.Sc",
  "MBA",
  "Other",
] as const;

export const semesters = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
] as const;
