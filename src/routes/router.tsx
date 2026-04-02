import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AcademicStructurePage } from '../modules/academic-structure/AcademicStructurePage';
import { AdmissionsPage } from '../modules/admissions/AdmissionsPage';
import { ApplicantDetailPage } from '../modules/admissions/ApplicantDetailPage';
import { CourseRegistrationPage } from '../modules/course-registration/CourseRegistrationPage';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { FinancePage } from '../modules/finance/FinancePage';
import { HostelDetailPage } from '../modules/hostels/HostelDetailPage';
import { HostelsPage } from '../modules/hostels/HostelsPage';
import { InvoiceDetailPage } from '../modules/finance/InvoiceDetailPage';
import { ReportsPage } from '../modules/reports/ReportsPage';
import { ResultsPage } from '../modules/results/ResultsPage';
import { SettingsPage } from '../modules/settings/SettingsPage';
import { StudentDetailPage } from '../modules/students/StudentDetailPage';
import { StudentsPage } from '../modules/students/StudentsPage';
import { UsersPage } from '../modules/users/UsersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard/overview" replace /> },
      { path: '/dashboard', element: <Navigate to="/dashboard/overview" replace /> },
      { path: '/dashboard/overview', element: <DashboardPage /> },

      { path: '/academic-structure', element: <Navigate to="/academic-structure/faculties" replace /> },
      { path: '/academic-structure/faculties', element: <AcademicStructurePage view="faculties" /> },
      { path: '/academic-structure/departments', element: <AcademicStructurePage view="departments" /> },
      { path: '/academic-structure/programmes', element: <AcademicStructurePage view="programmes" /> },
      { path: '/academic-structure/sessions', element: <AcademicStructurePage view="sessions" /> },
      { path: '/academic-structure/courses', element: <AcademicStructurePage view="courses" /> },

      { path: '/registry', element: <Navigate to="/registry/applicants" replace /> },
      { path: '/registry/applicants', element: <AdmissionsPage view="applicants" /> },
      { path: '/registry/applicants/:applicantId', element: <ApplicantDetailPage /> },
      { path: '/registry/offers', element: <AdmissionsPage view="offers" /> },
      { path: '/registry/clearance', element: <AdmissionsPage view="clearance" /> },

      { path: '/students', element: <Navigate to="/students/directory" replace /> },
      { path: '/students/directory', element: <StudentsPage view="directory" /> },
      { path: '/students/profiles', element: <StudentsPage view="profiles" /> },
      { path: '/students/profiles/:studentId', element: <StudentDetailPage /> },
      { path: '/students/standing', element: <StudentsPage view="standing" /> },

      { path: '/finance', element: <Navigate to="/finance/templates" replace /> },
      { path: '/finance/templates', element: <FinancePage view="templates" /> },
      { path: '/finance/invoices', element: <FinancePage view="invoices" /> },
      { path: '/finance/invoices/:invoiceId', element: <InvoiceDetailPage /> },
      { path: '/finance/payments', element: <FinancePage view="payments" /> },
      { path: '/finance/holds', element: <FinancePage view="holds" /> },

      { path: '/hostels', element: <Navigate to="/hostels/directory" replace /> },
      { path: '/hostels/directory', element: <HostelsPage view="directory" /> },
      { path: '/hostels/directory/:hostelId', element: <HostelDetailPage /> },
      { path: '/hostels/assignments', element: <HostelsPage view="assignments" /> },
      { path: '/hostels/vacancies', element: <HostelsPage view="vacancies" /> },

      { path: '/course-registration', element: <Navigate to="/course-registration/queue" replace /> },
      { path: '/course-registration/queue', element: <CourseRegistrationPage view="queue" /> },
      { path: '/course-registration/approved', element: <CourseRegistrationPage view="approved" /> },
      { path: '/course-registration/held', element: <CourseRegistrationPage view="held" /> },

      { path: '/results', element: <Navigate to="/results/score-entry" replace /> },
      { path: '/results/score-entry', element: <ResultsPage view="score-entry" /> },
      { path: '/results/approval', element: <ResultsPage view="approval" /> },
      { path: '/results/departments', element: <ResultsPage view="departments" /> },

      { path: '/reports', element: <Navigate to="/reports/admissions" replace /> },
      { path: '/reports/admissions', element: <ReportsPage view="admissions" /> },
      { path: '/reports/registration', element: <ReportsPage view="registration" /> },
      { path: '/reports/finance', element: <ReportsPage view="finance" /> },
      { path: '/reports/results', element: <ReportsPage view="results" /> },

      { path: '/access', element: <Navigate to="/access/users" replace /> },
      { path: '/access/users', element: <UsersPage view="users" /> },
      { path: '/access/roles', element: <UsersPage view="roles" /> },

      { path: '/settings', element: <Navigate to="/settings/institution" replace /> },
      { path: '/settings/institution', element: <SettingsPage view="institution" /> },
      { path: '/settings/policy', element: <SettingsPage view="policy" /> },
    ],
  },
]);
