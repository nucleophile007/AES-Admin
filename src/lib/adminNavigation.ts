import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  Calendar,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  FileText,
  FlaskConical,
  GraduationCap,
  Heart,
  MessageSquare,
  MessageSquareQuote,
  Receipt,
  ShieldCheck,
  UserCircle,
  Users,
  Video,
} from "lucide-react";

/**
 * Single source of truth for every admin module.
 * The dashboard renders from this list; a future sidebar can reuse it.
 */

export type ModuleTone = "brand" | "emerald" | "violet" | "amber" | "slate";

export type AdminModule = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tag: string;
  /** Plain <a> instead of client-side navigation (API routes, downloads). */
  external?: boolean;
  /** Extra search terms that aren't in the title/description. */
  keywords?: string[];
};

export type AdminModuleGroup = {
  id: string;
  title: string;
  description: string;
  tone: ModuleTone;
  modules: AdminModule[];
};

export const ADMIN_MODULE_GROUPS: AdminModuleGroup[] = [
  {
    id: "scheduling",
    title: "Sessions & Scheduling",
    description: "Approvals, availability and day-to-day coordination",
    tone: "brand",
    modules: [
      {
        id: "session-approval",
        title: "Session Approval",
        description: "View and approve incoming session requests",
        href: "/admin/session-approval",
        icon: Users,
        tag: "High priority",
        keywords: ["webinar", "booking", "request"],
      },
      {
        id: "availability",
        title: "Manage Availability",
        description: "Set available time slots for all programs",
        href: "/admin/availability",
        icon: CalendarClock,
        tag: "Scheduling",
        keywords: ["slots", "time"],
      },
      {
        id: "mentor-calendar",
        title: "Mentor Calendar",
        description: "Every mentor's free slots, booking requests and approved sessions",
        href: "/admin/mentor-calendar",
        icon: CalendarDays,
        tag: "Scheduling",
        keywords: ["bookings", "slots"],
      },
      {
        id: "tasks",
        title: "Task Management",
        description: "Assign tasks to students, mentors and parents and review their work",
        href: "/admin/tasks",
        icon: CheckSquare,
        tag: "Tasks",
        keywords: ["todo", "assign"],
      },
    ],
  },
  {
    id: "people",
    title: "People & Access",
    description: "Accounts, activations and program enrollments",
    tone: "emerald",
    modules: [
      {
        id: "students",
        title: "Students",
        description: "Manage student accounts and activations",
        href: "/admin/students",
        icon: GraduationCap,
        tag: "Student hub",
      },
      {
        id: "parents",
        title: "Parents",
        description: "Edit parent details and resend activation links",
        href: "/admin/parents",
        icon: Heart,
        tag: "Parent hub",
      },
      {
        id: "teachers",
        title: "Teachers",
        description: "Manage teacher accounts and their programs",
        href: "/admin/teachers",
        icon: UserCircle,
        tag: "Mentors",
        keywords: ["mentor"],
      },
      {
        id: "enrollments",
        title: "Enrollments",
        description: "Manage student enrollments and program access",
        href: "/admin/enrollments",
        icon: BookOpen,
        tag: "Access control",
      },
    ],
  },
  {
    id: "content",
    title: "Content & Social Proof",
    description: "Everything that appears on the public website",
    tone: "violet",
    modules: [
      {
        id: "testimonials",
        title: "Testimonials",
        description: "Review and approve student testimonials",
        href: "/admin/testimonials",
        icon: MessageSquareQuote,
        tag: "Social proof",
      },
      {
        id: "video-testimonials",
        title: "Video Testimonials",
        description: "Upload videos shown first on the testimonials page",
        href: "/admin/video-testimonials",
        icon: Video,
        tag: "Social proof",
      },
      {
        id: "blogs",
        title: "Student Blogs",
        description: "Manage student blog posts and publications",
        href: "/admin/blogs",
        icon: FileText,
        tag: "Publications",
      },
      {
        id: "mentors",
        title: "Mentor Profiles",
        description: "Manage public mentor profiles and information",
        href: "/admin/mentors",
        icon: Award,
        tag: "Featured content",
      },
      {
        id: "research",
        title: "Research",
        description: "View, edit and publish research papers",
        href: "/admin/research",
        icon: FlaskConical,
        tag: "Research CMS",
        keywords: ["papers"],
      },
      {
        id: "events",
        title: "Events",
        description: "Create, edit and publish events",
        href: "/admin/events",
        icon: Calendar,
        tag: "Events hub",
      },
    ],
  },
  {
    id: "operations",
    title: "Finance & Operations",
    description: "Payments, parent engagement and system tools",
    tone: "amber",
    modules: [
      {
        id: "transaction-receipts",
        title: "Transaction Receipts",
        description: "Review and verify payment receipts",
        href: "/admin/transaction-receipts",
        icon: Receipt,
        tag: "Finance",
        keywords: ["payments"],
      },
      {
        id: "feedback",
        title: "Parent Feedback",
        description: "Review and respond to parent feedback",
        href: "/admin/feedback",
        icon: MessageSquare,
        tag: "Engagement",
      },
      {
        id: "backup",
        title: "Control Center",
        description: "Download an authenticated SQL backup of the database",
        href: "/api/admin/backup",
        icon: ShieldCheck,
        tag: "Protected backup",
        external: true,
        keywords: ["backup", "sql", "download", "database"],
      },
    ],
  },
];
