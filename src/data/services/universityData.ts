import { useDemoDataStore } from '../../app/store/demoDataStore';
import type { DashboardSummary } from '../../types/domain';

export interface AcademicScopeSelection {
  facultyId?: string;
  departmentId?: string;
  programmeId?: string;
  levelId?: string;
}

function getData() {
  return useDemoDataStore.getState().data;
}

function facultyMap() {
  return new Map(getData().faculties.map((item) => [item.id, item]));
}

function departmentMap() {
  return new Map(getData().departments.map((item) => [item.id, item]));
}

function programmeMap() {
  return new Map(getData().programmes.map((item) => [item.id, item]));
}

function userMap() {
  return new Map(getData().users.map((item) => [item.id, item]));
}

function courseMap() {
  return new Map(getData().courses.map((item) => [item.id, item]));
}

function programmeCourseMap() {
  return getData().programmeCourses;
}

function roleMap() {
  return new Map(getData().roles.map((item) => [item.id, item]));
}

function facultyName(facultyId: string) {
  return facultyMap().get(facultyId)?.name ?? 'Unknown Faculty';
}

function departmentName(departmentId: string) {
  return departmentMap().get(departmentId)?.name ?? 'Unknown Department';
}

function programmeName(programmeId: string) {
  return programmeMap().get(programmeId)?.name ?? 'Unknown Programme';
}

function departmentForProgramme(programmeId: string) {
  const programme = programmeMap().get(programmeId);
  return programme ? departmentMap().get(programme.departmentId) : undefined;
}

function facultyForProgramme(programmeId: string) {
  const department = departmentForProgramme(programmeId);
  return department ? facultyMap().get(department.facultyId) : undefined;
}

function facultyNameForProgramme(programmeId: string) {
  return facultyForProgramme(programmeId)?.name ?? 'Unknown Faculty';
}

function resultWorkflowStatus(entries: Array<{ status: string }>) {
  if (!entries.length || entries.some((entry) => entry.status === 'not_submitted')) {
    return 'not_submitted';
  }

  if (entries.some((entry) => entry.status === 'pending')) {
    return 'pending';
  }

  if (entries.some((entry) => entry.status === 'approved')) {
    return 'approved';
  }

  return 'published';
}

export function getReferenceData() {
  return getData();
}

export function getAcademicScopeOptions(selection: Pick<AcademicScopeSelection, 'facultyId' | 'departmentId'> = {}) {
  const data = getData();
  const departments = selection.facultyId
    ? data.departments.filter((department) => department.facultyId === selection.facultyId)
    : [];
  const programmes = selection.departmentId
    ? data.programmes.filter((programme) => programme.departmentId === selection.departmentId)
    : [];

  return {
    faculties: data.faculties,
    departments,
    programmes,
    levels: data.levels,
  };
}

export function matchesAcademicScope(
  item: { facultyId?: string; departmentId?: string; programmeId?: string; levelId?: string },
  selection: AcademicScopeSelection,
) {
  return (
    (!selection.facultyId || item.facultyId === selection.facultyId) &&
    (!selection.departmentId || item.departmentId === selection.departmentId) &&
    (!selection.programmeId || item.programmeId === selection.programmeId) &&
    (!selection.levelId || item.levelId === selection.levelId)
  );
}

export function listFacultyHierarchy() {
  const data = getData();
  const facultyLookup = facultyMap();

  return data.faculties.map((faculty) => {
    const childDepartments = data.departments.filter((department) => department.facultyId === faculty.id);
    const childProgrammes = data.programmes.filter((programme) =>
      childDepartments.some((department) => department.id === programme.departmentId),
    );

    return {
      ...faculty,
      breadcrumb: faculty.name,
      departmentCount: childDepartments.length,
      programmeCount: childProgrammes.length,
      departments: childDepartments.map((department) => ({
        ...department,
        facultyName: facultyLookup.get(department.facultyId)?.name ?? 'Unknown Faculty',
        programmeCount: data.programmes.filter((programme) => programme.departmentId === department.id).length,
      })),
    };
  });
}

export function listDepartmentHierarchy() {
  const data = getData();

  return data.departments.map((department) => {
    const faculty = facultyMap().get(department.facultyId);
    const childProgrammes = data.programmes.filter((programme) => programme.departmentId === department.id);

    return {
      ...department,
      facultyName: faculty?.name ?? 'Unknown Faculty',
      breadcrumb: `${faculty?.name ?? 'Unknown Faculty'} > ${department.name}`,
      programmes: childProgrammes,
      programmeCount: childProgrammes.length,
    };
  });
}

