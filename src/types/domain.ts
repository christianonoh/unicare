export type AdmissionStatus = 'screening' | 'offered' | 'accepted' | 'deferred' | 'declined';
export type ClearanceStatus = 'pending' | 'cleared' | 'held' | 'queried';
export type StudentStatus = 'active' | 'inactive' | 'probation' | 'deferred' | 'graduated';
export type InvoiceStatus = 'paid' | 'part_paid' | 'unpaid' | 'overdue' | 'waived';
export type PaymentStatus = 'successful' | 'pending' | 'failed' | 'reconciled';
export type PaymentChannel = 'Paystack' | 'Bank Transfer' | 'Remita' | 'POS';
export type RegistrationStatus = 'draft' | 'pending' | 'approved' | 'held' | 'rejected';
export type ResultApprovalStatus = 'not_submitted' | 'pending' | 'approved' | 'published';
export type CourseType = 'core' | 'elective' | 'gst';
export type EntryMode = 'UTME' | 'Direct Entry' | 'Transfer';
export type Gender = 'Male' | 'Female';
export type DocumentStatus = 'received' | 'missing' | 'flagged';
export type HostelType = 'male' | 'female';
export type RoomType = 'double' | 'triple' | 'quad';
export type AssignmentStatus = 'assigned' | 'occupied' | 'vacated';

export interface Faculty {
  id: string;
  name: string;
  dean: string;
  office: string;
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
  code: string;
  hod: string;
}

export interface Programme {
  id: string;
  departmentId: string;
  name: string;
  award: string;
  durationYears: number;
}

export interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface Semester {
  id: string;
  sessionId: string;
  name: string;
  order: number;
  isCurrent: boolean;
}

export interface Level {
  id: string;
  name: string;
  order: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  departmentId?: string;
  facultyId?: string;
  phone: string;
}

export interface Role {
  id: string;
  name: string;
  scope: string;
  permissions: string[];
}

export interface Course {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  levelId: string;
  semesterId: string;
  units: number;
  type: CourseType;
  prerequisites: string[];
  lecturerId?: string;
}

export interface ProgrammeCourse {
  id: string;
  programmeId: string;
  courseId: string;
}

export interface DocumentRecord {
  name: string;
  status: DocumentStatus;
}

export interface Applicant {
  id: string;
  applicationNumber: string;
  fullName: string;
  gender: Gender;
  stateOfOrigin: string;
  email: string;
  phone: string;
  entryMode: EntryMode;
  facultyId: string;
  departmentId: string;
  programmeId: string;
  sessionId: string;
  jambScore: number;
  screeningScore: number;
  aggregateScore: number;
  admissionStatus: AdmissionStatus;
  offerDate?: string;
  acceptancePaymentStatus: PaymentStatus;
  clearanceStatus: ClearanceStatus;
  assignedOfficerId: string;
  notes: string;
  documents: DocumentRecord[];
}

export interface Student {
  id: string;
  matricNumber: string;
  fullName: string;
  gender: Gender;
  email: string;
  phone: string;
  stateOfOrigin: string;
  entryMode: EntryMode;
  sessionId: string;
  facultyId: string;
  departmentId: string;
  programmeId: string;
  levelId: string;
  adviserId: string;
  status: StudentStatus;
  clearanceStatus: ClearanceStatus;
  sponsorName: string;
  sponsorPhone: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  documents: DocumentRecord[];
}

export interface FeeItem {
  id: string;
  label: string;
  amount: number;
}

export interface FeeTemplate {
  id: string;
  name: string;
  facultyId?: string;
  programmeId?: string;
  levelId?: string;
  items: FeeItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId?: string;
  applicantId?: string;
  feeTemplateId: string;
  sessionId: string;
  semesterId?: string;
  status: InvoiceStatus;
  totalAmount: number;
  amountPaid: number;
  dueDate: string;
  generatedAt: string;
  holdReason?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  channel: PaymentChannel;
  status: PaymentStatus;
  paidAt: string;
  reference: string;
}

export interface RegistrationItem {
  id: string;
  registrationId: string;
  courseId: string;
  status: RegistrationStatus;
}

export interface CourseRegistration {
  id: string;
  studentId: string;
  sessionId: string;
  semesterId: string;
  status: RegistrationStatus;
  adviserReview: RegistrationStatus;
  hodReview: RegistrationStatus;
  hasFinancialHold: boolean;
  totalUnits: number;
  maxUnits: number;
  submittedAt: string;
}

export interface ResultEntry {
  id: string;
  registrationId: string;
  registrationItemId: string;
  studentId: string;
  courseId: string;
  semesterId: string;
  sessionId: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  status: ResultApprovalStatus;
  carryover: boolean;
}

export interface HostelBlock {
  id: string;
  name: string;
  type: HostelType;
  location: string;
  totalRooms: number;
  totalBeds: number;
  porterName: string;
}

export interface HostelRoom {
  id: string;
  blockId: string;
  roomNumber: string;
  type: RoomType;
  floor: number;
  capacity: number;
}

export interface RoomAssignment {
  id: string;
  roomId: string;
  blockId: string;
  studentId: string;
  sessionId: string;
  assignedDate: string;
  status: AssignmentStatus;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface DashboardSummary {
  totalStudents: number;
  activeApplicants: number;
  clearancePending: number;
  outstandingRevenue: number;
  registrationApproved: number;
  resultsAwaitingApproval: number;
  totalBeds: number;
  occupiedBeds: number;
}

export interface UniversityDataset {
  faculties: Faculty[];
  departments: Department[];
  programmes: Programme[];
  academicSessions: AcademicSession[];
  semesters: Semester[];
  levels: Level[];
  roles: Role[];
  users: User[];
  courses: Course[];
  programmeCourses: ProgrammeCourse[];
  applicants: Applicant[];
  students: Student[];
  feeTemplates: FeeTemplate[];
  invoices: Invoice[];
  payments: Payment[];
  registrations: CourseRegistration[];
  registrationItems: RegistrationItem[];
  results: ResultEntry[];
  hostelBlocks: HostelBlock[];
  hostelRooms: HostelRoom[];
  roomAssignments: RoomAssignment[];
  currentSessionId: string;
  currentSemesterId: string;
}
