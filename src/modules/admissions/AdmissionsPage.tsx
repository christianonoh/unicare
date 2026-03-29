import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { listApplicants } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';

type RegistryView = 'applicants' | 'offers' | 'clearance';

interface AdmissionsPageProps {
  view?: RegistryView;
}

export function AdmissionsPage({ view = 'applicants' }: AdmissionsPageProps) {
  const [statusFilter, setStatusFilter] = useState(view === 'offers' ? 'offered' : 'all');
  const [query, setQuery] = useState('');
  const pageContent: Record<RegistryView, { eyebrow: string; title: string; description: string; sectionTitle: string; sectionSubtitle: string }> = {
    applicants: {
      eyebrow: 'Registry operations',
      title: 'Applicants',
      description: 'Track the full admissions pipeline from screening to offer, acceptance payment, and final registry clearance.',
      sectionTitle: 'Applicant workbench',
      sectionSubtitle: 'The full applicant list, searchable and filterable like a real registry queue.',
    },
    offers: {
      eyebrow: 'Registry operations',
      title: 'Admission offers',
      description: 'Focus on candidates who are either already offered admission or close enough to require active registry follow-up.',
      sectionTitle: 'Offer management',
      sectionSubtitle: 'Candidates who need offer issuance, acceptance follow-up, or conversion monitoring.',
    },
    clearance: {
      eyebrow: 'Registry operations',
      title: 'Clearance queue',
      description: 'Highlight applicants blocked by document verification, payment posture, or unresolved onboarding exceptions.',
      sectionTitle: 'Clearance exceptions',
      sectionSubtitle: 'The queue most likely to require coordinated action between registry and bursary.',
    },
  };
  const applicants = listApplicants().filter((applicant) => {
    const matchesView =
      view === 'offers'
        ? applicant.admissionStatus === 'offered' || applicant.admissionStatus === 'accepted'
        : view === 'clearance'
          ? applicant.clearanceStatus === 'pending' || applicant.clearanceStatus === 'held' || applicant.clearanceStatus === 'queried'
          : true;
    const matchesStatus = statusFilter === 'all' ? true : applicant.admissionStatus === statusFilter;
    const matchesQuery =
      applicant.fullName.toLowerCase().includes(query.toLowerCase()) ||
      applicant.programmeName.toLowerCase().includes(query.toLowerCase());

    return matchesView && matchesStatus && matchesQuery;
  });

  const columns = [
    createColumnHelper<(typeof applicants)[number]>().accessor('fullName', {
      header: 'Applicant',
      cell: (info) => <Link to={`/registry/applicants/${info.row.original.id}`}>{info.getValue()}</Link>,
    }),
    createColumnHelper<(typeof applicants)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof applicants)[number]>().accessor('aggregateScore', { header: 'Aggregate', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof applicants)[number]>().accessor('admissionStatus', {
      header: 'Admission',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<(typeof applicants)[number]>().accessor('clearanceStatus', {
      header: 'Clearance',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  return (
    <div className="page-grid">
      <PageHeader eyebrow={pageContent[view].eyebrow} title={pageContent[view].title} description={pageContent[view].description} />

      <div className="stats-grid">
        <StatCard label="Screening queue" value={String(listApplicants().filter((item) => item.admissionStatus === 'screening').length)} meta="Applications still being reviewed by registry and departments." />
        <StatCard label="Offers issued" value={String(listApplicants().filter((item) => item.admissionStatus === 'offered').length)} meta="Candidates with offers but incomplete onboarding." />
        <StatCard label="Accepted" value={String(listApplicants().filter((item) => item.admissionStatus === 'accepted').length)} meta="Freshers likely to convert into student records." />
        <StatCard label="Held clearance" value={String(listApplicants().filter((item) => item.clearanceStatus === 'held').length)} meta="Cases with verification or payment blockers." />
      </div>

      <SectionCard
        title={pageContent[view].sectionTitle}
        subtitle={pageContent[view].sectionSubtitle}
        aside={
          <div className="filters-inline">
            <input className="search-input" placeholder="Search applicant or programme" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="screening">Screening</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="deferred">Deferred</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        }
      >
        <DataTable data={applicants} columns={columns} />
      </SectionCard>
    </div>
  );
}