export function listProgrammeHierarchy() {
  const data = getData();
  const attachments = programmeCourseMap();

  return data.programmes.map((programme) => {
    const department = departmentMap().get(programme.departmentId);
    const faculty = department ? facultyMap().get(department.facultyId) : undefined;

    return {
      ...programme,
      facultyName: faculty?.name ?? 'Unknown Faculty',
      departmentName: department?.name ?? 'Unknown Department',
      breadcrumb: `${faculty?.name ?? 'Unknown Faculty'} > ${department?.name ?? 'Unknown Department'} > ${programme.award} ${programme.name}`,
      courseCount: attachments.filter((attachment) => attachment.programmeId === programme.id).length,
    };
  });
}

export function listSessionHierarchy() {
  const data = getData();

  return data.academicSessions.map((session) => {
    const childSemesters = data.semesters.filter((semester) => semester.sessionId === session.id);

    return {
      ...session,
      semesterCount: childSemesters.length,
      semesters: childSemesters.map((semester) => ({
        ...semester,
        breadcrumb: `${session.name} > ${semester.name}`,
      })),
    };
  });
}

export function listCourseCatalog() {
  const data = getData();
  const departmentLookup = departmentMap();
  const facultyLookup = facultyMap();
  const programmeLookup = programmeMap();
  const sessionLookup = new Map(data.academicSessions.map((session) => [session.id, session]));
  const semesterLookup = new Map(data.semesters.map((semester) => [semester.id, semester]));
  const levelLookup = new Map(data.levels.map((level) => [level.id, level]));
  const userLookup = userMap();

  return data.courses.map((course) => {
    const department = departmentLookup.get(course.departmentId);
    const faculty = department ? facultyLookup.get(department.facultyId) : undefined;
    const semester = semesterLookup.get(course.semesterId);
    const session = semester ? sessionLookup.get(semester.sessionId) : undefined;
    const level = levelLookup.get(course.levelId);
    const attachments = data.programmeCourses.filter((attachment) => attachment.courseId === course.id);
    const attachedProgrammes = attachments
      .map((attachment) => programmeLookup.get(attachment.programmeId))
      .filter(Boolean)
      .map((programme) => ({
        id: programme!.id,
        name: programme!.name,
        award: programme!.award,
      }));

    return {
      ...course,
      facultyName: faculty?.name ?? 'Unknown Faculty',
      departmentName: department?.name ?? 'Unknown Department',
      semesterName: semester?.name ?? 'Unknown Semester',
      sessionName: session?.name ?? 'Unknown Session',
      levelName: level?.name ?? 'Unknown Level',
      lecturerName: course.lecturerId ? userLookup.get(course.lecturerId)?.name ?? 'Unassigned' : 'Unassigned',
      attachedProgrammes,
      attachedProgrammeNames: attachedProgrammes.map((programme) => `${programme.award} ${programme.name}`),
      breadcrumb: `${faculty?.name ?? 'Unknown Faculty'} > ${department?.name ?? 'Unknown Department'} > ${course.code}`,
    };
  });
}

export function getDashboardSummary(): DashboardSummary {
  const data = getData();

  return {
    totalStudents: data.students.length,
    activeApplicants: data.applicants.filter((item) => item.admissionStatus !== 'declined').length,
    clearancePending: data.students.filter((item) => item.clearanceStatus === 'pending' || item.clearanceStatus === 'held').length,
    outstandingRevenue: data.invoices.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.amountPaid), 0),
    registrationApproved: data.registrations.filter((item) => item.status === 'approved').length,
    resultsAwaitingApproval: data.results.filter((item) => item.status === 'pending' || item.status === 'not_submitted').length,
    totalBeds: data.hostelRooms.reduce((sum, room) => sum + room.capacity, 0),
    occupiedBeds: data.roomAssignments.filter((a) => a.status === 'occupied' || a.status === 'assigned').length,
  };
}

