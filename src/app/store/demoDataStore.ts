import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { universitySeed } from '../../data/seeds/university';
import type {
  Applicant,
  ClearanceStatus,
  CourseType,
  DocumentStatus,
  EntryMode,
  Gender,
  PaymentChannel,
  RegistrationStatus,
  Student,
  UniversityDataset,
} from '../../types/domain';

const STORAGE_KEY = 'unicare-demo-data-v4';
const memoryStorage = new Map<string, string>();

function createSafeDemoStorage(): StateStorage {
  return {
    getItem: (name) => {
      const memoryValue = memoryStorage.get(name) ?? null;

      if (typeof window === 'undefined') {
        return memoryValue;
      }

      try {
        return window.localStorage.getItem(name) ?? memoryValue;
      } catch {
        return memoryValue;
      }
    },
    setItem: (name, value) => {
      memoryStorage.set(name, value);

      if (typeof window === 'undefined') {
        return;
      }

      try {
        window.localStorage.setItem(name, value);
      } catch (error) {
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          try {
            window.localStorage.removeItem(name);
          } catch {
            // Ignore cleanup failures and keep the in-memory copy.
          }

          console.warn('Demo data exceeded browser storage quota. Changes will continue in memory for this session.');
          return;
        }

        throw error;
      }
    },
    removeItem: (name) => {
      memoryStorage.delete(name);

      if (typeof window === 'undefined') {
        return;
      }

      try {
        window.localStorage.removeItem(name);
      } catch {
        // Ignore storage cleanup failures.
      }
    },
  };
}

interface ActionResult {
  ok: boolean;
  message: string;
  id?: string;
}

interface ApplicantInput {
  fullName: string;
  gender: Gender;
  stateOfOrigin: string;
  email: string;
  phone: string;
  entryMode: EntryMode;
  programmeId: string;
  jambScore: number;
  screeningScore: number;
  notes: string;
}

interface ApplicantUpdateInput extends ApplicantInput {
  assignedOfficerId: string;
}

interface CreateInvoiceInput {
  ownerType: 'student' | 'applicant';
  ownerId: string;
  feeTemplateId: string;
  dueDate: string;
}

interface PostPaymentInput {
  invoiceId: string;
  amount: number;
  channel: PaymentChannel;
}

interface FacultyInput {
  name: string;
  dean: string;
  office: string;
}

interface DepartmentInput {
  facultyId: string;
  name: string;
  code: string;
  hod: string;
}

interface ProgrammeInput {
  departmentId: string;
  name: string;
  award: string;
  durationYears: number;
}

interface SessionInput {
  name: string;
  isCurrent: boolean;
}

interface SemesterInput {
  sessionId: string;
  name: string;
  order: number;
  isCurrent: boolean;
}

interface CourseInput {
  departmentId: string;
  levelId: string;
  semesterId: string;
  code: string;
  title: string;
  units: number;
  type: CourseType;
  lecturerId?: string;
  prerequisites: string[];
  programmeIds: string[];
}

interface DemoDataState {
  data: UniversityDataset;
  revision: number;
  resetDemoData: () => void;
  createApplicant: (input: ApplicantInput) => ActionResult;
  updateApplicant: (applicantId: string, input: ApplicantUpdateInput) => ActionResult;
  cycleApplicantDocumentStatus: (applicantId: string, documentName: string) => ActionResult;
  issueOffer: (applicantId: string) => ActionResult;
  markApplicantAccepted: (applicantId: string) => ActionResult;
  updateApplicantClearance: (applicantId: string, clearanceStatus: ClearanceStatus) => ActionResult;
  convertApplicantToStudent: (applicantId: string) => ActionResult;
  createInvoice: (input: CreateInvoiceInput) => ActionResult;
  postPayment: (input: PostPaymentInput) => ActionResult;
  createFaculty: (input: FacultyInput) => ActionResult;
  updateFaculty: (facultyId: string, input: FacultyInput) => ActionResult;
  createDepartment: (input: DepartmentInput) => ActionResult;
  updateDepartment: (departmentId: string, input: DepartmentInput) => ActionResult;
  createProgramme: (input: ProgrammeInput) => ActionResult;
  updateProgramme: (programmeId: string, input: ProgrammeInput) => ActionResult;
  createSession: (input: SessionInput) => ActionResult;
  updateSession: (sessionId: string, input: SessionInput) => ActionResult;
  createSemester: (input: SemesterInput) => ActionResult;
  updateSemester: (semesterId: string, input: SemesterInput) => ActionResult;
  createCourse: (input: CourseInput) => ActionResult;
  updateCourse: (courseId: string, input: CourseInput) => ActionResult;
  updateRegistrationReview: (registrationId: string, field: 'adviserReview' | 'hodReview', status: RegistrationStatus) => ActionResult;
  addCourseToRegistration: (registrationId: string, courseId: string) => ActionResult;
  dropCourseFromRegistration: (registrationId: string, courseId: string) => ActionResult;
  updateResultEntry: (resultId: string, caScore: number, examScore: number) => ActionResult;
  approveResult: (resultId: string) => ActionResult;
  assignRoom: (input: { studentId: string; roomId: string }) => ActionResult;
  vacateAssignment: (assignmentId: string) => ActionResult;
}

