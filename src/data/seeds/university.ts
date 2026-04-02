import type {
  AcademicSession,
  Applicant,
  Course,
  CourseRegistration,
  Department,
  Faculty,
  FeeTemplate,
  HostelBlock,
  HostelRoom,
  Invoice,
  Level,
  Payment,
  Programme,
  ProgrammeCourse,
  RegistrationItem,
  ResultEntry,
  Role,
  RoomAssignment,
  Semester,
  Student,
  User,
} from '../../types/domain';

const firstNames = [
  'Adaeze',
  'Chinedu',
  'Ifeoma',
  'Tosin',
  'Zainab',
  'Ibrahim',
  'Kenechukwu',
  'Temitope',
  'Amarachi',
  'Amina',
  'Obinna',
  'Damilola',
  'Nkem',
  'Moyosore',
  'Bolanle',
  'Halima',
  'Sodiq',
  'Tobiloba',
  'Ebuka',
  'Amaka',
];

const lastNames = [
  'Adebayo',
  'Okafor',
  'Balogun',
  'Olawale',
  'Eze',
  'Yakubu',
  'Danjuma',
  'Nwosu',
  'Bassey',
  'Ojo',
  'Ibrahim',
  'Onyekachi',
  'Adesina',
  'Afolayan',
  'Garba',
  'Usman',
  'Akinyemi',
  'Musa',
  'Onoh',
  'Suleiman',
];

const states = [
  'Lagos',
  'Oyo',
  'Ogun',
  'Anambra',
  'Enugu',
  'Delta',
  'Kaduna',
  'Kano',
  'Rivers',
  'Benue',
  'Ekiti',
  'Abia',
];

function makeName(seed: number) {
  return `${firstNames[seed % firstNames.length]} ${lastNames[(seed * 3) % lastNames.length]}`;
}

function makeEmail(seed: number) {
  return `${firstNames[seed % firstNames.length].toLowerCase()}.${lastNames[(seed * 3) % lastNames.length].toLowerCase()}${seed}@unicare.demo`;
}

function makePhone(seed: number) {
  return `080${String(10000000 + seed).slice(0, 8)}`;
}

export const faculties: Faculty[] = [
  { id: 'faculty-science', name: 'Faculty of Science', dean: 'Prof. Ruth Afolayan', office: 'Science Complex, Block A' },
  { id: 'faculty-arts', name: 'Faculty of Arts & Humanities', dean: 'Prof. Hassan Eze', office: 'Humanities Building, Floor 2' },
  { id: 'faculty-management', name: 'Faculty of Management Sciences', dean: 'Prof. Damilola Yusuf', office: 'Senate Annexe, West Wing' },
];

export const departments: Department[] = [
  { id: 'dept-csc', facultyId: 'faculty-science', name: 'Computer Science', code: 'CSC', hod: 'Dr. Miriam Okafor' },
  { id: 'dept-mcb', facultyId: 'faculty-science', name: 'Microbiology', code: 'MCB', hod: 'Dr. Ebun Bassey' },
  { id: 'dept-mat', facultyId: 'faculty-science', name: 'Mathematics', code: 'MTH', hod: 'Dr. Michael Danjuma' },
  { id: 'dept-eng', facultyId: 'faculty-arts', name: 'English', code: 'ENG', hod: 'Dr. Fatima Onoh' },
  { id: 'dept-his', facultyId: 'faculty-arts', name: 'History & International Studies', code: 'HIS', hod: 'Dr. Ibrahim Suleiman' },
  { id: 'dept-acc', facultyId: 'faculty-management', name: 'Accounting', code: 'ACC', hod: 'Dr. Sade Adebayo' },
  { id: 'dept-fin', facultyId: 'faculty-management', name: 'Banking & Finance', code: 'BFN', hod: 'Dr. Taye Balogun' },
  { id: 'dept-eco', facultyId: 'faculty-management', name: 'Economics', code: 'ECO', hod: 'Dr. Chika Musa' },
];

