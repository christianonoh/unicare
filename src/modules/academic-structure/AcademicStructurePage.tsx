import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getReferenceData,
  listCourseCatalog,
  listDepartmentHierarchy,
  listFacultyHierarchy,
  listProgrammeHierarchy,
  listSessionHierarchy,
} from '../../data/services/universityData';
import { statusTone } from '../../lib/status';
import type { CourseType } from '../../types/domain';
import { toast } from '../../lib/toast';

type AcademicStructureView = 'faculties' | 'departments' | 'programmes' | 'sessions' | 'courses';
type FormMode = 'create' | 'edit';

interface AcademicStructurePageProps {
  view?: AcademicStructureView;
}

interface FacultyDraft {
  name: string;
  dean: string;
  office: string;
}

interface DepartmentDraft {
  facultyId: string;
  name: string;
  code: string;
  hod: string;
}

interface ProgrammeDraft {
  departmentId: string;
  name: string;
  award: string;
  durationYears: number;
}

interface SessionDraft {
  name: string;
  isCurrent: boolean;
}

interface SemesterDraft {
  sessionId: string;
  name: string;
  order: number;
  isCurrent: boolean;
}

interface CourseDraft {
  departmentId: string;
  levelId: string;
  semesterId: string;
  code: string;
  title: string;
  units: number;
  type: CourseType;
  lecturerId: string;
  prerequisitesText: string;
  programmeIds: string[];
}

const viewContent: Record<
  AcademicStructureView,
  {
    eyebrow: string;
    title: string;
    description: string;
    actionLabel: string;
    dependencyTitle: string;
    dependencyLines: string[];
  }
> = {
  faculties: {
    eyebrow: 'Institution model',
    title: 'Faculties',
    description: 'Faculties are the top academic owners. Departments sit under them, and every programme inherits its faculty through the department.',
    actionLabel: 'New faculty',
    dependencyTitle: 'Academic ownership chain',
    dependencyLines: [
      'Faculties are created first and act as the highest governance layer in the academic tree.',
      'Every department must point to one faculty before it can exist in the demo.',
      'Programmes never choose a faculty directly. They inherit it from their department.',
    ],
  },
  departments: {
    eyebrow: 'Institution model',
    title: 'Departments',
    description: 'Departments sit directly under faculties and become the operational home for programmes, lecturers, HOD approvals, and department-owned courses.',
    actionLabel: 'New department',
    dependencyTitle: 'Department dependency',
    dependencyLines: [
      'A department cannot be created without choosing a parent faculty first.',
      'Programmes and courses both depend on the department layer to define academic ownership.',
      'Changing a department changes the inherited faculty context for any linked programmes.',
    ],
  },
  programmes: {
    eyebrow: 'Institution model',
    title: 'Programmes',
    description: 'Programmes are the actual admission and progression targets for students. They belong to departments only, and faculty is inherited automatically.',
    actionLabel: 'New programme',
    dependencyTitle: 'Programme dependency',
    dependencyLines: [
      'A programme must belong to one department and inherits its faculty through that department.',
      'Students, applicants, and course attachments all use programme records as their academic path.',
      'Courses can be shared across multiple programmes inside the same department.',
    ],
  },
  sessions: {
    eyebrow: 'Academic calendar',
    title: 'Sessions & semesters',
    description: 'Sessions control the academic year. Semesters depend on sessions and provide the time dimension used by billing, registration, and result processing.',
    actionLabel: 'New session',
    dependencyTitle: 'Calendar dependency',
    dependencyLines: [
      'Sessions are university-wide and stand alone.',
      'Semesters cannot be created without selecting a parent session.',
      'Courses are offered against both level and semester, which is how time meets academic ownership.',
    ],
  },
  courses: {
    eyebrow: 'Academic catalog',
    title: 'Course catalog',
    description: 'Courses now belong to departments, not single programmes. They are then attached to one or many programmes within that department.',
    actionLabel: 'New course',
    dependencyTitle: 'Course dependency',
    dependencyLines: [
      'Choose the department first, then define the level and semester offering.',
      'The course can then be attached to one or many programmes from that same department.',
      'This makes the relationship teachable: departments own courses, programmes consume them.',
    ],
  },
};

function formatProgrammeLabel(programme: { award: string; name: string }) {
  return `${programme.award} ${programme.name}`;
}