export function getRevenueTrend() {
  const invoices = listInvoices();
  const paid = invoices.filter((invoice) => invoice.status === 'paid').length;
  const partPaid = invoices.filter((invoice) => invoice.status === 'part_paid').length;
  const overdue = invoices.filter((invoice) => invoice.status === 'overdue').length;

  return [
    { month: 'Jan', invoiced: 18400000, collected: 12100000 },
    { month: 'Feb', invoiced: 25600000, collected: 16800000 },
    { month: 'Mar', invoiced: 29400000 + paid * 80000, collected: 22100000 + partPaid * 40000 },
    { month: 'Apr', invoiced: 18700000 + overdue * 20000, collected: 14900000 + paid * 15000 },
    { month: 'May', invoiced: 14800000, collected: 10600000 + partPaid * 12000 },
  ];
}

export function getRegistrationBreakdown() {
  const data = getData();

  return [
    { name: 'Approved', value: data.registrations.filter((item) => item.status === 'approved').length },
    { name: 'Pending', value: data.registrations.filter((item) => item.status === 'pending').length },
    { name: 'Held', value: data.registrations.filter((item) => item.status === 'held').length },
    { name: 'Rejected', value: data.registrations.filter((item) => item.status === 'rejected').length },
  ];
}

export function listApplicants() {
  const users = userMap();

  return getData().applicants.map((applicant) => ({
    ...applicant,
    facultyName: facultyNameForProgramme(applicant.programmeId),
    departmentName: departmentName(applicant.departmentId),
    programmeName: programmeName(applicant.programmeId),
    officerName: users.get(applicant.assignedOfficerId)?.name ?? 'Registry',
  }));
}

export function getApplicantById(applicantId: string) {
  const data = getData();
  const applicant = data.applicants.find((item) => item.id === applicantId);

  if (!applicant) {
    return null;
  }

  const invoice = data.invoices.find((item) => item.applicantId === applicantId);
  const linkedStudent = data.students.find((student) => student.email === applicant.email);

  return {
    applicant,
    faculty: facultyForProgramme(applicant.programmeId),
    department: departmentMap().get(applicant.departmentId),
    programme: programmeMap().get(applicant.programmeId),
    officer: userMap().get(applicant.assignedOfficerId),
    invoice,
    linkedStudent,
  };
}

export function listStudents() {
  const levelLookup = new Map(getData().levels.map((level) => [level.id, level]));

  return getData().students.map((student) => ({
    ...student,
    facultyName: facultyNameForProgramme(student.programmeId),
    departmentName: departmentName(student.departmentId),
    programmeName: programmeName(student.programmeId),
    levelName: levelLookup.get(student.levelId)?.name ?? 'Unknown Level',
    adviserName: userMap().get(student.adviserId)?.name ?? 'Adviser not assigned',
  }));
}

