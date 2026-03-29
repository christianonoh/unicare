import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { getReferenceData } from '../../data/services/universityData';

type AcademicStructureView = 'faculties' | 'departments' | 'programmes' | 'sessions' | 'courses';

interface AcademicStructurePageProps {
  view?: AcademicStructureView;
}

export function AcademicStructurePage({ view = 'faculties' }: AcademicStructurePageProps) {
  const { faculties, departments, programmes, courses, academicSessions, semesters, levels } = getReferenceData();
  const [query, setQuery] = useState('');
  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(query.toLowerCase()) ||
      course.title.toLowerCase().includes(query.toLowerCase()),
  );
  const viewContent: Record<AcademicStructureView, { eyebrow: string; title: string; description: string }> = {
    faculties: {
      eyebrow: 'Institution model',
      title: 'Faculties',
      description: 'Top-level academic governance units, their deans, and the departments they supervise.',
    },
    departments: {
      eyebrow: 'Institution model',
      title: 'Departments',
      description: 'Departments are the operational homes for programmes, advisers, HOD approvals, and result controls.',
    },
    programmes: {
      eyebrow: 'Institution model',
      title: 'Programmes',
      description: 'Programmes define the actual admission target, fee posture, and progression path for each student.',
    },
    sessions: {
      eyebrow: 'Academic calendar',
      title: 'Sessions, semesters, and levels',
      description: 'These records define time-based control for billing, registration, examinations, and promotion logic.',
    },
    courses: {
      eyebrow: 'Academic catalog',
      title: 'Course catalog',
      description: 'A focused view of coded courses, unit load, semester allocation, and future prerequisite relationships.',
    },
  };

  const programmeColumns = [
    createColumnHelper<(typeof programmes)[number]>().accessor('name', {
      header: 'Programme',
      cell: (info) => info.getValue(),
    }),
    createColumnHelper<(typeof programmes)[number]>().accessor('award', {
      header: 'Award',
      cell: (info) => info.getValue(),
    }),
    createColumnHelper<(typeof programmes)[number]>().accessor('durationYears', {
      header: 'Duration',
      cell: (info) => `${info.getValue()} years`,
    }),
  ];

  const courseColumns = [
    createColumnHelper<(typeof filteredCourses)[number]>().accessor('code', { header: 'Code', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredCourses)[number]>().accessor('title', { header: 'Course title', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredCourses)[number]>().accessor('units', { header: 'Units', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredCourses)[number]>().accessor('type', { header: 'Type', cell: (info) => info.getValue() }),
  ];
  const departmentColumns = [
    createColumnHelper<(typeof departments)[number]>().accessor('name', { header: 'Department', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof departments)[number]>().accessor('code', { header: 'Code', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof departments)[number]>().accessor('hod', { header: 'HOD', cell: (info) => info.getValue() }),
  ];

  return (
    <div className="page-grid">
      <PageHeader eyebrow={viewContent[view].eyebrow} title={viewContent[view].title} description={viewContent[view].description} />

      <div className="stats-grid">
        <StatCard label="Faculties" value={String(faculties.length)} meta="Top-level academic governance units." />
        <StatCard label="Departments" value={String(departments.length)} meta="Operational homes for programmes, advisers, and result approvals." />
        <StatCard label="Programmes" value={String(programmes.length)} meta="Degree paths students are actually admitted into." />
        <StatCard label="Catalog courses" value={String(courses.length)} meta="Current seeded course inventory with credits and prerequisites." />
      </div>

      {view === 'faculties' ? (
        <div className="triple-grid">
          {faculties.map((faculty) => (
            <SectionCard key={faculty.id} title={faculty.name} subtitle={`Dean: ${faculty.dean}`}>
              <div className="list-stack">
                <div className="list-row">
                  <strong>Office</strong>
                  <span>{faculty.office}</span>
                </div>
                <div className="tag-cloud">
                  {departments
                    .filter((department) => department.facultyId === faculty.id)
                    .map((department) => (
                      <span key={department.id} className="tag">
                        {department.name}
                      </span>
                    ))}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : null}

      {view === 'departments' ? (
        <SectionCard title="Department register" subtitle="A compact departmental structure view aligned to university governance rather than class groups.">
          <DataTable data={departments} columns={departmentColumns} />
        </SectionCard>
      ) : null}

      {view === 'programmes' ? (
        <SectionCard title="Programme inventory" subtitle="Programmes will later anchor admissions, fees, progression logic, and result reporting.">
          <DataTable data={programmes} columns={programmeColumns} />
        </SectionCard>
      ) : null}

      {view === 'sessions' ? (
        <div className="split-grid">
          <SectionCard title="Academic sessions" subtitle="Controls what the institution considers active for registry, bursary, and result workflows.">
            <div className="list-stack">
              {academicSessions.map((session) => (
                <div key={session.id} className="list-row">
                  <div>
                    <strong>{session.name}</strong>
                    <p>{session.isCurrent ? 'Current session' : 'Archived session'}</p>
                  </div>
                  <span>{semesters.filter((semester) => semester.sessionId === session.id).length} semesters</span>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Semesters and levels" subtitle="Level and semester metadata drive billing, course registration windows, and result buckets.">
            <div className="list-stack">
              {semesters.map((semester) => (
                <div key={semester.id} className="list-row">
                  <div>
                    <strong>{semester.name}</strong>
                    <p>{academicSessions.find((session) => session.id === semester.sessionId)?.name}</p>
                  </div>
                  <span>{semester.isCurrent ? 'Current' : `Order ${semester.order}`}</span>
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
          subtitle="Search the seeded course set to understand how programmes, levels, semesters, and lecturers should connect."
          aside={
            <input
              className="search-input"
              placeholder="Search code or title"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          }
        >
          <DataTable data={filteredCourses} columns={courseColumns} />
        </SectionCard>
      ) : null}
    </div>
  );
}