function cloneSeed(): UniversityDataset {
  return JSON.parse(JSON.stringify(universitySeed)) as UniversityDataset;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function aggregateScore(jambScore: number, screeningScore: number) {
  return Math.round(jambScore * 0.2 + screeningScore * 0.8);
}

function cycleDocumentStatus(status: DocumentStatus): DocumentStatus {
  if (status === 'received') return 'flagged';
  if (status === 'flagged') return 'missing';
  return 'received';
}

function computeGrade(totalScore: number) {
  if (totalScore >= 70) return { grade: 'A', gradePoint: 5 };
  if (totalScore >= 60) return { grade: 'B', gradePoint: 4 };
  if (totalScore >= 50) return { grade: 'C', gradePoint: 3 };
  if (totalScore >= 45) return { grade: 'D', gradePoint: 2 };
  if (totalScore >= 40) return { grade: 'E', gradePoint: 1 };
  return { grade: 'F', gradePoint: 0 };
}

function computeInvoiceStatus(totalAmount: number, amountPaid: number, dueDate: string) {
  if (amountPaid >= totalAmount) {
    return 'paid' as const;
  }

  if (amountPaid > 0) {
    return new Date(dueDate).getTime() < new Date(todayIso()).getTime() ? ('overdue' as const) : ('part_paid' as const);
  }

  return new Date(dueDate).getTime() < new Date(todayIso()).getTime() ? ('overdue' as const) : ('unpaid' as const);
}

function totalForTemplate(data: UniversityDataset, feeTemplateId: string) {
  return (
    data.feeTemplates.find((template) => template.id === feeTemplateId)?.items.reduce((sum, item) => sum + item.amount, 0) ?? 0
  );
}

function adviserForDepartment(data: UniversityDataset, departmentId: string) {
  return data.users.find((user) => user.departmentId === departmentId && user.roleId === 'role-lecturer')?.id ?? 'user-registry-1';
}

function departmentCode(data: UniversityDataset, departmentId: string) {
  return data.departments.find((department) => department.id === departmentId)?.code ?? 'GEN';
}

function facultyIdForDepartment(data: UniversityDataset, departmentId: string) {
  return data.departments.find((department) => department.id === departmentId)?.facultyId;
}

function nextApplicantNumber(data: UniversityDataset) {
  return `UNI/AP/${String(data.applicants.length + 1).padStart(4, '0')}`;
}

function nextInvoiceNumber(data: UniversityDataset, ownerType: 'student' | 'applicant') {
  const prefix = ownerType === 'student' ? 'INV/STU' : 'INV/APP';
  const existing = data.invoices.filter((invoice) => (ownerType === 'student' ? Boolean(invoice.studentId) : Boolean(invoice.applicantId))).length;
  return `${prefix}/${String(existing + 1).padStart(5, '0')}`;
}

function nextMatricNumber(data: UniversityDataset, departmentId: string) {
  const entryYear = data.currentSessionId.split('-')[1] ?? '2025';
  const existing = data.students.filter((student) => student.departmentId === departmentId).length + 1;
  return `UNI/${entryYear}/${departmentCode(data, departmentId)}/${String(existing).padStart(4, '0')}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function nextDepartmentCode(name: string) {
  return name
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
}

function upsertCurrentFlag<T extends { id: string; isCurrent: boolean }>(items: T[], selectedId: string, nextIsCurrent: boolean) {
  return items.map((item) => ({
    ...item,
    isCurrent: nextIsCurrent ? item.id === selectedId : item.id === selectedId ? false : item.isCurrent,
  }));
}

function validateCourseProgrammes(data: UniversityDataset, departmentId: string, programmeIds: string[]) {
  if (!departmentId) {
    return 'Select a department first.';
  }

  const invalidProgramme = programmeIds.find((programmeId) => data.programmes.find((programme) => programme.id === programmeId)?.departmentId !== departmentId);
  if (invalidProgramme) {
    return 'Courses can only be attached to programmes within the selected department.';
  }

  return null;
}

function registrationStatusFromReviews(
  adviserReview: RegistrationStatus,
  hodReview: RegistrationStatus,
  hasFinancialHold: boolean,
) {
  if (hasFinancialHold) return 'held' as const;
  if (hodReview === 'approved') return 'approved' as const;
  if (adviserReview === 'rejected' || hodReview === 'rejected') return 'rejected' as const;
  if (adviserReview === 'held' || hodReview === 'held') return 'held' as const;
  if (adviserReview === 'pending' || hodReview === 'pending') return 'pending' as const;
  return 'draft' as const;
}

function syncDerivedState(rawData: UniversityDataset) {
  const data = rawData;

  data.invoices = data.invoices.map((invoice) => {
    const nextStatus = invoice.status === 'waived' ? 'waived' : computeInvoiceStatus(invoice.totalAmount, invoice.amountPaid, invoice.dueDate);
    const isHeld = nextStatus === 'unpaid' || nextStatus === 'overdue';

    return {
      ...invoice,
      status: nextStatus,
      holdReason:
        invoice.status === 'waived'
          ? undefined
          : isHeld
            ? invoice.applicantId
              ? 'Freshers acceptance payment still outstanding.'
              : 'Registration hold active until the bursary confirms minimum payment threshold.'
            : undefined,
    };
  });

  data.applicants = data.applicants.map((applicant) => {
    const applicantInvoice = data.invoices.find((invoice) => invoice.applicantId === applicant.id);
    const acceptancePaymentStatus = applicantInvoice
      ? applicantInvoice.status === 'paid'
        ? 'successful'
        : applicantInvoice.amountPaid > 0
          ? 'pending'
          : 'failed'
      : applicant.acceptancePaymentStatus;

    const clearanceStatus =
      acceptancePaymentStatus !== 'successful' && applicant.clearanceStatus === 'cleared'
        ? 'pending'
        : applicant.clearanceStatus;

    return {
      ...applicant,
      acceptancePaymentStatus,
      clearanceStatus,
    };
  });

  data.registrations = data.registrations.map((registration) => {
    const currentInvoice = data.invoices.find(
      (invoice) =>
        invoice.studentId === registration.studentId &&
        invoice.sessionId === registration.sessionId &&
        invoice.semesterId === registration.semesterId,
    );
    const hasFinancialHold = currentInvoice ? currentInvoice.status === 'unpaid' || currentInvoice.status === 'overdue' : false;
    const totalUnits = data.registrationItems
      .filter((item) => item.registrationId === registration.id)
      .reduce((sum, item) => sum + (data.courses.find((course) => course.id === item.courseId)?.units ?? 0), 0);

    return {
      ...registration,
      totalUnits,
      hasFinancialHold,
      status: registrationStatusFromReviews(registration.adviserReview, registration.hodReview, hasFinancialHold),
    };
  });

  return data;
}

function ensureAcceptanceInvoice(data: UniversityDataset, applicantId: string) {
  const existing = data.invoices.find((invoice) => invoice.applicantId === applicantId);
  if (existing) {
    return existing.id;
  }

  const invoiceId = `invoice-applicant-${applicantId}`;
  data.invoices.unshift({
    id: invoiceId,
    invoiceNumber: nextInvoiceNumber(data, 'applicant'),
    applicantId,
    feeTemplateId: 'fee-template-acceptance',
    sessionId: data.currentSessionId,
    status: 'unpaid',
    totalAmount: totalForTemplate(data, 'fee-template-acceptance'),
    amountPaid: 0,
    dueDate: todayIso(),
    generatedAt: todayIso(),
    holdReason: 'Freshers acceptance payment still outstanding.',
  });

  return invoiceId;
}

function buildStudentFromApplicant(data: UniversityDataset, applicant: Applicant): Student {
  return {
    id: `student-demo-${Date.now()}`,
    matricNumber: nextMatricNumber(data, applicant.departmentId),
    fullName: applicant.fullName,
    gender: applicant.gender,
    email: applicant.email,
    phone: applicant.phone,
    stateOfOrigin: applicant.stateOfOrigin,
    entryMode: applicant.entryMode,
    sessionId: data.currentSessionId,
    facultyId: applicant.facultyId,
    departmentId: applicant.departmentId,
    programmeId: applicant.programmeId,
    levelId: 'level-100',
    adviserId: adviserForDepartment(data, applicant.departmentId),
    status: 'active',
    clearanceStatus: 'cleared',
    sponsorName: `${applicant.fullName} Sponsor`,
    sponsorPhone: applicant.phone,
    nextOfKin: `${applicant.fullName.split(' ')[0]} Family Contact`,
    nextOfKinPhone: applicant.phone,
    documents: applicant.documents,
  };
}

export const useDemoDataStore = create<DemoDataState>()(
  persist(
    (set, get) => ({
      data: cloneSeed(),
      revision: 0,

      resetDemoData: () => {
        set((state) => ({
          data: cloneSeed(),
          revision: state.revision + 1,
        }));
      },

      createApplicant: (input) => {
        const data = cloneSeedFromStore(get().data);
        const programme = data.programmes.find((item) => item.id === input.programmeId);

        if (!programme) {
          return { ok: false, message: 'Select a valid programme before saving.' };
        }

        const department = data.departments.find((item) => item.id === programme.departmentId);

        if (!department) {
          return { ok: false, message: 'Programme is missing a linked department.' };
        }

        const facultyId = facultyIdForDepartment(data, department.id);
        if (!facultyId) {
          return { ok: false, message: 'Department is missing a linked faculty.' };
        }

        const applicantId = `applicant-demo-${Date.now()}`;
        data.applicants.unshift({
          id: applicantId,
          applicationNumber: nextApplicantNumber(data),
          fullName: input.fullName,
          gender: input.gender,
          stateOfOrigin: input.stateOfOrigin,
          email: input.email,
          phone: input.phone,
          entryMode: input.entryMode,
          facultyId,
          departmentId: department.id,
          programmeId: programme.id,
          sessionId: data.currentSessionId,
          jambScore: parseAmount(input.jambScore),
          screeningScore: parseAmount(input.screeningScore),
          aggregateScore: aggregateScore(parseAmount(input.jambScore), parseAmount(input.screeningScore)),
          admissionStatus: 'screening',
          acceptancePaymentStatus: 'pending',
          clearanceStatus: 'pending',
          assignedOfficerId: 'user-registry-1',
          notes: input.notes || 'New demo applicant created from the interactive phase-2 flow.',
          documents: [
            { name: 'O-Level Result', status: 'received' },
            { name: 'JAMB Result Slip', status: 'received' },
            { name: 'Birth Certificate', status: 'missing' },
            { name: 'State of Origin', status: 'missing' },
          ],
        });

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Applicant created successfully.', id: applicantId };
      },

      updateApplicant: (applicantId, input) => {
        const data = cloneSeedFromStore(get().data);
        const programme = data.programmes.find((item) => item.id === input.programmeId);
        const applicantIndex = data.applicants.findIndex((item) => item.id === applicantId);

        if (applicantIndex === -1 || !programme) {
          return { ok: false, message: 'Applicant or programme not found.' };
        }

        const department = data.departments.find((item) => item.id === programme.departmentId);
        const facultyId = department ? facultyIdForDepartment(data, department.id) : undefined;

        data.applicants[applicantIndex] = {
          ...data.applicants[applicantIndex],
          fullName: input.fullName,
          gender: input.gender,
          stateOfOrigin: input.stateOfOrigin,
          email: input.email,
          phone: input.phone,
          entryMode: input.entryMode,
          facultyId: facultyId ?? data.applicants[applicantIndex].facultyId,
          departmentId: department?.id ?? data.applicants[applicantIndex].departmentId,
          programmeId: programme.id,
          jambScore: parseAmount(input.jambScore),
          screeningScore: parseAmount(input.screeningScore),
          aggregateScore: aggregateScore(parseAmount(input.jambScore), parseAmount(input.screeningScore)),
          notes: input.notes,
          assignedOfficerId: input.assignedOfficerId,
        };

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Applicant record updated.' };
      },

      cycleApplicantDocumentStatus: (applicantId, documentName) => {
        const data = cloneSeedFromStore(get().data);
        const applicant = data.applicants.find((item) => item.id === applicantId);

        if (!applicant) {
          return { ok: false, message: 'Applicant not found.' };
        }

        applicant.documents = applicant.documents.map((document) =>
          document.name === documentName ? { ...document, status: cycleDocumentStatus(document.status) } : document,
        );

        if (applicant.documents.some((document) => document.status === 'flagged')) {
          applicant.clearanceStatus = 'held';
        } else if (applicant.documents.some((document) => document.status === 'missing')) {
          applicant.clearanceStatus = 'pending';
        }

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: `Updated ${documentName}.` };
      },

      issueOffer: (applicantId) => {
        const data = cloneSeedFromStore(get().data);
        const applicant = data.applicants.find((item) => item.id === applicantId);

        if (!applicant) {
          return { ok: false, message: 'Applicant not found.' };
        }

        applicant.admissionStatus = 'offered';
        applicant.offerDate = todayIso();
        applicant.clearanceStatus = 'pending';
        applicant.notes = 'Admission offer issued from the demo workflow.';
        ensureAcceptanceInvoice(data, applicantId);

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Admission offer issued and acceptance invoice generated.' };
      },

      markApplicantAccepted: (applicantId) => {
        const data = cloneSeedFromStore(get().data);
        const applicant = data.applicants.find((item) => item.id === applicantId);

        if (!applicant) {
          return { ok: false, message: 'Applicant not found.' };
        }

        applicant.admissionStatus = 'accepted';
        applicant.offerDate = applicant.offerDate ?? todayIso();
        applicant.notes = 'Applicant marked as accepted and ready for fresher onboarding.';
        ensureAcceptanceInvoice(data, applicantId);

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Applicant moved into the accepted state.' };
      },

      updateApplicantClearance: (applicantId, clearanceStatus) => {
        const data = cloneSeedFromStore(get().data);
        const applicant = data.applicants.find((item) => item.id === applicantId);

        if (!applicant) {
          return { ok: false, message: 'Applicant not found.' };
        }

        applicant.clearanceStatus = clearanceStatus;

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: `Clearance moved to ${clearanceStatus}.` };
      },

      convertApplicantToStudent: (applicantId) => {
        const data = cloneSeedFromStore(get().data);
        const applicant = data.applicants.find((item) => item.id === applicantId);

        if (!applicant) {
          return { ok: false, message: 'Applicant not found.' };
        }

        const existingStudent = data.students.find((student) => student.email === applicant.email);
        if (existingStudent) {
          return { ok: false, message: 'This applicant has already been converted to a student.', id: existingStudent.id };
        }

        if (applicant.admissionStatus !== 'accepted' || applicant.clearanceStatus !== 'cleared') {
          return { ok: false, message: 'Only accepted and fully cleared applicants can be converted to students.' };
        }

        const student = buildStudentFromApplicant(data, applicant);
        data.students.unshift(student);
        applicant.notes = `Converted to student record ${student.matricNumber}.`;

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Applicant converted to a student record.', id: student.id };
      },

      createInvoice: (input) => {
        const data = cloneSeedFromStore(get().data);
        const template = data.feeTemplates.find((item) => item.id === input.feeTemplateId);

        if (!template) {
          return { ok: false, message: 'Fee template not found.' };
        }

        if (input.ownerType === 'student' && !data.students.find((student) => student.id === input.ownerId)) {
          return { ok: false, message: 'Student owner not found.' };
        }

        if (input.ownerType === 'applicant' && !data.applicants.find((applicant) => applicant.id === input.ownerId)) {
          return { ok: false, message: 'Applicant owner not found.' };
        }

        const invoiceId = `invoice-demo-${Date.now()}`;
        data.invoices.unshift({
          id: invoiceId,
          invoiceNumber: nextInvoiceNumber(data, input.ownerType),
          studentId: input.ownerType === 'student' ? input.ownerId : undefined,
          applicantId: input.ownerType === 'applicant' ? input.ownerId : undefined,
          feeTemplateId: input.feeTemplateId,
          sessionId: data.currentSessionId,
          semesterId: input.ownerType === 'student' ? data.currentSemesterId : undefined,
          status: 'unpaid',
          totalAmount: totalForTemplate(data, input.feeTemplateId),
          amountPaid: 0,
          dueDate: input.dueDate,
          generatedAt: todayIso(),
        });

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Invoice generated successfully.', id: invoiceId };
      },

      postPayment: (input) => {
        const data = cloneSeedFromStore(get().data);
        const invoice = data.invoices.find((item) => item.id === input.invoiceId);

        if (!invoice) {
          return { ok: false, message: 'Invoice not found.' };
        }

        const amount = parseAmount(input.amount);
        const balance = Math.max(invoice.totalAmount - invoice.amountPaid, 0);

        if (!amount || amount > balance) {
          return { ok: false, message: 'Enter a valid amount that does not exceed the current invoice balance.' };
        }

        invoice.amountPaid += amount;
        data.payments.unshift({
          id: `payment-demo-${Date.now()}`,
          invoiceId: invoice.id,
          amount,
          channel: input.channel,
          status: 'successful',
          paidAt: todayIso(),
          reference: `PAY-DEMO-${String(data.payments.length + 1).padStart(6, '0')}`,
        });

        set((state) => ({
          data: syncDerivedState(data),
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Payment posted successfully.', id: invoice.id };
      },

      createFaculty: (input) => {
        const data = cloneSeedFromStore(get().data);

        if (!input.name.trim()) {
          return { ok: false, message: 'Faculty name is required.' };
        }

        const facultyId = `faculty-${slugify(input.name) || Date.now()}`;
        data.faculties.unshift({
          id: facultyId,
          name: input.name.trim(),
          dean: input.dean.trim() || 'Dean pending assignment',
          office: input.office.trim() || 'Faculty office pending setup',
        });

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Faculty created successfully.', id: facultyId };
      },

      updateFaculty: (facultyId, input) => {
        const data = cloneSeedFromStore(get().data);
        const faculty = data.faculties.find((item) => item.id === facultyId);

        if (!faculty) {
          return { ok: false, message: 'Faculty not found.' };
        }

        faculty.name = input.name.trim();
        faculty.dean = input.dean.trim();
        faculty.office = input.office.trim();

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Faculty updated successfully.', id: facultyId };
      },

      createDepartment: (input) => {
        const data = cloneSeedFromStore(get().data);

        if (!input.facultyId || !data.faculties.find((faculty) => faculty.id === input.facultyId)) {
          return { ok: false, message: 'Choose a valid faculty before creating a department.' };
        }

        if (!input.name.trim()) {
          return { ok: false, message: 'Department name is required.' };
        }

        const departmentId = `dept-${slugify(input.name) || Date.now()}`;
        data.departments.unshift({
          id: departmentId,
          facultyId: input.facultyId,
          name: input.name.trim(),
          code: input.code.trim().toUpperCase() || nextDepartmentCode(input.name),
          hod: input.hod.trim() || 'HOD pending assignment',
        });

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Department created successfully.', id: departmentId };
      },

      updateDepartment: (departmentId, input) => {
        const data = cloneSeedFromStore(get().data);
        const department = data.departments.find((item) => item.id === departmentId);

        if (!department) {
          return { ok: false, message: 'Department not found.' };
        }

        if (!input.facultyId || !data.faculties.find((faculty) => faculty.id === input.facultyId)) {
          return { ok: false, message: 'Choose a valid faculty before saving the department.' };
        }

        department.facultyId = input.facultyId;
        department.name = input.name.trim();
        department.code = input.code.trim().toUpperCase() || department.code;
        department.hod = input.hod.trim();

        const nextFacultyId = input.facultyId;
        data.programmes
          .filter((programme) => programme.departmentId === departmentId)
          .forEach((programme) => {
            data.applicants
              .filter((applicant) => applicant.programmeId === programme.id)
              .forEach((applicant) => {
                applicant.facultyId = nextFacultyId;
                applicant.departmentId = departmentId;
              });

            data.students
              .filter((student) => student.programmeId === programme.id)
              .forEach((student) => {
                student.facultyId = nextFacultyId;
                student.departmentId = departmentId;
              });
          });

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Department updated successfully.', id: departmentId };
      },

      createProgramme: (input) => {
        const data = cloneSeedFromStore(get().data);

        if (!input.departmentId || !data.departments.find((department) => department.id === input.departmentId)) {
          return { ok: false, message: 'Choose a valid department before creating a programme.' };
        }

        if (!input.name.trim()) {
          return { ok: false, message: 'Programme name is required.' };
        }

        const programmeId = `prog-${slugify(input.name) || Date.now()}`;
        data.programmes.unshift({
          id: programmeId,
          departmentId: input.departmentId,
          name: input.name.trim(),
          award: input.award.trim() || 'B.Sc',
          durationYears: Math.max(1, parseAmount(input.durationYears)),
        });

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Programme created successfully.', id: programmeId };
      },

      updateProgramme: (programmeId, input) => {
        const data = cloneSeedFromStore(get().data);
        const programme = data.programmes.find((item) => item.id === programmeId);

        if (!programme) {
          return { ok: false, message: 'Programme not found.' };
        }

        if (!input.departmentId || !data.departments.find((department) => department.id === input.departmentId)) {
          return { ok: false, message: 'Choose a valid department before saving the programme.' };
        }

        const nextFacultyId = facultyIdForDepartment(data, input.departmentId);
        if (!nextFacultyId) {
          return { ok: false, message: 'Selected department is missing a linked faculty.' };
        }

        programme.departmentId = input.departmentId;
        programme.name = input.name.trim();
        programme.award = input.award.trim() || programme.award;
        programme.durationYears = Math.max(1, parseAmount(input.durationYears));

        data.applicants
          .filter((applicant) => applicant.programmeId === programmeId)
          .forEach((applicant) => {
            applicant.departmentId = input.departmentId;
            applicant.facultyId = nextFacultyId;
          });

        data.students
          .filter((student) => student.programmeId === programmeId)
          .forEach((student) => {
            student.departmentId = input.departmentId;
            student.facultyId = nextFacultyId;
          });

        data.programmeCourses = data.programmeCourses.filter((attachment) => {
          if (attachment.programmeId !== programmeId) {
            return true;
          }

          const course = data.courses.find((item) => item.id === attachment.courseId);
          return course?.departmentId === input.departmentId;
        });

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Programme updated successfully.', id: programmeId };
      },

      createSession: (input) => {
        const data = cloneSeedFromStore(get().data);

        if (!input.name.trim()) {
          return { ok: false, message: 'Session name is required.' };
        }

        const sessionId = `session-${slugify(input.name) || Date.now()}`;
        data.academicSessions.unshift({
          id: sessionId,
          name: input.name.trim(),
          isCurrent: input.isCurrent,
        });

        if (input.isCurrent) {
          data.academicSessions = upsertCurrentFlag(data.academicSessions, sessionId, true);
          data.currentSessionId = sessionId;
        }

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Academic session created successfully.', id: sessionId };
      },

      updateSession: (sessionId, input) => {
        const data = cloneSeedFromStore(get().data);
        const session = data.academicSessions.find((item) => item.id === sessionId);

        if (!session) {
          return { ok: false, message: 'Academic session not found.' };
        }

        session.name = input.name.trim();
        session.isCurrent = input.isCurrent;

        if (input.isCurrent) {
          data.academicSessions = upsertCurrentFlag(data.academicSessions, sessionId, true);
          data.currentSessionId = sessionId;
        }

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Academic session updated successfully.', id: sessionId };
      },

      createSemester: (input) => {
        const data = cloneSeedFromStore(get().data);

        if (!input.sessionId || !data.academicSessions.find((session) => session.id === input.sessionId)) {
          return { ok: false, message: 'Choose a valid academic session before creating a semester.' };
        }

        if (!input.name.trim()) {
          return { ok: false, message: 'Semester name is required.' };
        }

        const semesterId = `semester-${slugify(`${input.sessionId}-${input.name}`) || Date.now()}`;
        data.semesters.unshift({
          id: semesterId,
          sessionId: input.sessionId,
          name: input.name.trim(),
          order: Math.max(1, parseAmount(input.order)),
          isCurrent: input.isCurrent,
        });

        if (input.isCurrent) {
          data.semesters = upsertCurrentFlag(data.semesters, semesterId, true);
          data.currentSemesterId = semesterId;
          data.currentSessionId = input.sessionId;
        }

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Semester created successfully.', id: semesterId };
      },

      updateSemester: (semesterId, input) => {
        const data = cloneSeedFromStore(get().data);
        const semester = data.semesters.find((item) => item.id === semesterId);

        if (!semester) {
          return { ok: false, message: 'Semester not found.' };
        }

        if (!input.sessionId || !data.academicSessions.find((session) => session.id === input.sessionId)) {
          return { ok: false, message: 'Choose a valid academic session before saving the semester.' };
        }

        semester.sessionId = input.sessionId;
        semester.name = input.name.trim();
        semester.order = Math.max(1, parseAmount(input.order));
        semester.isCurrent = input.isCurrent;

        if (input.isCurrent) {
          data.semesters = upsertCurrentFlag(data.semesters, semesterId, true);
          data.currentSemesterId = semesterId;
          data.currentSessionId = input.sessionId;
        }

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Semester updated successfully.', id: semesterId };
      },

      createCourse: (input) => {
        const data = cloneSeedFromStore(get().data);

        if (!input.departmentId || !data.departments.find((department) => department.id === input.departmentId)) {
          return { ok: false, message: 'Choose a valid department before creating a course.' };
        }

        if (!data.levels.find((level) => level.id === input.levelId)) {
          return { ok: false, message: 'Choose a valid level before creating a course.' };
        }

        if (!data.semesters.find((semester) => semester.id === input.semesterId)) {
          return { ok: false, message: 'Choose a valid semester before creating a course.' };
        }

        const validationError = validateCourseProgrammes(data, input.departmentId, input.programmeIds);
        if (validationError) {
          return { ok: false, message: validationError };
        }

        const courseId = `course-${slugify(`${input.departmentId}-${input.code || input.title}`) || Date.now()}`;
        data.courses.unshift({
          id: courseId,
          departmentId: input.departmentId,
          levelId: input.levelId,
          semesterId: input.semesterId,
          code: input.code.trim().toUpperCase(),
          title: input.title.trim(),
          units: Math.max(1, parseAmount(input.units)),
          type: input.type,
          lecturerId: input.lecturerId || undefined,
          prerequisites: input.prerequisites.filter(Boolean),
        });

        data.programmeCourses = [
          ...input.programmeIds.map((programmeId) => ({
            id: `programme-course-${programmeId}-${courseId}`,
            programmeId,
            courseId,
          })),
          ...data.programmeCourses,
        ];

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Course created successfully.', id: courseId };
      },

      updateCourse: (courseId, input) => {
        const data = cloneSeedFromStore(get().data);
        const course = data.courses.find((item) => item.id === courseId);

        if (!course) {
          return { ok: false, message: 'Course not found.' };
        }

        const validationError = validateCourseProgrammes(data, input.departmentId, input.programmeIds);
        if (validationError) {
          return { ok: false, message: validationError };
        }

        course.departmentId = input.departmentId;
        course.levelId = input.levelId;
        course.semesterId = input.semesterId;
        course.code = input.code.trim().toUpperCase();
        course.title = input.title.trim();
        course.units = Math.max(1, parseAmount(input.units));
        course.type = input.type;
        course.lecturerId = input.lecturerId || undefined;
        course.prerequisites = input.prerequisites.filter(Boolean);

        data.programmeCourses = data.programmeCourses.filter((attachment) => attachment.courseId !== courseId);
        data.programmeCourses.unshift(
          ...input.programmeIds.map((programmeId) => ({
            id: `programme-course-${programmeId}-${courseId}`,
            programmeId,
            courseId,
          })),
        );

        set((state) => ({
          data,
          revision: state.revision + 1,
        }));

        return { ok: true, message: 'Course updated successfully.', id: courseId };
      },

      updateRegistrationReview: (registrationId, field, status) => {
        const data = cloneSeedFromStore(get().data);
        const registration = data.registrations.find((item) => item.id === registrationId);
        if (!registration) {
          return { ok: false, message: 'Registration not found.' };
        }
        registration[field] = status;
        set((state) => ({ data: syncDerivedState(data), revision: state.revision + 1 }));
        const label = field === 'adviserReview' ? 'Adviser' : 'HOD';
        return { ok: true, message: `${label} review set to ${status}.`, id: registrationId };
      },

      addCourseToRegistration: (registrationId, courseId) => {
        const data = cloneSeedFromStore(get().data);
        const registration = data.registrations.find((item) => item.id === registrationId);
        if (!registration) {
          return { ok: false, message: 'Registration not found.' };
        }
        const course = data.courses.find((item) => item.id === courseId);
        if (!course) {
          return { ok: false, message: 'Course not found.' };
        }
        const existing = data.registrationItems.find(
          (item) => item.registrationId === registrationId && item.courseId === courseId,
        );
        if (existing) {
          return { ok: false, message: 'Course already in this registration.' };
        }
        const currentUnits = data.registrationItems
          .filter((item) => item.registrationId === registrationId)
          .reduce((sum, item) => sum + (data.courses.find((c) => c.id === item.courseId)?.units ?? 0), 0);
        if (currentUnits + course.units > registration.maxUnits) {
          return { ok: false, message: `Adding ${course.code} would exceed max units (${registration.maxUnits}).` };
        }
        data.registrationItems.unshift({
          id: `reg-item-demo-${Date.now()}`,
          registrationId,
          courseId,
          status: 'pending',
        });
        set((state) => ({ data: syncDerivedState(data), revision: state.revision + 1 }));
        return { ok: true, message: `${course.code} added to registration.` };
      },

      dropCourseFromRegistration: (registrationId, courseId) => {
        const data = cloneSeedFromStore(get().data);
        const idx = data.registrationItems.findIndex(
          (item) => item.registrationId === registrationId && item.courseId === courseId,
        );
        if (idx === -1) {
          return { ok: false, message: 'Course not found in this registration.' };
        }
        const course = data.courses.find((item) => item.id === courseId);
        data.registrationItems.splice(idx, 1);
        data.results = data.results.filter(
          (item) => !(item.registrationId === registrationId && item.courseId === courseId),
        );
        set((state) => ({ data: syncDerivedState(data), revision: state.revision + 1 }));
        return { ok: true, message: `${course?.code ?? 'Course'} dropped from registration.` };
      },

      updateResultEntry: (resultId, caScore, examScore) => {
        const data = cloneSeedFromStore(get().data);
        const entry = data.results.find((item) => item.id === resultId);
        if (!entry) {
          return { ok: false, message: 'Result entry not found.' };
        }
        const ca = Math.min(40, Math.max(0, Math.round(caScore)));
        const exam = Math.min(60, Math.max(0, Math.round(examScore)));
        const totalScore = ca + exam;
        const { grade, gradePoint } = computeGrade(totalScore);
        entry.caScore = ca;
        entry.examScore = exam;
        entry.totalScore = totalScore;
        entry.grade = grade;
        entry.gradePoint = gradePoint;
        entry.carryover = totalScore < 40;
        entry.status = 'pending';
        set((state) => ({ data, revision: state.revision + 1 }));
        return { ok: true, message: `Score updated: ${totalScore} (${grade}).`, id: resultId };
      },

      approveResult: (resultId) => {
        const data = cloneSeedFromStore(get().data);
        const entry = data.results.find((item) => item.id === resultId);
        if (!entry) {
          return { ok: false, message: 'Result entry not found.' };
        }
        if (entry.status === 'not_submitted') {
          return { ok: false, message: 'Cannot approve a result that has not been submitted.' };
        }
        entry.status = entry.status === 'approved' ? 'published' : 'approved';
        set((state) => ({ data, revision: state.revision + 1 }));
        return { ok: true, message: `Result ${entry.status}.`, id: resultId };
      },

      assignRoom: (input) => {
        const data = cloneSeedFromStore(get().data);
        const room = data.hostelRooms.find((r) => r.id === input.roomId);
        if (!room) return { ok: false, message: 'Room not found.' };

        const block = data.hostelBlocks.find((b) => b.id === room.blockId);
        if (!block) return { ok: false, message: 'Block not found.' };

        const student = data.students.find((s) => s.id === input.studentId);
        if (!student) return { ok: false, message: 'Student not found.' };

        const genderMatch = (block.type === 'male' && student.gender === 'Male') || (block.type === 'female' && student.gender === 'Female');
        if (!genderMatch) return { ok: false, message: `${block.name} is a ${block.type} hall. Cannot assign a ${student.gender.toLowerCase()} student.` };

        const currentOccupancy = data.roomAssignments.filter(
          (a) => a.roomId === input.roomId && (a.status === 'occupied' || a.status === 'assigned'),
        ).length;
        if (currentOccupancy >= room.capacity) return { ok: false, message: 'Room is at full capacity.' };

        const existing = data.roomAssignments.find(
          (a) => a.studentId === input.studentId && a.sessionId === data.currentSessionId && a.status !== 'vacated',
        );
        if (existing) return { ok: false, message: 'Student already has an active room assignment this session.' };

        const id = `hostel-assign-${Date.now()}`;
        data.roomAssignments.unshift({
          id,
          roomId: input.roomId,
          blockId: room.blockId,
          studentId: input.studentId,
          sessionId: data.currentSessionId,
          assignedDate: todayIso(),
          status: 'assigned',
        });

        set((state) => ({ data, revision: state.revision + 1 }));
        return { ok: true, message: `${student.fullName} assigned to ${block.name} Room ${room.roomNumber}.`, id };
      },

      vacateAssignment: (assignmentId) => {
        const data = cloneSeedFromStore(get().data);
        const assignment = data.roomAssignments.find((a) => a.id === assignmentId);
        if (!assignment) return { ok: false, message: 'Assignment not found.' };
        if (assignment.status === 'vacated') return { ok: false, message: 'Assignment already vacated.' };

        assignment.status = 'vacated';
        assignment.checkOutDate = todayIso();
        set((state) => ({ data, revision: state.revision + 1 }));
        return { ok: true, message: 'Room assignment vacated.', id: assignmentId };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(createSafeDemoStorage),
      partialize: (state) => ({ data: state.data, revision: state.revision }),
    },
  ),
);

function cloneSeedFromStore(data: UniversityDataset) {
  return JSON.parse(JSON.stringify(data)) as UniversityDataset;
}

export function useDemoRevision() {
  return useDemoDataStore((state) => state.revision);
}