function parseCommaList(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function AcademicStructurePage({ view = 'faculties' }: AcademicStructurePageProps) {
  useDemoRevision();
  const { faculties, departments, programmes, academicSessions, semesters, levels, users, programmeCourses } = getReferenceData();
  const facultyRows = listFacultyHierarchy();
  const departmentRows = listDepartmentHierarchy();
  const programmeRows = listProgrammeHierarchy();
  const sessionRows = listSessionHierarchy();
  const courseRows = listCourseCatalog();
  const lecturerOptions = users.filter((user) => user.roleId === 'role-lecturer');

  const createFaculty = useDemoDataStore((state) => state.createFaculty);
  const updateFaculty = useDemoDataStore((state) => state.updateFaculty);
  const createDepartment = useDemoDataStore((state) => state.createDepartment);
  const updateDepartment = useDemoDataStore((state) => state.updateDepartment);
  const createProgramme = useDemoDataStore((state) => state.createProgramme);
  const updateProgramme = useDemoDataStore((state) => state.updateProgramme);
  const createSession = useDemoDataStore((state) => state.createSession);
  const updateSession = useDemoDataStore((state) => state.updateSession);
  const createSemester = useDemoDataStore((state) => state.createSemester);
  const updateSemester = useDemoDataStore((state) => state.updateSemester);
  const createCourse = useDemoDataStore((state) => state.createCourse);
  const updateCourse = useDemoDataStore((state) => state.updateCourse);

  const [query, setQuery] = useState('');
  const [departmentFacultyFilter, setDepartmentFacultyFilter] = useState('all');
  const [programmeFacultyFilter, setProgrammeFacultyFilter] = useState('all');
  const [programmeDepartmentFilter, setProgrammeDepartmentFilter] = useState('all');
  const [courseFacultyFilter, setCourseFacultyFilter] = useState('all');
  const [courseDepartmentFilter, setCourseDepartmentFilter] = useState('all');
  const [courseProgrammeFilter, setCourseProgrammeFilter] = useState('all');
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [formError, setFormError] = useState('');

  const [facultyDraft, setFacultyDraft] = useState<FacultyDraft>({
    name: '',
    dean: '',
    office: '',
  });
  const [departmentDraft, setDepartmentDraft] = useState<DepartmentDraft>({
    facultyId: faculties[0]?.id ?? '',
    name: '',
    code: '',
    hod: '',
  });
  const [programmeDraft, setProgrammeDraft] = useState<ProgrammeDraft>({
    departmentId: departments[0]?.id ?? '',
    name: '',
    award: 'B.Sc',
    durationYears: 4,
  });
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>({
    name: '',
    isCurrent: false,
  });
  const [semesterDraft, setSemesterDraft] = useState<SemesterDraft>({
    sessionId: academicSessions[0]?.id ?? '',
    name: 'First Semester',
    order: 1,
    isCurrent: false,
  });
  const [courseDraft, setCourseDraft] = useState<CourseDraft>({
    departmentId: departments[0]?.id ?? '',
    levelId: levels[0]?.id ?? '',
    semesterId: semesters[0]?.id ?? '',
    code: '',
    title: '',
    units: 3,
    type: 'core',
    lecturerId: '',
    prerequisitesText: '',
    programmeIds: programmes.filter((programme) => programme.departmentId === departments[0]?.id).map((programme) => programme.id),
  });

  const derivedProgrammeFaculty = useMemo(() => {
    const selectedDepartment = departments.find((department) => department.id === programmeDraft.departmentId);
    return faculties.find((faculty) => faculty.id === selectedDepartment?.facultyId);
  }, [departments, faculties, programmeDraft.departmentId]);

  const departmentById = useMemo(
    () => new Map(departmentRows.map((department) => [department.id, department])),
    [departmentRows],
  );

  const programmeDepartmentOptions = useMemo(
    () =>
      programmeFacultyFilter === 'all'
        ? departmentRows
        : departmentRows.filter((department) => department.facultyId === programmeFacultyFilter),
    [departmentRows, programmeFacultyFilter],
  );

  const courseDepartmentOptions = useMemo(
    () =>
      courseFacultyFilter === 'all'
        ? departmentRows
        : departmentRows.filter((department) => department.facultyId === courseFacultyFilter),
    [courseFacultyFilter, departmentRows],
  );

  const courseProgrammeOptions = useMemo(() => {
    if (courseDepartmentFilter !== 'all') {
      return programmeRows.filter((programme) => programme.departmentId === courseDepartmentFilter);
    }

    if (courseFacultyFilter !== 'all') {
      const departmentIds = new Set(courseDepartmentOptions.map((department) => department.id));
      return programmeRows.filter((programme) => departmentIds.has(programme.departmentId));
    }

    return programmeRows;
  }, [courseDepartmentFilter, courseDepartmentOptions, courseFacultyFilter, programmeRows]);

  const courseProgrammes = useMemo(
    () => programmes.filter((programme) => programme.departmentId === courseDraft.departmentId),
    [courseDraft.departmentId, programmes],
  );
  const derivedCourseFaculty = useMemo(() => {
    const selectedDepartment = departments.find((department) => department.id === courseDraft.departmentId);
    return faculties.find((faculty) => faculty.id === selectedDepartment?.facultyId);
  }, [courseDraft.departmentId, departments, faculties]);
  const filteredCourses = useMemo(
    () =>
      courseRows.filter(
        (course) =>
          (courseFacultyFilter === 'all' || departmentById.get(course.departmentId)?.facultyId === courseFacultyFilter) &&
          (courseDepartmentFilter === 'all' || course.departmentId === courseDepartmentFilter) &&
          (courseProgrammeFilter === 'all' ||
            course.attachedProgrammes.some((programme) => programme.id === courseProgrammeFilter)) &&
          (course.code.toLowerCase().includes(query.toLowerCase()) ||
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.departmentName.toLowerCase().includes(query.toLowerCase())),
      ),
    [courseDepartmentFilter, courseFacultyFilter, courseProgrammeFilter, courseRows, departmentById, query],
  );

  const filteredDepartmentRows = useMemo(
    () =>
      departmentFacultyFilter === 'all'
        ? departmentRows
        : departmentRows.filter((department) => department.facultyId === departmentFacultyFilter),
    [departmentFacultyFilter, departmentRows],
  );

  const filteredProgrammeRows = useMemo(
    () =>
      programmeRows.filter((programme) => {
        const facultyId = departmentById.get(programme.departmentId)?.facultyId;

        return (
          (programmeFacultyFilter === 'all' || facultyId === programmeFacultyFilter) &&
          (programmeDepartmentFilter === 'all' || programme.departmentId === programmeDepartmentFilter)
        );
      }),
    [departmentById, programmeDepartmentFilter, programmeFacultyFilter, programmeRows],
  );

  const stats = {
    faculties: faculties.length,
    departments: departments.length,
    programmes: programmes.length,
    courses: courseRows.length,
    sessions: academicSessions.length,
    semesters: semesters.length,
  };

  function closeEntityModal() {
    setShowEntityModal(false);
    setEditingId(null);
    setFormError('');
  }

  function closeSemesterModal() {
    setShowSemesterModal(false);
    setEditingId(null);
    setFormError('');
  }

  function openCreateModal() {
    setFormMode('create');
    setEditingId(null);
    setFormError('');

    if (view === 'faculties') {
      setFacultyDraft({ name: '', dean: '', office: '' });
      setShowEntityModal(true);
      return;
    }

    if (view === 'departments') {
      setDepartmentDraft({
        facultyId: faculties[0]?.id ?? '',
        name: '',
        code: '',
        hod: '',
      });
      setShowEntityModal(true);
      return;
    }

    if (view === 'programmes') {
      setProgrammeDraft({
        departmentId: departments[0]?.id ?? '',
        name: '',
        award: 'B.Sc',
        durationYears: 4,
      });
      setShowEntityModal(true);
      return;
    }

    if (view === 'sessions') {
      setSessionDraft({ name: '', isCurrent: false });
      setShowEntityModal(true);
      return;
    }

    setCourseDraft({
      departmentId: departments[0]?.id ?? '',
      levelId: levels[0]?.id ?? '',
      semesterId: semesters[0]?.id ?? '',
      code: '',
      title: '',
      units: 3,
      type: 'core',
      lecturerId: '',
      prerequisitesText: '',
      programmeIds: programmes.filter((programme) => programme.departmentId === departments[0]?.id).map((programme) => programme.id),
    });
    setShowEntityModal(true);
  }

  function openEditFaculty(facultyId: string) {
    const faculty = faculties.find((item) => item.id === facultyId);
    if (!faculty) return;
    setFormMode('edit');
    setEditingId(facultyId);
    setFormError('');
    setFacultyDraft({
      name: faculty.name,
      dean: faculty.dean,
      office: faculty.office,
    });
    setShowEntityModal(true);
  }

  function openEditDepartment(departmentId: string) {
    const department = departments.find((item) => item.id === departmentId);
    if (!department) return;
    setFormMode('edit');
    setEditingId(departmentId);
    setFormError('');
    setDepartmentDraft({
      facultyId: department.facultyId,
      name: department.name,
      code: department.code,
      hod: department.hod,
    });
    setShowEntityModal(true);
  }

  function openEditProgramme(programmeId: string) {
    const programme = programmes.find((item) => item.id === programmeId);
    if (!programme) return;
    setFormMode('edit');
    setEditingId(programmeId);
    setFormError('');
    setProgrammeDraft({
      departmentId: programme.departmentId,
      name: programme.name,
      award: programme.award,
      durationYears: programme.durationYears,
    });
    setShowEntityModal(true);
  }

  function openEditSession(sessionId: string) {
    const session = academicSessions.find((item) => item.id === sessionId);
    if (!session) return;
    setFormMode('edit');
    setEditingId(sessionId);
    setFormError('');
    setSessionDraft({
      name: session.name,
      isCurrent: session.isCurrent,
    });
    setShowEntityModal(true);
  }

  function openCreateSemester() {
    setFormMode('create');
    setEditingId(null);
    setFormError('');
    setSemesterDraft({
      sessionId: academicSessions[0]?.id ?? '',
      name: 'First Semester',
      order: 1,
      isCurrent: false,
    });
    setShowSemesterModal(true);
  }

  function openEditSemester(semesterId: string) {
    const semester = semesters.find((item) => item.id === semesterId);
    if (!semester) return;
    setFormMode('edit');
    setEditingId(semesterId);
    setFormError('');
    setSemesterDraft({
      sessionId: semester.sessionId,
      name: semester.name,
      order: semester.order,
      isCurrent: semester.isCurrent,
    });
    setShowSemesterModal(true);
  }

  function openEditCourse(courseId: string) {
    const course = courseRows.find((item) => item.id === courseId);
    if (!course) return;
    setFormMode('edit');
    setEditingId(courseId);
    setFormError('');
    setCourseDraft({
      departmentId: course.departmentId,
      levelId: course.levelId,
      semesterId: course.semesterId,
      code: course.code,
      title: course.title,
      units: course.units,
      type: course.type,
      lecturerId: course.lecturerId ?? '',
      prerequisitesText: course.prerequisites.join(', '),
      programmeIds: programmeCourses
        .filter((attachment) => attachment.courseId === courseId)
        .map((attachment) => attachment.programmeId),
    });
    setShowEntityModal(true);
  }

  function handleSaveEntity() {
    const result =
      view === 'faculties'
        ? formMode === 'create'
          ? createFaculty(facultyDraft)
          : updateFaculty(editingId ?? '', facultyDraft)
        : view === 'departments'
          ? formMode === 'create'
            ? createDepartment(departmentDraft)
            : updateDepartment(editingId ?? '', departmentDraft)
          : view === 'programmes'
            ? formMode === 'create'
              ? createProgramme(programmeDraft)
              : updateProgramme(editingId ?? '', programmeDraft)
            : view === 'sessions'
              ? formMode === 'create'
                ? createSession(sessionDraft)
                : updateSession(editingId ?? '', sessionDraft)
              : formMode === 'create'
                ? createCourse({
                    departmentId: courseDraft.departmentId,
                    levelId: courseDraft.levelId,
                    semesterId: courseDraft.semesterId,
                    code: courseDraft.code,
                    title: courseDraft.title,
                    units: courseDraft.units,
                    type: courseDraft.type,
                    lecturerId: courseDraft.lecturerId || undefined,
                    prerequisites: parseCommaList(courseDraft.prerequisitesText),
                    programmeIds: courseDraft.programmeIds,
                  })
                : updateCourse(editingId ?? '', {
                    departmentId: courseDraft.departmentId,
                    levelId: courseDraft.levelId,
                    semesterId: courseDraft.semesterId,
                    code: courseDraft.code,
                    title: courseDraft.title,
                    units: courseDraft.units,
                    type: courseDraft.type,
                    lecturerId: courseDraft.lecturerId || undefined,
                    prerequisites: parseCommaList(courseDraft.prerequisitesText),
                    programmeIds: courseDraft.programmeIds,
                  });

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    toast.success(result.message);
    closeEntityModal();
  }

  function handleSaveSemester() {
    const result =
      formMode === 'create' ? createSemester(semesterDraft) : updateSemester(editingId ?? '', semesterDraft);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    toast.success(result.message);
    closeSemesterModal();
  }

  function toggleCourseProgramme(programmeId: string) {
    setCourseDraft((current) => ({
      ...current,
      programmeIds: current.programmeIds.includes(programmeId)
        ? current.programmeIds.filter((item) => item !== programmeId)
        : [...current.programmeIds, programmeId],
    }));
  }

  function handleProgrammeFacultyFilterChange(nextFacultyId: string) {
    setProgrammeFacultyFilter(nextFacultyId);
    if (
      programmeDepartmentFilter !== 'all' &&
      !departmentRows.some(
        (department) => department.id === programmeDepartmentFilter && (nextFacultyId === 'all' || department.facultyId === nextFacultyId),
      )
    ) {
      setProgrammeDepartmentFilter('all');
    }
  }

  function handleCourseFacultyFilterChange(nextFacultyId: string) {
    setCourseFacultyFilter(nextFacultyId);

    if (
      courseDepartmentFilter !== 'all' &&
      !departmentRows.some(
        (department) => department.id === courseDepartmentFilter && (nextFacultyId === 'all' || department.facultyId === nextFacultyId),
      )
    ) {
      setCourseDepartmentFilter('all');
    }

    if (
      courseProgrammeFilter !== 'all' &&
      !programmeRows.some((programme) => {
        const programmeDepartment = departmentById.get(programme.departmentId);
        return (
          programme.id === courseProgrammeFilter &&
          (nextFacultyId === 'all' || programmeDepartment?.facultyId === nextFacultyId)
        );
      })
    ) {
      setCourseProgrammeFilter('all');
    }
  }

  function handleCourseDepartmentFilterChange(nextDepartmentId: string) {
    setCourseDepartmentFilter(nextDepartmentId);

    if (
      courseProgrammeFilter !== 'all' &&
      !programmeRows.some(
        (programme) =>
          programme.id === courseProgrammeFilter && (nextDepartmentId === 'all' || programme.departmentId === nextDepartmentId),
      )
    ) {
      setCourseProgrammeFilter('all');
    }
  }

  const facultyHelper = createColumnHelper<(typeof facultyRows)[number]>();
  const departmentHelper = createColumnHelper<(typeof departmentRows)[number]>();
  const programmeHelper = createColumnHelper<(typeof programmeRows)[number]>();
  const courseHelper = createColumnHelper<(typeof filteredCourses)[number]>();

  const facultyColumns = [
    facultyHelper.accessor('name', {
      header: 'Faculty',
      cell: (info) => <strong>{info.getValue()}</strong>,
    }),
    facultyHelper.accessor('dean', { header: 'Dean', cell: (info) => info.getValue() }),
    facultyHelper.accessor('office', { header: 'Office', cell: (info) => info.getValue() }),
    facultyHelper.accessor('departmentCount', { header: 'Departments', cell: (info) => info.getValue() }),
    facultyHelper.accessor('programmeCount', { header: 'Programmes', cell: (info) => info.getValue() }),
    facultyHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button type="button" className="ghost-button ghost-button--sm" onClick={() => openEditFaculty(info.row.original.id)}>
          Edit
        </button>
      ),
    }),
  ];

  const departmentColumns = [
    departmentHelper.accessor('name', {
      header: 'Department',
      cell: (info) => (
        <div>
          <strong>{info.getValue()}</strong>
          <p>{info.row.original.breadcrumb}</p>
        </div>
      ),
    }),
    departmentHelper.accessor('code', { header: 'Code', cell: (info) => info.getValue() }),
    departmentHelper.accessor('hod', { header: 'HOD', cell: (info) => info.getValue() }),
    departmentHelper.display({
      id: 'programmes',
      header: 'Programmes',
      cell: (info) => (
        <div className="tag-cloud">
          {info.row.original.programmes.map((programme) => (
            <span key={programme.id} className="tag">
              {formatProgrammeLabel(programme)}
            </span>
          ))}
        </div>
      ),
    }),
    departmentHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button type="button" className="ghost-button ghost-button--sm" onClick={() => openEditDepartment(info.row.original.id)}>
          Edit
        </button>
      ),
    }),
  ];

  const programmeColumns = [
    programmeHelper.accessor('name', {
      header: 'Programme',
      cell: (info) => (
        <div>
          <strong>{formatProgrammeLabel({ award: info.row.original.award, name: info.getValue() })}</strong>
          <p>{info.row.original.breadcrumb}</p>
        </div>
      ),
    }),
    programmeHelper.accessor('durationYears', {
      header: 'Duration',
      cell: (info) => `${info.getValue()} years`,
    }),
    programmeHelper.accessor('courseCount', {
      header: 'Attached courses',
      cell: (info) => info.getValue(),
    }),
    programmeHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button type="button" className="ghost-button ghost-button--sm" onClick={() => openEditProgramme(info.row.original.id)}>
          Edit
        </button>
      ),
    }),
  ];

  const courseColumns = [
    courseHelper.accessor('code', {
      header: 'Code',
      cell: (info) => (
        <div>
          <strong>{info.getValue()}</strong>
          <p>{info.row.original.breadcrumb}</p>
        </div>
      ),
    }),
    courseHelper.accessor('title', { header: 'Course title', cell: (info) => info.getValue() }),
    courseHelper.display({
      id: 'offering',
      header: 'Offering',
      cell: (info) => (
        <div>
          <strong>{info.row.original.levelName}</strong>
          <p>
            {info.row.original.sessionName} • {info.row.original.semesterName}
          </p>
        </div>
      ),
    }),
    courseHelper.display({
      id: 'programmes',
      header: 'Attached programmes',
      cell: (info) => (
        <div className="tag-cloud">
          {info.row.original.attachedProgrammes.length ? (
            info.row.original.attachedProgrammes.map((programme) => (
              <span key={programme.id} className="tag">
                {formatProgrammeLabel(programme)}
              </span>
            ))
          ) : (
            <span className="tag">Department-owned only</span>
          )}
        </div>
      ),
    }),
    courseHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button type="button" className="ghost-button ghost-button--sm" onClick={() => openEditCourse(info.row.original.id)}>
          Edit
        </button>
      ),
    }),
  ];

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow={viewContent[view].eyebrow}
        title={viewContent[view].title}
        description={viewContent[view].description}
        actions={
          <div className="button-row">
            {view === 'sessions' ? (
              <button type="button" className="ghost-button" onClick={openCreateSemester}>
                New semester
              </button>
            ) : null}
            <button type="button" className="primary-button" onClick={openCreateModal}>
              {viewContent[view].actionLabel}
            </button>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Faculties" value={String(stats.faculties)} meta="Highest academic ownership layer." />
        <StatCard label="Departments" value={String(stats.departments)} meta="Faculty-owned units that hold programmes and courses." />
        <StatCard label="Programmes" value={String(stats.programmes)} meta="Student-facing degree paths that inherit department ownership." />
        <StatCard
          label={view === 'sessions' ? 'Semesters' : 'Catalog courses'}
          value={String(view === 'sessions' ? stats.semesters : stats.courses)}
          meta={view === 'sessions' ? 'Session-bound academic periods.' : 'Department-owned courses attached to programmes.'}
        />
      </div>

      <SectionCard title={viewContent[view].dependencyTitle} subtitle="Use this panel to explain what depends on what during demos and database conversations.">
        <div className="dependency-grid">
          {viewContent[view].dependencyLines.map((line) => (
            <div key={line} className="dependency-item">
              {line}
            </div>
          ))}
        </div>
      </SectionCard>

      {view === 'faculties' ? (
        <SectionCard title="Faculty register" subtitle="Each faculty shows its dean, office, and the number of departments and programmes it governs.">
          <DataTable data={facultyRows} columns={facultyColumns} />
        </SectionCard>
      ) : null}

      {view === 'departments' ? (
        <SectionCard
          title="Department register"
          subtitle="Each department shows its parent faculty plus the programmes that depend on it."
          aside={
            <div className="filters-inline">
              <select value={departmentFacultyFilter} onChange={(event) => setDepartmentFacultyFilter(event.target.value)}>
                <option value="all">All faculties</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <DataTable data={filteredDepartmentRows} columns={departmentColumns} />
        </SectionCard>
      ) : null}

      {view === 'programmes' ? (
        <SectionCard
          title="Programme inventory"
          subtitle="The breadcrumb makes it obvious that programmes inherit faculty through their department instead of owning it directly."
          aside={
            <div className="filters-inline">
              <select value={programmeFacultyFilter} onChange={(event) => handleProgrammeFacultyFilterChange(event.target.value)}>
                <option value="all">All faculties</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
              <select value={programmeDepartmentFilter} onChange={(event) => setProgrammeDepartmentFilter(event.target.value)}>
                <option value="all">All departments</option>
                {programmeDepartmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <DataTable data={filteredProgrammeRows} columns={programmeColumns} />
        </SectionCard>
      ) : null}

      {view === 'sessions' ? (
        <div className="split-grid">
          <SectionCard title="Academic sessions" subtitle="Sessions are the parent record for semesters. Only one session should usually be current.">
            <div className="list-stack">
              {sessionRows.map((session) => (
                <div key={session.id} className="list-row list-row--column">
                  <div className="relationship-line">
                    <div>
                      <strong>{session.name}</strong>
                      <p>{session.semesterCount} semesters mapped to this session.</p>
                    </div>
                    <div className="button-row">
                      {session.isCurrent ? <StatusBadge tone={statusTone('cleared')} label="Current" /> : null}
                      <button type="button" className="ghost-button ghost-button--sm" onClick={() => openEditSession(session.id)}>
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="tag-cloud">
                    {session.semesters.map((semester) => (
                      <span key={semester.id} className="tag">
                        {semester.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Semesters & levels" subtitle="Semesters are nested under sessions, while levels stay as a reusable academic offering dimension.">
            <div className="list-stack">
              {semesters.map((semester) => (
                <div key={semester.id} className="list-row">
                  <div>
                    <strong>
                      {academicSessions.find((session) => session.id === semester.sessionId)?.name} &gt; {semester.name}
                    </strong>
                    <p>Order {semester.order}</p>
                  </div>
                  <div className="button-row">
                    {semester.isCurrent ? <StatusBadge tone={statusTone('cleared')} label="Current" /> : null}
                    <button type="button" className="ghost-button ghost-button--sm" onClick={() => openEditSemester(semester.id)}>
                      Edit
                    </button>
                  </div>
                </div>
              ))}

              <div className="tag-cloud">
                {levels.map((level) => (
                  <span key={level.id} className="tag">
                    {level.name}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {view === 'courses' ? (
        <SectionCard
          title="Course catalog"
          subtitle="Courses now show both ownership and usage: owner department, offering level/semester, and attached programmes."
          aside={
            <div className="filters-inline">
              <input
                className="search-input"
                placeholder="Search code, course title, or department"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select value={courseFacultyFilter} onChange={(event) => handleCourseFacultyFilterChange(event.target.value)}>
                <option value="all">All faculties</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
              <select value={courseDepartmentFilter} onChange={(event) => handleCourseDepartmentFilterChange(event.target.value)}>
                <option value="all">All departments</option>
                {courseDepartmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <select value={courseProgrammeFilter} onChange={(event) => setCourseProgrammeFilter(event.target.value)}>
                <option value="all">All programmes</option>
                {courseProgrammeOptions.map((programme) => (
                  <option key={programme.id} value={programme.id}>
                    {formatProgrammeLabel(programme)}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <DataTable data={filteredCourses} columns={courseColumns} />
        </SectionCard>
      ) : null}

      {showEntityModal ? (
        <Modal
          title={
            view === 'faculties'
              ? `${formMode === 'create' ? 'Create' : 'Edit'} faculty`
              : view === 'departments'
                ? `${formMode === 'create' ? 'Create' : 'Edit'} department`
                : view === 'programmes'
                  ? `${formMode === 'create' ? 'Create' : 'Edit'} programme`
                  : view === 'sessions'
                    ? `${formMode === 'create' ? 'Create' : 'Edit'} academic session`
                    : `${formMode === 'create' ? 'Create' : 'Edit'} course`
          }
          description={
            view === 'faculties'
              ? 'Faculties sit at the top of the tree. Departments will depend on this record.'
              : view === 'departments'
                ? 'Departments require a faculty because they become the parent record for programmes and courses.'
                : view === 'programmes'
                  ? 'Programmes depend on departments only. Faculty is shown as a derived readonly value.'
                  : view === 'sessions'
                    ? 'Sessions are standalone university-wide records. Semesters depend on them.'
                    : 'Courses are department-owned. Attach them to one or many programmes inside the same department.'
          }
          onClose={closeEntityModal}
          footer={
            <>
              <button type="button" className="ghost-button" onClick={closeEntityModal}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSaveEntity}>
                Save
              </button>
            </>
          }
        >
          {formError ? <div className="note-callout note-callout--danger">{formError}</div> : null}

          {view === 'faculties' ? (
            <div className="form-grid">
              <label className="field-group">
                <span>Faculty name</span>
                <input value={facultyDraft.name} onChange={(event) => setFacultyDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="field-group">
                <span>Dean</span>
                <input value={facultyDraft.dean} onChange={(event) => setFacultyDraft((current) => ({ ...current, dean: event.target.value }))} />
              </label>
              <label className="field-group field-group--full">
                <span>Office</span>
                <input value={facultyDraft.office} onChange={(event) => setFacultyDraft((current) => ({ ...current, office: event.target.value }))} />
              </label>
            </div>
          ) : null}

          {view === 'departments' ? (
            <div className="form-grid">
              <div className="field-help field-group--full">Departments sit directly under faculties. You must choose the faculty before saving.</div>
              <label className="field-group">
                <span>Faculty</span>
                <select
                  value={departmentDraft.facultyId}
                  onChange={(event) => setDepartmentDraft((current) => ({ ...current, facultyId: event.target.value }))}
                >
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>Department name</span>
                <input value={departmentDraft.name} onChange={(event) => setDepartmentDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="field-group">
                <span>Code</span>
                <input value={departmentDraft.code} onChange={(event) => setDepartmentDraft((current) => ({ ...current, code: event.target.value }))} />
              </label>
              <label className="field-group">
                <span>HOD</span>
                <input value={departmentDraft.hod} onChange={(event) => setDepartmentDraft((current) => ({ ...current, hod: event.target.value }))} />
              </label>
            </div>
          ) : null}

          {view === 'programmes' ? (
            <div className="form-grid">
              <div className="field-help field-group--full">Programmes belong to departments only. Faculty is auto-derived from the department selection.</div>
              <label className="field-group">
                <span>Department</span>
                <select
                  value={programmeDraft.departmentId}
                  onChange={(event) => setProgrammeDraft((current) => ({ ...current, departmentId: event.target.value }))}
                >
                  {departmentRows.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.facultyName} &gt; {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-group">
                <span>Derived faculty</span>
                <div className="readonly-field">{derivedProgrammeFaculty?.name ?? 'Select department first'}</div>
              </div>
              <label className="field-group">
                <span>Programme name</span>
                <input value={programmeDraft.name} onChange={(event) => setProgrammeDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="field-group">
                <span>Award</span>
                <select
                  value={programmeDraft.award}
                  onChange={(event) => setProgrammeDraft((current) => ({ ...current, award: event.target.value }))}
                >
                  <option value="B.Sc">B.Sc</option>
                  <option value="B.A">B.A</option>
                  <option value="B.Ed">B.Ed</option>
                  <option value="B.Tech">B.Tech</option>
                </select>
              </label>
              <label className="field-group">
                <span>Duration</span>
                <input
                  type="number"
                  min={1}
                  value={programmeDraft.durationYears}
                  onChange={(event) => setProgrammeDraft((current) => ({ ...current, durationYears: Number(event.target.value) }))}
                />
              </label>
            </div>
          ) : null}

          {view === 'sessions' ? (
            <div className="form-grid">
              <label className="field-group field-group--full">
                <span>Session name</span>
                <input value={sessionDraft.name} onChange={(event) => setSessionDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="checkbox-field field-group--full">
                <input
                  type="checkbox"
                  checked={sessionDraft.isCurrent}
                  onChange={(event) => setSessionDraft((current) => ({ ...current, isCurrent: event.target.checked }))}
                />
                <div>
                  <strong>Mark as current session</strong>
                  <p>This becomes the default academic session for demo flows.</p>
                </div>
              </label>
            </div>
          ) : null}

          {view === 'courses' ? (
            <div className="form-grid">
              <div className="field-help field-group--full">
                Choose the owning department first. The programme choices will then be limited to that department, which makes the dependency explicit.
              </div>
              <label className="field-group">
                <span>Department</span>
                <select
                  value={courseDraft.departmentId}
                  onChange={(event) =>
                    setCourseDraft((current) => ({
                      ...current,
                      departmentId: event.target.value,
                      programmeIds: programmes
                        .filter((programme) => programme.departmentId === event.target.value)
                        .map((programme) => programme.id),
                    }))
                  }
                >
                  {departmentRows.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.facultyName} &gt; {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-group">
                <span>Derived faculty</span>
                <div className="readonly-field">{derivedCourseFaculty?.name ?? 'Select department first'}</div>
              </div>
              <label className="field-group">
                <span>Level</span>
                <select value={courseDraft.levelId} onChange={(event) => setCourseDraft((current) => ({ ...current, levelId: event.target.value }))}>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>Semester</span>
                <select value={courseDraft.semesterId} onChange={(event) => setCourseDraft((current) => ({ ...current, semesterId: event.target.value }))}>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {academicSessions.find((session) => session.id === semester.sessionId)?.name} &gt; {semester.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>Course code</span>
                <input value={courseDraft.code} onChange={(event) => setCourseDraft((current) => ({ ...current, code: event.target.value }))} />
              </label>
              <label className="field-group">
                <span>Title</span>
                <input value={courseDraft.title} onChange={(event) => setCourseDraft((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="field-group">
                <span>Units</span>
                <input
                  type="number"
                  min={1}
                  value={courseDraft.units}
                  onChange={(event) => setCourseDraft((current) => ({ ...current, units: Number(event.target.value) }))}
                />
              </label>
              <label className="field-group">
                <span>Type</span>
                <select value={courseDraft.type} onChange={(event) => setCourseDraft((current) => ({ ...current, type: event.target.value as CourseType }))}>
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                  <option value="gst">GST</option>
                </select>
              </label>
              <label className="field-group">
                <span>Lecturer</span>
                <select
                  value={courseDraft.lecturerId}
                  onChange={(event) => setCourseDraft((current) => ({ ...current, lecturerId: event.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {lecturerOptions
                    .filter((lecturer) => lecturer.departmentId === courseDraft.departmentId)
                    .map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field-group field-group--full">
                <span>Prerequisites</span>
                <textarea
                  value={courseDraft.prerequisitesText}
                  onChange={(event) => setCourseDraft((current) => ({ ...current, prerequisitesText: event.target.value }))}
                  placeholder="Enter prerequisite course codes separated by commas"
                />
              </label>
              <div className="field-group field-group--full">
                <span>Attached programmes</span>
                <div className="selection-grid">
                  {courseProgrammes.length ? (
                    courseProgrammes.map((programme) => (
                      <label key={programme.id} className="checkbox-chip">
                        <input
                          type="checkbox"
                          checked={courseDraft.programmeIds.includes(programme.id)}
                          onChange={() => toggleCourseProgramme(programme.id)}
                        />
                        <div>
                          <strong>{formatProgrammeLabel(programme)}</strong>
                          <p>{derivedCourseFaculty?.name} &gt; {departments.find((department) => department.id === programme.departmentId)?.name}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="empty-state empty-state--table">Create a programme under this department first, or leave the course as department-owned only.</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {showSemesterModal ? (
        <Modal
          title={`${formMode === 'create' ? 'Create' : 'Edit'} semester`}
          description="Semesters depend on sessions, so the parent session is always required."
          onClose={closeSemesterModal}
          footer={
            <>
              <button type="button" className="ghost-button" onClick={closeSemesterModal}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSaveSemester}>
                Save semester
              </button>
            </>
          }
        >
          {formError ? <div className="note-callout note-callout--danger">{formError}</div> : null}
          <div className="form-grid">
            <div className="field-help field-group--full">Choose the parent session first. A semester cannot exist without one.</div>
            <label className="field-group">
              <span>Session</span>
              <select
                value={semesterDraft.sessionId}
                onChange={(event) => setSemesterDraft((current) => ({ ...current, sessionId: event.target.value }))}
              >
                {academicSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Semester name</span>
              <select value={semesterDraft.name} onChange={(event) => setSemesterDraft((current) => ({ ...current, name: event.target.value }))}>
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
                <option value="Summer Semester">Summer Semester</option>
              </select>
            </label>
            <label className="field-group">
              <span>Order</span>
              <input
                type="number"
                min={1}
                value={semesterDraft.order}
                onChange={(event) => setSemesterDraft((current) => ({ ...current, order: Number(event.target.value) }))}
              />
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={semesterDraft.isCurrent}
                onChange={(event) => setSemesterDraft((current) => ({ ...current, isCurrent: event.target.checked }))}
              />
              <div>
                <strong>Mark as current semester</strong>
                <p>This becomes the default semester for demo flows.</p>
              </div>
            </label>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
