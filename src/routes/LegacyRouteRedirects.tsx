import { Navigate, useParams } from 'react-router-dom';

export function LegacyApplicantRedirect() {
  const { applicantId = '' } = useParams();
  return <Navigate to={applicantId ? `/admissions/applications/${applicantId}` : '/admissions/applications'} replace />;
}

export function LegacyStudentRedirect() {
  const { studentId = '' } = useParams();
  return <Navigate to={studentId ? `/students/records/${studentId}` : '/students/records'} replace />;
}

export function LegacyHostelRedirect() {
  const { hostelId = '' } = useParams();
  return <Navigate to={hostelId ? `/hostels/overview/${hostelId}` : '/hostels/overview'} replace />;
}
