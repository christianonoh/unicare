import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDemoRevision } from '../../app/store/demoDataStore';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { listStudents } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';

type StudentsView = 'directory' | 'profiles' | 'standing';

interface StudentsPageProps {
  view?: StudentsView;
}

export function StudentsPage({ view = 'directory' }: StudentsPageProps) {
  useDemoRevision();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'standing' ? 'probation' : 'all');
  const pageContent: Record<StudentsView, { eyebrow: string; title: string; description: string; sectionTitle: string; sectionSubtitle: string }> = {
    directory: {
      eyebrow: 'Student records',
      title: 'Student directory',
      description: 'A high-confidence master list for browsing core student records across faculties, programmes, and operational states.',
      sectionTitle: 'Student register',
      sectionSubtitle: 'Registry-grade list for finding and validating student records quickly.',
    },
    profiles: {
      eyebrow: 'Student records',
      title: 'Student profiles',
      description: 'A profile-led route for drilling into individual students, their finance posture, registration, and result history.',
      sectionTitle: 'Profile lookup',
      sectionSubtitle: 'Start from the directory and move into a single-student view from here.',
    },
    standing: {
      eyebrow: 'Student records',
      title: 'Academic standing',
      description: 'A focused view of probation, inactive, deferred, and other non-standard student states that require intervention.',
      sectionTitle: 'Standing review queue',
      sectionSubtitle: 'Records requiring attention because of progression, status, or clearance posture.',
    },
  };
  const students = listStudents().filter((student) => {
    const matchesView =
      view === 'standing'
        ? student.status === 'probation' || student.status === 'inactive' || student.status === 'deferred'
        : true;
    const matchesQuery =
      student.fullName.toLowerCase().includes(query.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : student.status === statusFilter;
    return matchesView && matchesQuery && matchesStatus;
  });

  const columns = [
    createColumnHelper<(typeof students)[number]>().accessor('fullName', {
      header: 'Student',
      cell: (info) => <Link to={`/students/profiles/${info.row.original.id}`}>{info.getValue()}</Link>,
    }),
    createColumnHelper<(typeof students)[number]>().accessor('matricNumber', { header: 'Matric no', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof students)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof students)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<(typeof students)[number]>().accessor('clearanceStatus', {
      header: 'Clearance',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  return (
    <div className="page-grid">
      <PageHeader eyebrow={pageContent[view].eyebrow} title={pageContent[view].title} description={pageContent[view].description} />

      <div className="stats-grid">
        <StatCard label="Active records" value={String(listStudents().filter((item) => item.status === 'active').length)} meta="Students currently eligible for standard semester operations." />
        <StatCard label="Probation cases" value={String(listStudents().filter((item) => item.status === 'probation').length)} meta="Academic risk cases that influence registration limits." />
        <StatCard label="Inactive" value={String(listStudents().filter((item) => item.status === 'inactive').length)} meta="Records retained but outside current semester activity." />
        <StatCard label="Held clearances" value={String(listStudents().filter((item) => item.clearanceStatus === 'held').length)} meta="Students requiring extra action before seamless progression." />
      </div>

      <SectionCard
        title={pageContent[view].sectionTitle}
        subtitle={pageContent[view].sectionSubtitle}
        aside={
          <div className="filters-inline">
            <input className="search-input" placeholder="Search name or matric number" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="inactive">Inactive</option>
              <option value="deferred">Deferred</option>
            </select>
          </div>
        }
      >
        <DataTable data={students} columns={columns} exportFilename="students" />
      </SectionCard>
    </div>
  );
}
