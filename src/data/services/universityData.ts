import { universitySeed } from '../seeds/university';
import type { DashboardSummary } from '../../types/domain';

const facultyMap = new Map(universitySeed.faculties.map((item) => [item.id, item]));
const departmentMap = new Map(universitySeed.departments.map((item) => [item.id, item]));
const programmeMap = new Map(universitySeed.programmes.map((item) => [item.id, item]));
const userMap = new Map(universitySeed.users.map((item) => [item.id, item]));
const courseMap = new Map(universitySeed.courses.map((item) => [item.id, item]));
const roleMap = new Map(universitySeed.roles.map((item) => [item.id, item]));

function facultyName(facultyId: string) {
  return facultyMap.get(facultyId)?.name ?? 'Unknown Faculty';
}

function departmentName(departmentId: string) {
  return departmentMap.get(departmentId)?.name ?? 'Unknown Department';
}

function programmeName(programmeId: string) {
  return programmeMap.get(programmeId)?.name ?? 'Unknown Programme';
}

export function getReferenceData() {
  return universitySeed;
}

export function getDashboardSummary(): DashboardSummary {
  return {
    totalStudents: universitySeed.students.length,
    activeApplicants: universitySeed.applicants.filter((item) => item.admissionStatus !== 'declined').length,
    clearancePending: universitySeed.students.filter((item) => item.clearanceStatus === 'pending' || item.clearanceStatus === 'held').length,
    outstandingRevenue: universitySeed.invoices.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.amountPaid), 0),
    registrationApproved: universitySeed.registrations.filter((item) => item.status === 'approved').length,
    resultsAwaitingApproval: universitySeed.results.filter((item) => item.status === 'pending' || item.status === 'not_submitted').length,
  };
}

export function getRevenueTrend() {
  return [
    { month: 'Jan', invoiced: 18400000, collected: 12100000 },
    { month: 'Feb', invoiced: 25600000, collected: 16800000 },
    { month: 'Mar', invoiced: 29400000, collected: 22100000 },
    { month: 'Apr', invoiced: 18700000, collected: 14900000 },
    { month: 'May', invoiced: 14800000, collected: 10600000 },
  ];
}

export function getRegistrationBreakdown() {
  return [
    { name: 'Approved', value: universitySeed.registrations.filter((item) => item.status === 'approved').length },
    { name: 'Pending', value: universitySeed.registrations.filter((item) => item.status === 'pending').length },
    { name: 'Held', value: universitySeed.registrations.filter((item) => item.status === 'held').length },
    { name: 'Rejected', value: universitySeed.registrations.filter((item) => item.status === 'rejected').length },
  ];
}

export function listApplicants() {
  return universitySeed.applicants.map((applicant) => ({
    ...applicant,
    facultyName: facultyName(applicant.facultyId),
    departmentName: departmentName(applicant.departmentId),
    programmeName: programmeName(applicant.programmeId),
    officerName: userMap.get(applicant.assignedOfficerId)?.name ?? 'Registry',
  }));
}

export function getApplicantById(applicantId: string) {
  const applicant = universitySeed.applicants.find((item) => item.id === applicantId);

  if (!applicant) {
    return null;
  }

  const invoice = universitySeed.invoices.find((item) => item.applicantId === applicantId);

  return {
    applicant,
    faculty: facultyMap.get(applicant.facultyId),
    department: departmentMap.get(applicant.departmentId),
    programme: programmeMap.get(applicant.programmeId),
    officer: userMap.get(applicant.assignedOfficerId),
    invoice,
  };
}

export function listStudents() {
  return universitySeed.students.map((student) => ({
    ...student,
    facultyName: facultyName(student.facultyId),
    departmentName: departmentName(student.departmentId),
    programmeName: programmeName(student.programmeId),
    adviserName: userMap.get(student.adviserId)?.name ?? 'Adviser not assigned',
  }));
}

export function getStudentProfile(studentId: string) {
  const student = universitySeed.students.find((item) => item.id === studentId);

  if (!student) {
    return null;
  }

  const invoices = universitySeed.invoices.filter((item) => item.studentId === studentId);
  const registration = universitySeed.registrations.find((item) => item.studentId === studentId);
  const resultEntries = universitySeed.results.filter((item) => item.studentId === studentId);

  const unitsAttempted = resultEntries.length;
  const gradePoints = resultEntries.reduce((sum, entry) => sum + entry.gradePoint, 0);
  const gpa = unitsAttempted ? gradePoints / unitsAttempted : 0;

  return {
    student,
    faculty: facultyMap.get(student.facultyId),
    department: departmentMap.get(student.departmentId),
    programme: programmeMap.get(student.programmeId),
    adviser: userMap.get(student.adviserId),
    invoices,
    registration,
    results: resultEntries.map((entry) => ({
      ...entry,
      course: courseMap.get(entry.courseId),
    })),
    financialPosition: {
      totalBilled: invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      totalPaid: invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0),
      outstanding: invoices.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.amountPaid), 0),
    },
    gpa,
  };
}

export function listInvoices() {
  return universitySeed.invoices.map((invoice) => {
    const student = invoice.studentId ? universitySeed.students.find((item) => item.id === invoice.studentId) : undefined;
    const applicant = invoice.applicantId ? universitySeed.applicants.find((item) => item.id === invoice.applicantId) : undefined;

    return {
      ...invoice,
      ownerName: student?.fullName ?? applicant?.fullName ?? 'Unknown Owner',
      programmeName: student ? programmeName(student.programmeId) : applicant ? programmeName(applicant.programmeId) : 'General',
      balance: invoice.totalAmount - invoice.amountPaid,
    };
  });
}