export const programmes: Programme[] = [
  { id: 'prog-csc', departmentId: 'dept-csc', name: 'Computer Science', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-cys', departmentId: 'dept-csc', name: 'Cyber Security', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-mcb', departmentId: 'dept-mcb', name: 'Microbiology', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-mat', departmentId: 'dept-mat', name: 'Applied Mathematics', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-eng', departmentId: 'dept-eng', name: 'English & Literary Studies', award: 'B.A', durationYears: 4 },
  { id: 'prog-mcs', departmentId: 'dept-eng', name: 'Mass Communication Studies', award: 'B.A', durationYears: 4 },
  { id: 'prog-his', departmentId: 'dept-his', name: 'History & Diplomatic Studies', award: 'B.A', durationYears: 4 },
  { id: 'prog-acc', departmentId: 'dept-acc', name: 'Accounting', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-act', departmentId: 'dept-acc', name: 'Actuarial Accounting', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-fin', departmentId: 'dept-fin', name: 'Banking & Finance', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-eco', departmentId: 'dept-eco', name: 'Economics', award: 'B.Sc', durationYears: 4 },
  { id: 'prog-bae', departmentId: 'dept-eco', name: 'Business Analytics & Economics', award: 'B.Sc', durationYears: 4 },
];

export const academicSessions: AcademicSession[] = [
  { id: 'session-2024-2025', name: '2024/2025', isCurrent: false },
  { id: 'session-2025-2026', name: '2025/2026', isCurrent: true },
];

export const semesters: Semester[] = [
  { id: 'semester-2024-2025-1', sessionId: 'session-2024-2025', name: 'First Semester', order: 1, isCurrent: false },
  { id: 'semester-2024-2025-2', sessionId: 'session-2024-2025', name: 'Second Semester', order: 2, isCurrent: false },
  { id: 'semester-2025-2026-1', sessionId: 'session-2025-2026', name: 'First Semester', order: 1, isCurrent: true },
  { id: 'semester-2025-2026-2', sessionId: 'session-2025-2026', name: 'Second Semester', order: 2, isCurrent: false },
];

export const levels: Level[] = [
  { id: 'level-100', name: '100L', order: 100 },
  { id: 'level-200', name: '200L', order: 200 },
  { id: 'level-300', name: '300L', order: 300 },
  { id: 'level-400', name: '400L', order: 400 },
  { id: 'level-500', name: '500L', order: 500 },
];

export const roles: Role[] = [
  { id: 'role-super-admin', name: 'Super Admin', scope: 'University-wide', permissions: ['all_access', 'settings', 'reports'] },
  { id: 'role-registrar', name: 'Registrar', scope: 'Registry', permissions: ['admissions', 'students', 'reports', 'approvals'] },
  { id: 'role-bursary', name: 'Bursary Officer', scope: 'Finance', permissions: ['finance', 'payments', 'holds', 'reports'] },
  { id: 'role-faculty', name: 'Faculty Officer', scope: 'Faculty', permissions: ['students', 'results', 'reports'] },
  { id: 'role-hod', name: 'Head of Department', scope: 'Department', permissions: ['registrations', 'results', 'approvals'] },
  { id: 'role-lecturer', name: 'Lecturer / Adviser', scope: 'Course & Level', permissions: ['results', 'advising', 'student-view'] },
];

export const users: User[] = [
  { id: 'user-super-admin', name: 'Aisha Danjuma', email: 'aisha.danjuma@unicare.demo', roleId: 'role-super-admin', phone: '08031234567' },
  { id: 'user-registry-1', name: 'Emeka Okafor', email: 'emeka.okafor@unicare.demo', roleId: 'role-registrar', phone: '08036549821' },
  { id: 'user-bursary-1', name: 'Bose Adebayo', email: 'bose.adebayo@unicare.demo', roleId: 'role-bursary', phone: '08037765432' },
  { id: 'user-faculty-science', name: 'Nkechi Musa', email: 'nkechi.musa@unicare.demo', roleId: 'role-faculty', facultyId: 'faculty-science', phone: '08030111223' },
  { id: 'user-faculty-arts', name: 'Aminu Garba', email: 'aminu.garba@unicare.demo', roleId: 'role-faculty', facultyId: 'faculty-arts', phone: '08035566778' },
  { id: 'user-faculty-management', name: 'Tolu Balogun', email: 'tolu.balogun@unicare.demo', roleId: 'role-faculty', facultyId: 'faculty-management', phone: '08039887766' },
  { id: 'user-hod-csc', name: 'Dr. Miriam Okafor', email: 'miriam.okafor@unicare.demo', roleId: 'role-hod', departmentId: 'dept-csc', facultyId: 'faculty-science', phone: '08034445566' },
  { id: 'user-hod-mcb', name: 'Dr. Ebun Bassey', email: 'ebun.bassey@unicare.demo', roleId: 'role-hod', departmentId: 'dept-mcb', facultyId: 'faculty-science', phone: '08032223344' },
  { id: 'user-hod-eng', name: 'Dr. Fatima Onoh', email: 'fatima.onoh@unicare.demo', roleId: 'role-hod', departmentId: 'dept-eng', facultyId: 'faculty-arts', phone: '08031119988' },
  { id: 'user-hod-acc', name: 'Dr. Sade Adebayo', email: 'sade.adebayo@unicare.demo', roleId: 'role-hod', departmentId: 'dept-acc', facultyId: 'faculty-management', phone: '08034443322' },
  { id: 'user-lect-csc-1', name: 'Dr. Kunle Eze', email: 'kunle.eze@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-csc', facultyId: 'faculty-science', phone: '08031110001' },
  { id: 'user-lect-cys-1', name: 'Dr. Maryam Yusuf', email: 'maryam.yusuf@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-csc', facultyId: 'faculty-science', phone: '08031110002' },
  { id: 'user-lect-mcb-1', name: 'Dr. Seun Alabi', email: 'seun.alabi@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-mcb', facultyId: 'faculty-science', phone: '08031110003' },
  { id: 'user-lect-mat-1', name: 'Dr. Paul Yakubu', email: 'paul.yakubu@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-mat', facultyId: 'faculty-science', phone: '08031110004' },
  { id: 'user-lect-eng-1', name: 'Dr. Kemi Olawale', email: 'kemi.olawale@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-eng', facultyId: 'faculty-arts', phone: '08031110005' },
  { id: 'user-lect-his-1', name: 'Dr. Abdul Suleiman', email: 'abdul.suleiman@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-his', facultyId: 'faculty-arts', phone: '08031110006' },
  { id: 'user-lect-acc-1', name: 'Dr. Dupe Afolayan', email: 'dupe.afolayan@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-acc', facultyId: 'faculty-management', phone: '08031110007' },
  { id: 'user-lect-fin-1', name: 'Dr. Habib Ibrahim', email: 'habib.ibrahim@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-fin', facultyId: 'faculty-management', phone: '08031110008' },
  { id: 'user-lect-eco-1', name: 'Dr. Ruth Ojo', email: 'ruth.ojo@unicare.demo', roleId: 'role-lecturer', departmentId: 'dept-eco', facultyId: 'faculty-management', phone: '08031110009' },
];

const semesterCourseTags = [
  'Foundations',
  'Analytics',
  'Systems',
  'Methods',
  'Seminar',
  'Applications',
  'Studio',
  'Theory',
];

const levelPools = ['level-100', 'level-200', 'level-300', 'level-400'];
const currentSemesterId = 'semester-2025-2026-1';
const currentSessionId = 'session-2025-2026';
const activeSemesterIds = ['semester-2025-2026-1', 'semester-2025-2026-2'];

const departmentCourseThemes: Record<string, string[]> = {
  'dept-csc': ['Programming', 'Algorithms', 'Networks', 'Data Systems', 'Software Practice', 'Security Lab'],
  'dept-mcb': ['Cell Biology', 'Molecular Methods', 'Microbial Ecology', 'Applied Lab', 'Clinical Practice', 'Bioinformatics'],
  'dept-mat': ['Calculus', 'Algebra', 'Modelling', 'Statistics', 'Numerical Methods', 'Operations Research'],
  'dept-eng': ['Language Study', 'Critical Reading', 'Writing Lab', 'Drama Studies', 'Media Writing', 'Theory Seminar'],
  'dept-his': ['Historical Method', 'Diplomatic Practice', 'Regional Studies', 'Archive Seminar', 'Policy Review', 'Global Affairs'],
  'dept-acc': ['Financial Reporting', 'Audit Practice', 'Taxation', 'Corporate Analysis', 'Cost Control', 'Forensic Review'],
  'dept-fin': ['Financial Markets', 'Risk Methods', 'Treasury Practice', 'Investment Lab', 'Banking Operations', 'Portfolio Theory'],
  'dept-eco': ['Microeconomics', 'Macroeconomics', 'Policy Analysis', 'Econometrics', 'Development Studies', 'Business Intelligence'],
};

const departmentById = new Map(departments.map((department) => [department.id, department]));
const programmesByDepartmentId = departments.reduce<Record<string, Programme[]>>((accumulator, department) => {
  accumulator[department.id] = programmes.filter((programme) => programme.departmentId === department.id);
  return accumulator;
}, {});

export const courses: Course[] = departments.flatMap((department, departmentIndex) =>
  levelPools.flatMap((levelId, levelIndex) => {
    const lecturerPool = users.filter((user) => user.departmentId === department.id && user.roleId === 'role-lecturer');

    return activeSemesterIds.flatMap((semesterId, semesterIndex) =>
      Array.from({ length: 2 }).map((_, courseIndex) => {
        const serial = departmentIndex * 100 + levelIndex * 20 + semesterIndex * 10 + courseIndex + 1;
        const codeNumber = 111 + levelIndex * 100 + semesterIndex * 20 + courseIndex * 5 + (departmentIndex % 3);
        const lecturer = lecturerPool[(courseIndex + levelIndex + semesterIndex) % lecturerPool.length];
        const themePool = departmentCourseThemes[department.id] ?? semesterCourseTags;
        const theme = themePool[(serial + courseIndex) % themePool.length];
        const previousCourseCode =
          levelIndex === 0
            ? []
            : [`${department.code}${111 + (levelIndex - 1) * 100 + semesterIndex * 20 + (departmentIndex % 3)}`];

        return {
          id: `course-${department.id}-${levelId}-${semesterIndex + 1}-${courseIndex + 1}`,
          code: `${department.code}${codeNumber}`,
          title: `${department.name} ${theme}`,
          departmentId: department.id,
          levelId,
          semesterId,
          units: courseIndex === 0 ? 3 : 2,
          type: levelIndex === 0 && courseIndex === 0 ? 'gst' : levelIndex > 1 && courseIndex === 1 ? 'elective' : 'core',
          prerequisites: previousCourseCode,
          lecturerId: serial % 17 === 0 ? undefined : lecturer?.id,
        };
      }),
    );
  }),
);

export const programmeCourses: ProgrammeCourse[] = programmes.flatMap((programme) => {
  const siblingProgrammes = programmesByDepartmentId[programme.departmentId] ?? [];
  const siblingIndex = Math.max(
    siblingProgrammes.findIndex((siblingProgramme) => siblingProgramme.id === programme.id),
    0,
  );

  return courses
    .filter((course) => course.departmentId === programme.departmentId)
    .filter((course, courseIndex) => {
      if (siblingProgrammes.length <= 1) {
        return true;
      }

      return course.type === 'gst' || courseIndex % siblingProgrammes.length === siblingIndex || courseIndex % 5 === 0;
    })
    .map((course) => ({
      id: `programme-course-${programme.id}-${course.id}`,
      programmeId: programme.id,
      courseId: course.id,
    }));
});

function applicantDocuments(seed: number) {
  return [
    { name: 'O-Level Result', status: 'received' as const },
    { name: 'JAMB Result Slip', status: 'received' as const },
    { name: 'Birth Certificate', status: seed % 5 === 0 ? 'missing' as const : 'received' as const },
    { name: 'State of Origin', status: seed % 7 === 0 ? 'flagged' as const : 'received' as const },
  ];
}

export const applicants: Applicant[] = Array.from({ length: 240 }).map((_, index) => {
  const programme = programmes[index % programmes.length];
  const department = departmentById.get(programme.departmentId)!;
  const aggregateScore = 48 + (index % 42);
  const statusCycle = index % 8;
  const admissionStatus =
    statusCycle <= 1 ? 'screening' : statusCycle <= 3 ? 'offered' : statusCycle <= 5 ? 'accepted' : statusCycle === 6 ? 'deferred' : 'declined';
  const paymentStatus = admissionStatus === 'accepted' && index % 4 !== 0 ? 'successful' : admissionStatus === 'offered' ? 'pending' : 'failed';
  const clearanceStatus =
    admissionStatus === 'accepted' && paymentStatus === 'successful'
      ? index % 6 === 0
        ? 'held'
        : index % 5 === 0
          ? 'pending'
          : 'cleared'
      : admissionStatus === 'offered'
        ? 'pending'
        : 'queried';

  return {
    id: `applicant-${index + 1}`,
    applicationNumber: `UNI/AP/${String(index + 1).padStart(4, '0')}`,
    fullName: makeName(index),
    gender: index % 2 === 0 ? 'Female' : 'Male',
    stateOfOrigin: states[index % states.length],
    email: makeEmail(index),
    phone: makePhone(index + 20),
    entryMode: index % 9 === 0 ? 'Direct Entry' : 'UTME',
    facultyId: department.facultyId,
    departmentId: department.id,
    programmeId: programme.id,
    sessionId: currentSessionId,
    jambScore: 178 + (index % 90),
    screeningScore: 42 + (index % 35),
    aggregateScore,
    admissionStatus,
    offerDate: admissionStatus === 'offered' || admissionStatus === 'accepted' ? `2026-0${(index % 3) + 1}-${String((index % 18) + 10).padStart(2, '0')}` : undefined,
    acceptancePaymentStatus: paymentStatus,
    clearanceStatus,
    assignedOfficerId: index % 3 === 0 ? 'user-registry-1' : 'user-bursary-1',
    notes:
      clearanceStatus === 'held'
        ? 'Medical certificate mismatch requires registrar sign-off.'
        : admissionStatus === 'screening'
          ? 'Awaiting post-UTME review and departmental shortlist.'
          : 'Application progressing within the current cycle.',
    documents: applicantDocuments(index),
  };
});

function adviserForDepartment(departmentId: string) {
  return users.find((user) => user.departmentId === departmentId && user.roleId === 'role-lecturer')?.id ?? 'user-registry-1';
}

function studentDocuments(seed: number) {
  return [
    { name: 'Birth Certificate', status: 'received' as const },
    { name: 'Admission Letter', status: 'received' as const },
    { name: 'State of Origin', status: seed % 13 === 0 ? 'flagged' as const : 'received' as const },
    { name: 'Medical Clearance', status: seed % 11 === 0 ? 'missing' as const : 'received' as const },
  ];
}

export const students: Student[] = Array.from({ length: 720 }).map((_, index) => {
  const programme = programmes[index % programmes.length];
  const department = departmentById.get(programme.departmentId)!;
  const levelIndex = index % programme.durationYears;
  const level = levels[levelIndex];
  const yearCode = 2022 + (index % 4);
  const status =
    index % 21 === 0 ? 'inactive' : index % 13 === 0 ? 'probation' : index % 29 === 0 ? 'deferred' : 'active';
  const clearanceStatus =
    status === 'inactive' ? 'held' : index % 12 === 0 ? 'pending' : index % 17 === 0 ? 'held' : 'cleared';

  return {
    id: `student-${index + 1}`,
    matricNumber: `UNI/${yearCode}/${department.code}/${String(index + 1).padStart(4, '0')}`,
    fullName: makeName(index + 240),
    gender: index % 2 === 0 ? 'Male' : 'Female',
    email: makeEmail(index + 240),
    phone: makePhone(index + 400),
    stateOfOrigin: states[(index + 3) % states.length],
    entryMode: index % 10 === 0 ? 'Direct Entry' : 'UTME',
    sessionId: index % 2 === 0 ? 'session-2025-2026' : 'session-2024-2025',
    facultyId: department.facultyId,
    departmentId: programme.departmentId,
    programmeId: programme.id,
    levelId: level.id,
    adviserId: adviserForDepartment(programme.departmentId),
    status,
    clearanceStatus,
    sponsorName: `${makeName(index + 36)} Family`,
    sponsorPhone: makePhone(index + 800),
    nextOfKin: makeName(index + 1000),
    nextOfKinPhone: makePhone(index + 1200),
    documents: studentDocuments(index),
  };
});

const facultyFeeTemplates: FeeTemplate[] = faculties.map((faculty, index) => ({
  id: `fee-template-${faculty.id}`,
  name: `${faculty.name} Returning Student Fees`,
  facultyId: faculty.id,
  items: [
    { id: `fee-${faculty.id}-tuition`, label: 'Tuition', amount: 185000 + index * 10000 },
    { id: `fee-${faculty.id}-dept`, label: 'Departmental Fee', amount: 25000 + index * 2500 },
    { id: `fee-${faculty.id}-ict`, label: 'ICT Levy', amount: 18000 },
    { id: `fee-${faculty.id}-library`, label: 'Library Fee', amount: 12000 },
    { id: `fee-${faculty.id}-medical`, label: 'Medical Fee', amount: 14000 },
  ],
}));

export const feeTemplates: FeeTemplate[] = [
  ...facultyFeeTemplates,
  {
    id: 'fee-template-acceptance',
    name: 'Acceptance Fee',
    items: [
      { id: 'acceptance-main', label: 'Acceptance Fee', amount: 85000 },
      { id: 'acceptance-screening', label: 'Freshers Verification Pack', amount: 15000 },
    ],
  },
];

function templateForFaculty(facultyId: string) {
  return feeTemplates.find((item) => item.facultyId === facultyId) ?? feeTemplates[0];
}

export const studentInvoices: Invoice[] = students.map((student, index) => {
  const template = templateForFaculty(student.facultyId);
  const totalAmount = template.items.reduce((sum, item) => sum + item.amount, 0);
  const status = index % 5 === 0 ? 'unpaid' : index % 5 === 1 ? 'part_paid' : index % 8 === 0 ? 'overdue' : 'paid';
  const amountPaid =
    status === 'paid' ? totalAmount : status === 'part_paid' ? Math.round(totalAmount * 0.58) : status === 'overdue' ? Math.round(totalAmount * 0.2) : 0;

  return {
    id: `invoice-student-${student.id}`,
    invoiceNumber: `INV/STU/${String(index + 1).padStart(5, '0')}`,
    studentId: student.id,
    feeTemplateId: template.id,
    sessionId: currentSessionId,
    semesterId: currentSemesterId,
    status,
    totalAmount,
    amountPaid,
    dueDate: '2026-04-15',
    generatedAt: `2026-02-${String((index % 18) + 10).padStart(2, '0')}`,
    holdReason:
      status === 'unpaid' || status === 'overdue'
        ? 'Registration hold active until the bursary confirms minimum payment threshold.'
        : undefined,
  };
});

export const applicantInvoices: Invoice[] = applicants
  .filter((applicant) => applicant.admissionStatus === 'accepted' || applicant.admissionStatus === 'offered')
  .map((applicant, index) => ({
    id: `invoice-applicant-${applicant.id}`,
    invoiceNumber: `INV/APP/${String(index + 1).padStart(5, '0')}`,
    applicantId: applicant.id,
    feeTemplateId: 'fee-template-acceptance',
    sessionId: currentSessionId,
    status: applicant.acceptancePaymentStatus === 'successful' ? 'paid' : applicant.acceptancePaymentStatus === 'pending' ? 'part_paid' : 'unpaid',
    totalAmount: 100000,
    amountPaid: applicant.acceptancePaymentStatus === 'successful' ? 100000 : applicant.acceptancePaymentStatus === 'pending' ? 55000 : 0,
    dueDate: '2026-03-30',
    generatedAt: '2026-02-12',
    holdReason: applicant.acceptancePaymentStatus === 'successful' ? undefined : 'Freshers acceptance payment still outstanding.',
  }));

export const invoices: Invoice[] = [...studentInvoices, ...applicantInvoices];

export const payments: Payment[] = invoices.flatMap((invoice, index): Payment[] => {
  if (!invoice.amountPaid) {
    return [];
  }

  if (invoice.amountPaid === invoice.totalAmount) {
    return [
      {
        id: `payment-${invoice.id}-1`,
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        channel: index % 4 === 0 ? 'Paystack' : index % 4 === 1 ? 'Remita' : index % 4 === 2 ? 'Bank Transfer' : 'POS',
        status: 'successful',
        paidAt: `2026-03-${String((index % 18) + 1).padStart(2, '0')}`,
        reference: `PAY-${String(index + 1).padStart(7, '0')}`,
      },
    ];
  }

  return [
    {
      id: `payment-${invoice.id}-1`,
      invoiceId: invoice.id,
      amount: Math.round(invoice.amountPaid * 0.65),
      channel: 'Paystack',
      status: 'successful',
      paidAt: `2026-03-${String((index % 12) + 1).padStart(2, '0')}`,
      reference: `PAY-${String(index + 1).padStart(7, '0')}`,
    },
    {
      id: `payment-${invoice.id}-2`,
      invoiceId: invoice.id,
      amount: invoice.amountPaid - Math.round(invoice.amountPaid * 0.65),
      channel: 'Bank Transfer',
      status: 'reconciled',
      paidAt: `2026-03-${String((index % 12) + 10).padStart(2, '0')}`,
      reference: `PAY-${String(index + 8).padStart(7, '0')}`,
    },
  ];
});

function registrationCourses(student: Student, semesterId: string) {
  const attachedCourseIds = new Set(
    programmeCourses.filter((attachment) => attachment.programmeId === student.programmeId).map((attachment) => attachment.courseId),
  );

  return courses
    .filter((course) => attachedCourseIds.has(course.id) && course.levelId === student.levelId && course.semesterId === semesterId)
    .slice(0, 3);
}

export const registrations: CourseRegistration[] = students
  .filter((student) => student.status !== 'inactive')
  .map((student, index) => {
    const invoice = studentInvoices.find((item) => item.studentId === student.id)!;
    const status =
      invoice.status === 'unpaid' || invoice.status === 'overdue'
        ? 'held'
        : index % 6 === 0
          ? 'pending'
          : index % 19 === 0
            ? 'rejected'
            : 'approved';
    const coursesForStudent = registrationCourses(student, currentSemesterId);
    const totalUnits = coursesForStudent.reduce((sum, item) => sum + item.units, 0);

    return {
      id: `registration-${student.id}`,
      studentId: student.id,
      sessionId: currentSessionId,
      semesterId: currentSemesterId,
      status,
      adviserReview: status === 'pending' ? 'pending' : status === 'held' ? 'held' : 'approved',
      hodReview: status === 'approved' ? 'approved' : status === 'held' ? 'held' : 'pending',
      hasFinancialHold: invoice.status === 'unpaid' || invoice.status === 'overdue',
      totalUnits,
      maxUnits: student.status === 'probation' ? 18 : 24,
      submittedAt: `2026-03-${String((index % 20) + 1).padStart(2, '0')}`,
    };
  });

export const registrationItems: RegistrationItem[] = registrations.flatMap((registration) => {
  const student = students.find((item) => item.id === registration.studentId)!;

  return registrationCourses(student, registration.semesterId).map((course, itemIndex) => ({
    id: `registration-item-${registration.id}-${itemIndex + 1}`,
    registrationId: registration.id,
    courseId: course.id,
    status: registration.status === 'approved' ? 'approved' : registration.status,
  }));
});

function computeResult(totalScore: number) {
  if (totalScore >= 70) return { grade: 'A', gradePoint: 5 };
  if (totalScore >= 60) return { grade: 'B', gradePoint: 4 };
  if (totalScore >= 50) return { grade: 'C', gradePoint: 3 };
  if (totalScore >= 45) return { grade: 'D', gradePoint: 2 };
  if (totalScore >= 40) return { grade: 'E', gradePoint: 1 };
  return { grade: 'F', gradePoint: 0 };
}

export const results: ResultEntry[] = registrationItems.map((item, index) => {
  const registration = registrations.find((entry) => entry.id === item.registrationId)!;
  const baseTotal = 37 + ((index * 7) % 42);
  const result = computeResult(baseTotal);
  const status = index % 14 === 0 ? 'not_submitted' : registration.status === 'approved' ? (index % 4 === 0 ? 'published' : 'approved') : 'pending';

  return {
    id: `result-${item.id}`,
    registrationId: registration.id,
    registrationItemId: item.id,
    studentId: registration.studentId,
    courseId: item.courseId,
    semesterId: registration.semesterId,
    sessionId: registration.sessionId,
    caScore: Math.round(baseTotal * 0.4),
    examScore: baseTotal - Math.round(baseTotal * 0.4),
    totalScore: baseTotal,
    grade: result.grade,
    gradePoint: result.gradePoint,
    status,
    carryover: result.grade === 'F',
  };
});

// ── Hostel & Accommodation ──────────────────────────────────────────

const blockDefs: Array<{ id: string; name: string; type: 'male' | 'female'; location: string; rooms: number; bedsPerRoom: 3 | 4; porter: string }> = [
  { id: 'block-moremi', name: 'Moremi Hall', type: 'female', location: 'North Campus', rooms: 20, bedsPerRoom: 3, porter: 'Mrs. Ngozi Eze' },
  { id: 'block-awo', name: 'Awo Hall', type: 'male', location: 'South Campus', rooms: 24, bedsPerRoom: 3, porter: 'Mr. Segun Akinyemi' },
  { id: 'block-amina', name: 'Amina Hall', type: 'female', location: 'East Campus', rooms: 16, bedsPerRoom: 4, porter: 'Mrs. Fatima Garba' },
  { id: 'block-soyinka', name: 'Soyinka Hall', type: 'male', location: 'West Campus', rooms: 20, bedsPerRoom: 3, porter: 'Mr. Tunde Balogun' },
];

export const hostelBlocks: HostelBlock[] = blockDefs.map((def) => ({
  id: def.id,
  name: def.name,
  type: def.type,
  location: def.location,
  totalRooms: def.rooms,
  totalBeds: def.rooms * def.bedsPerRoom,
  porterName: def.porter,
}));

const floorLabels = ['A', 'B', 'C', 'D'];

export const hostelRooms: HostelRoom[] = blockDefs.flatMap((def) => {
  const roomsPerFloor = Math.ceil(def.rooms / 2);
  return Array.from({ length: def.rooms }).map((_, index) => {
    const floor = Math.floor(index / roomsPerFloor);
    const roomOnFloor = (index % roomsPerFloor) + 1;
    return {
      id: `room-${def.id}-${index + 1}`,
      blockId: def.id,
      roomNumber: `${floorLabels[floor]}-${String(roomOnFloor).padStart(2, '0')}`,
      type: def.bedsPerRoom === 4 ? 'quad' as const : 'triple' as const,
      floor: floor + 1,
      capacity: def.bedsPerRoom,
    };
  });
});

// Assign a subset of active 100L/200L students, respecting gender
const assignableStudents = students.filter((s) => s.status === 'active' && (s.levelId === 'level-100' || s.levelId === 'level-200'));
const maleStudents = assignableStudents.filter((s) => s.gender === 'Male');
const femaleStudents = assignableStudents.filter((s) => s.gender === 'Female');
const maleRooms = hostelRooms.filter((r) => blockDefs.find((b) => b.id === r.blockId)!.type === 'male');
const femaleRooms = hostelRooms.filter((r) => blockDefs.find((b) => b.id === r.blockId)!.type === 'female');

function buildAssignments(studentPool: Student[], roomPool: typeof hostelRooms, maxAssignments: number): RoomAssignment[] {
  const assignments: RoomAssignment[] = [];
  const roomOccupancy = new Map<string, number>();

  for (let i = 0; i < Math.min(studentPool.length, maxAssignments); i++) {
    const student = studentPool[i];
    // Find room with space
    const room = roomPool.find((r) => (roomOccupancy.get(r.id) ?? 0) < r.capacity);
    if (!room) break;
    const currentCount = roomOccupancy.get(room.id) ?? 0;
    roomOccupancy.set(room.id, currentCount + 1);

    assignments.push({
      id: `hostel-assign-${student.id}`,
      roomId: room.id,
      blockId: room.blockId,
      studentId: student.id,
      sessionId: currentSessionId,
      assignedDate: '2025-09-10',
      status: i % 8 === 0 ? 'assigned' : 'occupied',
      checkInDate: i % 8 === 0 ? undefined : '2025-09-15',
    });
  }
  return assignments;
}

export const roomAssignments: RoomAssignment[] = [
  ...buildAssignments(maleStudents, maleRooms, 45),
  ...buildAssignments(femaleStudents, femaleRooms, 40),
];

export const universitySeed = {
  faculties,
  departments,
  programmes,
  academicSessions,
  semesters,
  levels,
  roles,
  users,
  courses,
  programmeCourses,
  applicants,
  students,
  feeTemplates,
  invoices,
  payments,
  registrations,
  registrationItems,
  results,
  hostelBlocks,
  hostelRooms,
  roomAssignments,
  currentSessionId,
  currentSemesterId,
};
