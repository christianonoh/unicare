import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  GraduationCap,
  Wallet,
  Hotel,
  BookOpen,
  Award,
  BarChart3,
  Shield,
  Settings,
} from 'lucide-react';

export interface NavChildItem {
  id: string;
  label: string;
  to: string;
  matchPrefix?: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: ReactNode;
  basePath: string;
  items: NavChildItem[];
}

const ICON_SIZE = 16;

export const navSections: NavSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={ICON_SIZE} />,
    basePath: '/dashboard',
    items: [{ id: 'overview', label: 'Overview', to: '/dashboard/overview' }],
  },
  {
    id: 'academic-structure',
    label: 'Academic Structure',
    icon: <Building2 size={ICON_SIZE} />,
    basePath: '/academic-structure',
    items: [
      { id: 'faculties', label: 'Faculties', to: '/academic-structure/faculties' },
      { id: 'departments', label: 'Departments', to: '/academic-structure/departments' },
      { id: 'programmes', label: 'Programmes', to: '/academic-structure/programmes' },
      { id: 'sessions', label: 'Sessions & Semesters', to: '/academic-structure/sessions' },
      { id: 'courses', label: 'Course Catalog', to: '/academic-structure/courses' },
    ],
  },
  {
    id: 'admissions',
    label: 'Admissions',
    icon: <ClipboardList size={ICON_SIZE} />,
    basePath: '/admissions',
    items: [
      { id: 'applications', label: 'Applications', to: '/admissions/applications', matchPrefix: '/admissions/applications' },
      { id: 'clearance', label: 'Clearance', to: '/admissions/clearance' },
    ],
  },
  {
    id: 'students',
    label: 'Students',
    icon: <GraduationCap size={ICON_SIZE} />,
    basePath: '/students',
    items: [
      { id: 'records', label: 'Records', to: '/students/records', matchPrefix: '/students/records' },
      { id: 'standing', label: 'Academic Standing', to: '/students/standing' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <Wallet size={ICON_SIZE} />,
    basePath: '/finance',
    items: [
      { id: 'templates', label: 'Fee Templates', to: '/finance/templates' },
      { id: 'invoices', label: 'Invoices', to: '/finance/invoices', matchPrefix: '/finance/invoices' },
      { id: 'payments', label: 'Payments', to: '/finance/payments' },
      { id: 'holds', label: 'Registration Holds', to: '/finance/holds' },
    ],
  },
  {
    id: 'hostels',
    label: 'Hostels',
    icon: <Hotel size={ICON_SIZE} />,
    basePath: '/hostels',
    items: [
      { id: 'overview', label: 'Overview', to: '/hostels/overview', matchPrefix: '/hostels/overview' },
      { id: 'allocation', label: 'Allocation', to: '/hostels/allocation' },
    ],
  },
  {
    id: 'course-registration',
    label: 'Course Registration',
    icon: <BookOpen size={ICON_SIZE} />,
    basePath: '/course-registration',
    items: [
      { id: 'queue', label: 'Registration Queue', to: '/course-registration/queue' },
      { id: 'approved', label: 'Approved Registrations', to: '/course-registration/approved' },
      { id: 'held', label: 'Held Cases', to: '/course-registration/held' },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    icon: <Award size={ICON_SIZE} />,
    basePath: '/results',
    items: [
      { id: 'score-entry', label: 'Score Entry', to: '/results/score-entry' },
      { id: 'approval', label: 'Approval Queue', to: '/results/approval' },
      { id: 'departments', label: 'Department Summaries', to: '/results/departments' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 size={ICON_SIZE} />,
    basePath: '/reports',
    items: [
      { id: 'admissions', label: 'Admissions Reports', to: '/reports/admissions' },
      { id: 'registration', label: 'Registration Reports', to: '/reports/registration' },
      { id: 'finance', label: 'Finance Reports', to: '/reports/finance' },
      { id: 'results', label: 'Result Reports', to: '/reports/results' },
    ],
  },
  {
    id: 'access',
    label: 'Access Control',
    icon: <Shield size={ICON_SIZE} />,
    basePath: '/access',
    items: [
      { id: 'users', label: 'Users', to: '/access/users' },
      { id: 'roles', label: 'Roles', to: '/access/roles' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={ICON_SIZE} />,
    basePath: '/settings',
    items: [
      { id: 'institution', label: 'Institution Profile', to: '/settings/institution' },
      { id: 'policy', label: 'Academic Policy', to: '/settings/policy' },
    ],
  },
];

export function getActiveSection(pathname: string) {
  return navSections.find((section) => pathname.startsWith(section.basePath)) ?? navSections[0];
}

export function getActiveChild(pathname: string) {
  for (const section of navSections) {
    const child = section.items.find((item) => pathname.startsWith(item.matchPrefix ?? item.to));
    if (child) {
      return { section, child };
    }
  }

  return { section: navSections[0], child: navSections[0].items[0] };
}
