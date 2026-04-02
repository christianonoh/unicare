import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDemoRevision } from '../../app/store/demoDataStore';
import { AcademicScopePanel } from '../../components/AcademicScopePanel';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getAcademicScopeOptions, listStudents, matchesAcademicScope } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';

type StudentsView = 'records' | 'standing';

interface StudentsPageProps {
  view?: StudentsView;
}

const standingStatuses = new Set(['probation', 'inactive', 'deferred']);

export function StudentsPage({ view = 'records' }: StudentsPageProps) {
  useDemoRevision();
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'standing' ? 'attention' : 'all');
  const pageContent: Record<
    StudentsView,
    { eyebrow: string; title: string; description: string; sectionTitle: string; sectionEmptyMessage: string }
  > = {
    records: {
      eyebrow: 'Student records',
      title: 'Student records',
      description: 'A scoped student workbench built for scale, where academic ownership is chosen before registry records are loaded.',
      sectionTitle: 'Student register',
      sectionEmptyMessage: 'Choose a faculty and department to load student records.',
    },
    standing: {
      eyebrow: 'Student records',
      title: 'Academic standing',
      description: 'An intervention queue for non-standard student states, narrowed first by academic ownership and then by row-level status.',
      sectionTitle: 'Standing queue',
      sectionEmptyMessage: 'Choose a faculty and department to review standing cases.',
    },
  };

  const { faculties, departments, programmes, levels } = getAcademicScopeOptions({ facultyId, departmentId });
  const hasRequiredScope = Boolean(facultyId && departmentId);
  const allStudents = listStudents();
  const scopedStudents = allStudents.filter((student) => {
    const matchesView = view === 'standing' ? standingStatuses.has(student.status) : true;

    return matchesView && matchesAcademicScope(student, { facultyId, departmentId, programmeId, levelId });
  });
  const students = scopedStudents.filter((student) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      student.fullName.toLowerCase().includes(normalizedQuery) ||
      student.matricNumber.toLowerCase().includes(normalizedQuery) ||
      student.programmeName.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === 'all' || statusFilter === 'attention' ? (view === 'standing' ? standingStatuses.has(student.status) : true) : student.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const columns = [
    createColumnHelper<(typeof students)[number]>().accessor('fullName', {
      header: 'Student',
      cell: (info) => <Link to={`/students/records/${info.row.original.id}`}>{info.getValue()}</Link>,
    }),
    createColumnHelper<(typeof students)[number]>().accessor('matricNumber', { header: 'Matric no', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof students)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof students)[number]>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof students)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<(typeof students)[number]>().accessor('clearanceStatus', {
      header: 'Clearance',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  function handleFacultyChange(value: string) {
    setFacultyId(value);
    setDepartmentId('');
    setProgrammeId('');
    setLevelId('');
  }

  function handleDepartmentChange(value: string) {
    setDepartmentId(value);
    setProgrammeId('');
    setLevelId('');
  }

  function handleProgrammeChange(value: string) {
    setProgrammeId(value);
    setLevelId('');
  }

  return (
    <div className="page-grid">
      <PageHeader eyebrow={pageContent[view].eyebrow} title={pageContent[view].title} description={pageContent[view].description} />

      <div className="stats-grid">
        <StatCard label="Active records" value={String(allStudents.filter((item) => item.status === 'active').length)} meta="Students currently eligible for standard semester operations." />
        <StatCard label="Probation cases" value={String(allStudents.filter((item) => item.status === 'probation').length)} meta="Academic risk cases that influence registration limits." />
        <StatCard label="Inactive" value={String(allStudents.filter((item) => item.status === 'inactive').length)} meta="Records retained but outside current semester activity." />
        <StatCard label="Held clearances" value={String(allStudents.filter((item) => item.clearanceStatus === 'held').length)} meta="Students requiring extra action before seamless progression." />
      </div>

      <AcademicScopePanel
        title="Academic scope"
        description="Choose ownership first so large student datasets open in a controlled, department-led context."
        facultyId={facultyId}
        departmentId={departmentId}
        programmeId={programmeId}
        levelId={levelId}
        faculties={faculties.map((faculty) => ({ id: faculty.id, label: faculty.name }))}
        departments={departments.map((department) => ({ id: department.id, label: department.name }))}
        programmes={programmes.map((programme) => ({ id: programme.id, label: `${programme.award} ${programme.name}` }))}
        levels={levels.map((level) => ({ id: level.id, label: level.name }))}
        resultLabel={view === 'standing' ? 'standing records in scope' : 'student records in scope'}
        resultCount={hasRequiredScope ? scopedStudents.length : 0}
        resultMeta="Page-level scope is applied. Search and status refine the scoped register below."
        emptyMessage={pageContent[view].sectionEmptyMessage}
        onFacultyChange={handleFacultyChange}
        onDepartmentChange={handleDepartmentChange}
        onProgrammeChange={handleProgrammeChange}
        onLevelChange={setLevelId}
      />

      <SectionCard
        title={pageContent[view].sectionTitle}
        subtitle="Search and status only refine already-scoped rows."
        aside={
          <div className="table-toolbar">
            <input
              className="search-input"
              placeholder="Search student, matric number, or programme"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={!hasRequiredScope}
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={!hasRequiredScope}>
              {view === 'standing' ? (
                <>
                  <option value="attention">All standing cases</option>
                  <option value="probation">Probation</option>
                  <option value="inactive">Inactive</option>
                  <option value="deferred">Deferred</option>
                </>
              ) : (
                <>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="inactive">Inactive</option>
                  <option value="deferred">Deferred</option>
                  <option value="graduated">Graduated</option>
                </>
              )}
            </select>
          </div>
        }
      >
        {hasRequiredScope ? <DataTable data={students} columns={columns} exportFilename="students" /> : <div className="empty-state">{pageContent[view].sectionEmptyMessage}</div>}
      </SectionCard>
    </div>
  );
}
