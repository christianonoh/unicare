import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getDepartmentResultSummary, getStudentProfile, listResultSummaries } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';

type ResultsView = 'score-entry' | 'approval' | 'departments';

interface ResultsPageProps {
  view?: ResultsView;
}

export function ResultsPage({ view = 'score-entry' }: ResultsPageProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const allSummaries = listResultSummaries();
  const summaries = allSummaries.filter((summary) => {
    if (view === 'approval') {
      return summary.approvalStatus === 'pending' || summary.approvalStatus === 'not_submitted';
    }
    return true;
  });
  const departmentSummary = getDepartmentResultSummary();
  const detail = selectedStudentId ? getStudentProfile(selectedStudentId) : null;
  const pageContent: Record<ResultsView, { title: string; description: string }> = {
    'score-entry': {
      title: 'Score entry',
      description: 'A lecturer and departmental view of semester result rows, student averages, and score-sheet inspection.',
    },
    approval: {
      title: 'Approval queue',
      description: 'Result bundles still awaiting lecturer submission, departmental review, or faculty sign-off.',
    },
    departments: {
      title: 'Department summaries',
      description: 'A management summary of result publication posture and carryover exposure by department.',
    },
  };

  const columns = [
    createColumnHelper<(typeof summaries)[number]>().accessor('studentName', {
      header: 'Student',
      cell: (info) => (
        <button type="button" className="link-button" onClick={() => setSelectedStudentId(info.row.original.studentId)}>
          {info.getValue()}
        </button>
      ),
    }),
    createColumnHelper<(typeof summaries)[number]>().accessor('departmentName', { header: 'Department', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof summaries)[number]>().accessor('averageScore', { header: 'Average', cell: (info) => info.getValue().toFixed(1) }),
    createColumnHelper<(typeof summaries)[number]>().accessor('carryovers', { header: 'Carryovers', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof summaries)[number]>().accessor('approvalStatus', {
      header: 'Approval state',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  return (
    <div className="page-grid">
      <PageHeader eyebrow="Result processing" title={pageContent[view].title} description={pageContent[view].description} />

      <div className="triple-grid">
        {departmentSummary.slice(0, 3).map((summary) => (
          <SectionCard key={summary.departmentId} title={summary.departmentName} subtitle={`${summary.students} students represented`}>
            <div className="info-grid">
              <div><span>Published</span><strong>{summary.published}</strong></div>
              <div><span>Awaiting</span><strong>{summary.awaiting}</strong></div>
              <div><span>Carryovers</span><strong>{summary.carryovers}</strong></div>
            </div>
          </SectionCard>
        ))}
      </div>

      {view === 'departments' ? (
        <SectionCard title="Department publication posture" subtitle="Publication readiness and carryover count by department.">
          <div className="list-stack">
            {departmentSummary.map((summary) => (
              <div key={summary.departmentId} className="list-row">
                <div>
                  <strong>{summary.departmentName}</strong>
                  <p>{summary.students} students represented</p>
                </div>
                <div className="row-meta">
                  <span>{summary.awaiting} awaiting</span>
                  <span>{summary.carryovers} carryovers</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <div className="split-grid split-grid--wide">
          <SectionCard
            title={view === 'approval' ? 'Result approval ledger' : 'Score-entry ledger'}
            subtitle="A browsable list of result bundles by student and registration pack."
          >
            <DataTable data={summaries} columns={columns} />
          </SectionCard>
          <SectionCard title="Selected score sheet" subtitle="Preview how the detailed result-entry or review experience can feel in later phases.">
            {detail ? (
              <div className="list-stack">
                {detail.results.slice(0, 8).map((result) => (
                  <div key={result.id} className="list-row">
                    <div>
                      <strong>{result.course?.code}</strong>
                      <p>{result.course?.title}</p>
                    </div>
                    <div className="row-meta">
                      <span>{result.totalScore}</span>
                      {result.carryover ? <StatusBadge tone="carryover" label="carryover" /> : null}
                      <StatusBadge tone={statusTone(result.status)} label={result.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Select a student from the left table to inspect a result sheet.</div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