export function getStudentProfile(studentId: string) {
  const data = getData();
  const student = data.students.find((item) => item.id === studentId);

  if (!student) {
    return null;
  }

  const invoices = data.invoices.filter((item) => item.studentId === studentId);
  const registration = data.registrations.find((item) => item.studentId === studentId);
  const resultEntries = data.results.filter((item) => item.studentId === studentId);

  const cMap = courseMap();
  const totalWeightedPoints = resultEntries.reduce((sum, entry) => {
    const units = cMap.get(entry.courseId)?.units ?? 0;
    return sum + entry.gradePoint * units;
  }, 0);
  const totalUnitsAttempted = resultEntries.reduce((sum, entry) => {
    return sum + (cMap.get(entry.courseId)?.units ?? 0);
  }, 0);
  const gpa = totalUnitsAttempted ? totalWeightedPoints / totalUnitsAttempted : 0;

  return {
    student,
    faculty: facultyForProgramme(student.programmeId),
    department: departmentMap().get(student.departmentId),
    programme: programmeMap().get(student.programmeId),
    adviser: userMap().get(student.adviserId),
    invoices,
    registration,
    results: resultEntries.map((entry) => ({
      ...entry,
      course: courseMap().get(entry.courseId),
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
  const data = getData();
  const levelLookup = new Map(data.levels.map((level) => [level.id, level]));

  return data.invoices.map((invoice) => {
    const student = invoice.studentId ? data.students.find((item) => item.id === invoice.studentId) : undefined;
    const applicant = invoice.applicantId ? data.applicants.find((item) => item.id === invoice.applicantId) : undefined;
    const owner = student ?? applicant;
    const ownerLevelId = student?.levelId;

    return {
      ...invoice,
      facultyId: owner?.facultyId,
      departmentId: owner?.departmentId,
      programmeId: owner?.programmeId,
      levelId: ownerLevelId,
      ownerName: student?.fullName ?? applicant?.fullName ?? 'Unknown Owner',
      facultyName: owner?.facultyId ? facultyName(owner.facultyId) : 'General',
      departmentName: owner?.departmentId ? departmentName(owner.departmentId) : 'General',
      programmeName: student ? programmeName(student.programmeId) : applicant ? programmeName(applicant.programmeId) : 'General',
      levelName: ownerLevelId ? levelLookup.get(ownerLevelId)?.name ?? 'Unknown Level' : 'N/A',
      balance: invoice.totalAmount - invoice.amountPaid,
    };
  });
}

export function listPayments() {
  const invoiceLookup = new Map(listInvoices().map((invoice) => [invoice.id, invoice]));

  return getData().payments.map((payment) => {
    const invoice = invoiceLookup.get(payment.invoiceId);

    return {
      ...payment,
      ownerName: invoice?.ownerName ?? 'Unknown Owner',
      facultyId: invoice?.facultyId,
      departmentId: invoice?.departmentId,
      programmeId: invoice?.programmeId,
      levelId: invoice?.levelId,
      facultyName: invoice?.facultyName ?? 'General',
      departmentName: invoice?.departmentName ?? 'General',
      programmeName: invoice?.programmeName ?? 'General',
      levelName: invoice?.levelName ?? 'N/A',
      invoiceNumber: invoice?.invoiceNumber ?? 'N/A',
      invoiceStatus: invoice?.status ?? 'unpaid',
    };
  });
}

export function getInvoiceById(invoiceId: string) {
  const data = getData();
  const invoice = data.invoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    return null;
  }

  const feeTemplate = data.feeTemplates.find((item) => item.id === invoice.feeTemplateId);
  const student = invoice.studentId ? data.students.find((item) => item.id === invoice.studentId) : undefined;
  const applicant = invoice.applicantId ? data.applicants.find((item) => item.id === invoice.applicantId) : undefined;

  return {
    invoice,
    feeTemplate,
    ownerName: student?.fullName ?? applicant?.fullName ?? 'Unknown Owner',
    payments: data.payments.filter((item) => item.invoiceId === invoice.id),
    student,
    applicant,
  };
}

export function listRegistrations() {
  const data = getData();
  const levelLookup = new Map(data.levels.map((level) => [level.id, level]));

  return data.registrations.map((registration) => {
    const student = data.students.find((item) => item.id === registration.studentId)!;
    const registrationCourses = data.registrationItems
      .filter((item) => item.registrationId === registration.id)
      .map((item) => courseMap().get(item.courseId)?.code)
      .filter(Boolean)
      .join(', ');

    return {
      ...registration,
      studentName: student.fullName,
      matricNumber: student.matricNumber,
      facultyId: student.facultyId,
      departmentId: student.departmentId,
      programmeId: student.programmeId,
      levelId: student.levelId,
      facultyName: facultyNameForProgramme(student.programmeId),
      departmentName: departmentName(student.departmentId),
      programmeName: programmeName(student.programmeId),
      levelName: levelLookup.get(student.levelId)?.name ?? 'Unknown Level',
      courseCodes: registrationCourses,
    };
  });
}

export function getRegistrationByStudentAndSemester(studentId: string, semesterId = getData().currentSemesterId) {
  const data = getData();
  const registration = data.registrations.find((item) => item.studentId === studentId && item.semesterId === semesterId);

  if (!registration) {
    return null;
  }

  return {
    registration,
    items: data.registrationItems
      .filter((item) => item.registrationId === registration.id)
      .map((item) => ({
        ...item,
        course: courseMap().get(item.courseId),
      })),
  };
}

export function listResultSummaries() {
  const data = getData();
  const levelLookup = new Map(data.levels.map((level) => [level.id, level]));

  return data.registrations.map((registration) => {
    const student = data.students.find((item) => item.id === registration.studentId)!;
    const entries = data.results.filter((item) => item.registrationId === registration.id);
    const approvedEntries = entries.filter((item) => item.status === 'approved' || item.status === 'published');
    const average = approvedEntries.length
      ? approvedEntries.reduce((sum, item) => sum + item.totalScore, 0) / approvedEntries.length
      : 0;

    return {
      registrationId: registration.id,
      studentId: student.id,
      studentName: student.fullName,
      matricNumber: student.matricNumber,
      facultyId: student.facultyId,
      departmentId: student.departmentId,
      programmeId: student.programmeId,
      levelId: student.levelId,
      facultyName: facultyNameForProgramme(student.programmeId),
      departmentName: departmentName(student.departmentId),
      programmeName: programmeName(student.programmeId),
      levelName: levelLookup.get(student.levelId)?.name ?? 'Unknown Level',
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
  const data = getData();

  return data.departments.map((department) => {
    const departmentStudents = data.students.filter((item) => item.departmentId === department.id);
    const departmentResults = data.results.filter((item) => {
      const student = data.students.find((entry) => entry.id === item.studentId);
      return student?.departmentId === department.id;
    });

    return {
      departmentId: department.id,
      facultyId: department.facultyId,
      facultyName: facultyName(department.facultyId),
      departmentName: department.name,
      students: departmentStudents.length,
      carryovers: departmentResults.filter((item) => item.carryover).length,
      published: departmentResults.filter((item) => item.status === 'published').length,
      awaiting: departmentResults.filter((item) => item.status === 'pending' || item.status === 'not_submitted').length,
    };
  });
}

export function listLecturers() {
  const data = getData();
  const courseCountByLecturer = new Map<string, number>();
  const adviseeCountByLecturer = new Map<string, number>();

  data.courses.forEach((course) => {
    if (!course.lecturerId) {
      return;
    }

    courseCountByLecturer.set(course.lecturerId, (courseCountByLecturer.get(course.lecturerId) ?? 0) + 1);
  });

  data.students.forEach((student) => {
    adviseeCountByLecturer.set(student.adviserId, (adviseeCountByLecturer.get(student.adviserId) ?? 0) + 1);
  });

  return data.users
    .filter((user) => user.roleId === 'role-lecturer')
    .map((lecturer) => ({
      ...lecturer,
      facultyName: lecturer.facultyId ? facultyName(lecturer.facultyId) : 'University-wide',
      departmentName: lecturer.departmentId ? departmentName(lecturer.departmentId) : 'Central Administration',
      courseCount: courseCountByLecturer.get(lecturer.id) ?? 0,
      adviseeCount: adviseeCountByLecturer.get(lecturer.id) ?? 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function listLecturerCourses(lecturerId: string) {
  const data = getData();
  const registrationLookup = new Map(data.registrations.map((registration) => [registration.id, registration]));
  const lecturerCourses = listCourseCatalog().filter((course) => course.lecturerId === lecturerId);

  return lecturerCourses.map((course) => {
    const registrationItems = data.registrationItems.filter((item) => item.courseId === course.id);
    const studentIds = new Set(
      registrationItems
        .map((item) => registrationLookup.get(item.registrationId)?.studentId)
        .filter((studentId): studentId is string => Boolean(studentId)),
    );
    const resultEntries = data.results.filter((entry) => entry.courseId === course.id);

    return {
      ...course,
      assignedStudentCount: studentIds.size,
      resultEntryCount: resultEntries.length,
      pendingResultCount: resultEntries.filter((entry) => entry.status !== 'published').length,
      resultPosture: resultWorkflowStatus(resultEntries),
      programmeCoverage: course.attachedProgrammeNames.join(', ') || 'No programme attachment yet',
    };
  });
}

export function listLecturerAdvisees(lecturerId: string) {
  const data = getData();
  const levelLookup = new Map(data.levels.map((level) => [level.id, level]));
  const currentRegistrations = new Map(
    data.registrations
      .filter((registration) => registration.semesterId === data.currentSemesterId)
      .map((registration) => [registration.studentId, registration]),
  );
  const outstandingBalanceByStudent = new Map<string, number>();

  data.invoices.forEach((invoice) => {
    if (!invoice.studentId) {
      return;
    }

    outstandingBalanceByStudent.set(
      invoice.studentId,
      (outstandingBalanceByStudent.get(invoice.studentId) ?? 0) + (invoice.totalAmount - invoice.amountPaid),
    );
  });

  return data.students
    .filter((student) => student.adviserId === lecturerId)
    .map((student) => {
      const registration = currentRegistrations.get(student.id);
      const outstandingBalance = outstandingBalanceByStudent.get(student.id) ?? 0;

      return {
        ...student,
        studentId: student.id,
        studentName: student.fullName,
        facultyName: facultyNameForProgramme(student.programmeId),
        departmentName: departmentName(student.departmentId),
        programmeName: programmeName(student.programmeId),
        levelName: levelLookup.get(student.levelId)?.name ?? 'Unknown Level',
        registrationId: registration?.id,
        registrationStatus: registration?.status ?? 'draft',
        adviserReview: registration?.adviserReview ?? 'pending',
        hodReview: registration?.hodReview ?? 'pending',
        hasFinancialHold: registration?.hasFinancialHold ?? outstandingBalance > 0,
        outstandingBalance,
      };
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export function listLecturerResultEntries(lecturerId: string) {
  const data = getData();
  const levelLookup = new Map(data.levels.map((level) => [level.id, level]));
  const semesterLookup = new Map(data.semesters.map((semester) => [semester.id, semester]));
  const sessionLookup = new Map(data.academicSessions.map((session) => [session.id, session]));
  const registrationLookup = new Map(data.registrations.map((registration) => [registration.id, registration]));
  const studentLookup = new Map(data.students.map((student) => [student.id, student]));
  const courseLookup = courseMap();

  return data.results
    .filter((entry) => courseLookup.get(entry.courseId)?.lecturerId === lecturerId)
    .map((entry) => {
      const student = studentLookup.get(entry.studentId);
      const course = courseLookup.get(entry.courseId);
      const semester = semesterLookup.get(entry.semesterId);
      const session = sessionLookup.get(entry.sessionId);
      const registration = registrationLookup.get(entry.registrationId);

      return {
        ...entry,
        studentName: student?.fullName ?? 'Unknown Student',
        matricNumber: student?.matricNumber ?? 'N/A',
        facultyId: student?.facultyId,
        departmentId: student?.departmentId,
        programmeId: student?.programmeId,
        levelId: student?.levelId,
        facultyName: student?.facultyId ? facultyName(student.facultyId) : 'Unknown Faculty',
        departmentName: student?.departmentId ? departmentName(student.departmentId) : 'Unknown Department',
        programmeName: student?.programmeId ? programmeName(student.programmeId) : 'Unknown Programme',
        levelName: student?.levelId ? levelLookup.get(student.levelId)?.name ?? 'Unknown Level' : 'Unknown Level',
        courseCode: course?.code ?? 'N/A',
        courseTitle: course?.title ?? 'Unknown Course',
        semesterName: semester?.name ?? 'Unknown Semester',
        sessionName: session?.name ?? 'Unknown Session',
        registrationStatus: registration?.status ?? 'draft',
      };
    })
    .sort((left, right) => left.studentName.localeCompare(right.studentName));
}

export function listLecturerRegistrationReviews(lecturerId: string) {
  const data = getData();
  const advisees = new Map(listLecturerAdvisees(lecturerId).map((advisee) => [advisee.studentId, advisee]));
  const semesterLookup = new Map(data.semesters.map((semester) => [semester.id, semester]));
  const sessionLookup = new Map(data.academicSessions.map((session) => [session.id, session]));

  return data.registrations
    .filter((registration) => advisees.has(registration.studentId))
    .map((registration) => {
      const advisee = advisees.get(registration.studentId)!;
      const semester = semesterLookup.get(registration.semesterId);
      const session = sessionLookup.get(registration.sessionId);

      return {
        ...registration,
        studentName: advisee.studentName,
        matricNumber: advisee.matricNumber,
        facultyId: advisee.facultyId,
        departmentId: advisee.departmentId,
        programmeId: advisee.programmeId,
        levelId: advisee.levelId,
        facultyName: advisee.facultyName,
        departmentName: advisee.departmentName,
        programmeName: advisee.programmeName,
        levelName: advisee.levelName,
        studentStatus: advisee.status,
        clearanceStatus: advisee.clearanceStatus,
        outstandingBalance: advisee.outstandingBalance,
        semesterName: semester?.name ?? 'Unknown Semester',
        sessionName: session?.name ?? 'Unknown Session',
      };
    })
    .sort((left, right) => left.studentName.localeCompare(right.studentName));
}

export function getLecturerOverview(lecturerId: string) {
  const lecturer = listLecturers().find((item) => item.id === lecturerId);
  const courses = listLecturerCourses(lecturerId);
  const advisees = listLecturerAdvisees(lecturerId);
  const resultEntries = listLecturerResultEntries(lecturerId);
  const registrationReviews = listLecturerRegistrationReviews(lecturerId);

  return {
    lecturer,
    assignedCourses: courses.length,
    advisees: advisees.length,
    resultRowsAwaitingAction: resultEntries.filter((entry) => entry.status !== 'published').length,
    registrationsNeedingReview: registrationReviews.filter(
      (review) => review.adviserReview !== 'approved' || review.hasFinancialHold || review.status === 'held' || review.status === 'rejected',
    ).length,
    courseQueue: courses
      .filter((course) => course.resultPosture !== 'published')
      .sort((left, right) => right.pendingResultCount - left.pendingResultCount)
      .slice(0, 5),
    adviseeQueue: advisees
      .filter(
        (advisee) =>
          advisee.hasFinancialHold ||
          advisee.registrationStatus === 'held' ||
          advisee.registrationStatus === 'pending' ||
          advisee.adviserReview !== 'approved',
      )
      .slice(0, 5),
  };
}

export function listUsers() {
  return getData().users.map((user) => ({
    ...user,
    roleName: roleMap().get(user.roleId)?.name ?? 'Unknown Role',
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
  const data = getData();

  return {
    users: data.users,
    sessions: data.academicSessions,
    semesters: data.semesters,
  };
}

// ── Hostel & Accommodation ──────────────────────────────────────────

export function listHostelBlocks() {
  const data = getData();

  return data.hostelBlocks.map((block) => {
    const activeAssignments = data.roomAssignments.filter(
      (a) => a.blockId === block.id && (a.status === 'occupied' || a.status === 'assigned'),
    );
    const occupiedBeds = activeAssignments.length;

    return {
      ...block,
      occupiedBeds,
      vacantBeds: block.totalBeds - occupiedBeds,
      occupancyRate: block.totalBeds ? Math.round((occupiedBeds / block.totalBeds) * 100) : 0,
    };
  });
}

export function getHostelBlockDetail(blockId: string) {
  const data = getData();
  const block = data.hostelBlocks.find((item) => item.id === blockId);
  if (!block) return null;

  const sMap = new Map(data.students.map((s) => [s.id, s]));
  const rooms = data.hostelRooms.filter((room) => room.blockId === blockId);

  return {
    block,
    rooms: rooms.map((room) => {
      const assignments = data.roomAssignments
        .filter((a) => a.roomId === room.id && a.status !== 'vacated')
        .map((a) => {
          const student = sMap.get(a.studentId);
          return {
            ...a,
            studentName: student?.fullName ?? 'Unknown',
            matricNumber: student?.matricNumber ?? '',
          };
        });
      return { ...room, assignments, occupancy: assignments.length };
    }),
  };
}

export function listRoomAssignments() {
  const data = getData();
  const sMap = new Map(data.students.map((s) => [s.id, s]));
  const rMap = new Map(data.hostelRooms.map((r) => [r.id, r]));
  const bMap = new Map(data.hostelBlocks.map((b) => [b.id, b]));

  return data.roomAssignments.map((assignment) => {
    const room = rMap.get(assignment.roomId);
    const block = room ? bMap.get(room.blockId) : undefined;
    const student = sMap.get(assignment.studentId);
    return {
      ...assignment,
      studentName: student?.fullName ?? 'Unknown',
      matricNumber: student?.matricNumber ?? '',
      roomNumber: room?.roomNumber ?? '',
      blockName: block?.name ?? '',
    };
  });
}

export function listVacantRooms() {
  const data = getData();
  const bMap = new Map(data.hostelBlocks.map((b) => [b.id, b]));

  return data.hostelRooms
    .map((room) => {
      const block = bMap.get(room.blockId);
      const occupancy = data.roomAssignments.filter(
        (a) => a.roomId === room.id && (a.status === 'occupied' || a.status === 'assigned'),
      ).length;
      return {
        ...room,
        blockName: block?.name ?? '',
        blockType: block?.type ?? ('male' as const),
        occupancy,
        vacantBeds: room.capacity - occupancy,
      };
    })
    .filter((room) => room.vacantBeds > 0);
}