export function listPayments() {
  const invoiceLookup = new Map(listInvoices().map((invoice) => [invoice.id, invoice]));

  return universitySeed.payments.map((payment) => {
    const invoice = invoiceLookup.get(payment.invoiceId);

    return {
      ...payment,
      ownerName: invoice?.ownerName ?? 'Unknown Owner',
      programmeName: invoice?.programmeName ?? 'General',
      invoiceNumber: invoice?.invoiceNumber ?? 'N/A',
      invoiceStatus: invoice?.status ?? 'unpaid',
    };
  });
}

export function getInvoiceById(invoiceId: string) {
  const invoice = universitySeed.invoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    return null;
  }

  const feeTemplate = universitySeed.feeTemplates.find((item) => item.id === invoice.feeTemplateId);
  const student = invoice.studentId ? universitySeed.students.find((item) => item.id === invoice.studentId) : undefined;
  const applicant = invoice.applicantId ? universitySeed.applicants.find((item) => item.id === invoice.applicantId) : undefined;

  return {
    invoice,
    feeTemplate,
    ownerName: student?.fullName ?? applicant?.fullName ?? 'Unknown Owner',
    payments: universitySeed.payments.filter((item) => item.invoiceId === invoice.id),
    student,
    applicant,
  };
}

export function listRegistrations() {
  return universitySeed.registrations.map((registration) => {
    const student = universitySeed.students.find((item) => item.id === registration.studentId)!;
    const registrationCourses = universitySeed.registrationItems
      .filter((item) => item.registrationId === registration.id)
      .map((item) => courseMap.get(item.courseId)?.code)
      .filter(Boolean)
      .join(', ');

    return {
      ...registration,
      studentName: student.fullName,
      matricNumber: student.matricNumber,
      facultyName: facultyName(student.facultyId),
      departmentName: departmentName(student.departmentId),
      programmeName: programmeName(student.programmeId),
      courseCodes: registrationCourses,
    };
  });
}

export function getRegistrationByStudentAndSemester(studentId: string, semesterId = universitySeed.currentSemesterId) {
  const registration = universitySeed.registrations.find((item) => item.studentId === studentId && item.semesterId === semesterId);

  if (!registration) {
    return null;
  }

  return {
    registration,
    items: universitySeed.registrationItems
      .filter((item) => item.registrationId === registration.id)
      .map((item) => ({
        ...item,
        course: courseMap.get(item.courseId),
      })),
  };
}

export function listResultSummaries() {
  return universitySeed.registrations.map((registration) => {
    const student = universitySeed.students.find((item) => item.id === registration.studentId)!;
    const entries = universitySeed.results.filter((item) => item.registrationId === registration.id);
    const approvedEntries = entries.filter((item) => item.status === 'approved' || item.status === 'published');
    const average = approvedEntries.length
      ? approvedEntries.reduce((sum, item) => sum + item.totalScore, 0) / approvedEntries.length
      : 0;

    return {
      registrationId: registration.id,
      studentId: student.id,
      studentName: student.fullName,
      matricNumber: student.matricNumber,
      departmentName: departmentName(student.departmentId),
      programmeName: programmeName(student.programmeId),
      approvalStatus: entries.some((item) => item.status === 'not_submitted')
        ? 'not_submitted'
        : entries.some((item) => item.status === 'pending')
          ? 'pending'
          : entries.some((item) => item.status === 'approved')
            ? 'approved'
            : 'published',
      carryovers: entries.filter((item) => item.carryover).length,
      averageScore: average,
    };
  });
}

export function getDepartmentResultSummary() {
  return universitySeed.departments.map((department) => {
    const departmentStudents = universitySeed.students.filter((item) => item.departmentId === department.id);
    const departmentResults = universitySeed.results.filter((item) => {
      const student = universitySeed.students.find((entry) => entry.id === item.studentId);
      return student?.departmentId === department.id;
    });

    return {
      departmentId: department.id,
      departmentName: department.name,
      students: departmentStudents.length,
      carryovers: departmentResults.filter((item) => item.carryover).length,
      published: departmentResults.filter((item) => item.status === 'published').length,
      awaiting: departmentResults.filter((item) => item.status === 'pending' || item.status === 'not_submitted').length,
    };
  });
}

export function listUsers() {
  return universitySeed.users.map((user) => ({
    ...user,
    roleName: roleMap.get(user.roleId)?.name ?? 'Unknown Role',
    facultyName: user.facultyId ? facultyName(user.facultyId) : 'University-wide',
    departmentName: user.departmentId ? departmentName(user.departmentId) : 'Central Administration',
  }));
}

export function getSettingsBlueprint() {
  return {
    institutionName: 'Unicare University',
    gradingScale: '5-point GPA model',
    registrationPolicy: 'Students must settle at least 60% of billed fees before HOD approval.',
    resultWorkflow: ['Lecturer submission', 'Department review', 'Faculty validation', 'Registry publish'],
    enabledModules: ['Admissions', 'Student Records', 'Finance Lite', 'Course Registration', 'Results', 'Reports'],
  };
}

export function getCurrentActors() {
  return {
    users: universitySeed.users,
    sessions: universitySeed.academicSessions,
    semesters: universitySeed.semesters,
  };
}
