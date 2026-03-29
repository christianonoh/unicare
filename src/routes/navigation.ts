export interface NavChildItem {
  id: string;
  label: string;
  to: string;
  matchPrefix?: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: string;
  basePath: string;
  items: NavChildItem[];
}

export const navSections: NavSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'DB',
    basePath: '/dashboard',
    items: [{ id: 'overview', label: 'Overview', to: '/dashboard/overview' }],
  },
  {
    id: 'academic-structure',
    label: 'Academic Structure',
    icon: 'AS',
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
    id: 'registry',
    label: 'Registry',
    icon: 'RG',
    basePath: '/registry',
    items: [
      { id: 'applicants', label: 'Applicants', to: '/registry/applicants', matchPrefix: '/registry/applicants' },
      { id: 'offers', label: 'Admission Offers', to: '/registry/offers' },
      { id: 'clearance', label: 'Clearance Queue', to: '/registry/clearance' },
    ],
  },
  {
    id: 'students',
    label: 'Students',
    icon: 'ST',
    basePath: '/students',
    items: [
      { id: 'directory', label: 'Student Directory', to: '/students/directory' },
      { id: 'profiles', label: 'Student Profiles', to: '/students/profiles', matchPrefix: '/students/profiles' },
      { id: 'standing', label: 'Academic Standing', to: '/students/standing' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'FN',
    basePath: '/finance',
    items: [
      { id: 'templates', label: 'Fee Templates', to: '/finance/templates' },
      { id: 'invoices', label: 'Invoices', to: '/finance/invoices', matchPrefix: '/finance/invoices' },
      { id: 'payments', label: 'Payments', to: '/finance/payments' },
      { id: 'holds', label: 'Registration Holds', to: '/finance/holds' },
    ],
  },
  {
    id: 'course-registration',
    label: 'Course Registration',
    icon: 'CR',
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
    icon: 'RS',
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
    icon: 'RP',
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
    icon: 'AC',
    basePath: '/access',
    items: [
      { id: 'users', label: 'Users', to: '/access/users' },
      { id: 'roles', label: 'Roles', to: '/access/roles' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'SE',
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
