import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { AcademicScopePanel } from '../../components/AcademicScopePanel';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getAcademicScopeOptions, getDepartmentResultSummary, getStudentProfile, listResultSummaries, matchesAcademicScope } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';

type ResultsView = 'score-entry' | 'approval' | 'departments';

interface ResultsPageProps {
  view?: ResultsView;
}

const approvalQueueStatuses = new Set(['not_submitted', 'pending', 'approved']);

export function ResultsPage({ view = 'score-entry' }: ResultsPageProps) {
  useDemoRevision();
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'approval' ? 'approval-queue' : 'all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCA, setEditCA] = useState(0);
  const [editExam, setEditExam] = useState(0);
  const updateResultEntry = useDemoDataStore((state) => state.updateResultEntry);
  const approveResult = useDemoDataStore((state) => state.approveResult);
  const { faculties, departments, programmes, levels } = getAcademicScopeOptions({ facultyId, departmentId });
  const allSummaries = listResultSummaries();
  const departmentSummary = getDepartmentResultSummary();
  const hasRequiredScope = view === 'departments' ? true : Boolean(facultyId && departmentId);
  const scopedSummaries = allSummaries.filter((summary) => matchesAcademicScope(summary, { facultyId, departmentId, programmeId, levelId }));
  const summaries = scopedSummaries.filter((summary) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      summary.studentName.toLowerCase().includes(normalizedQuery) ||
      summary.matricNumber.toLowerCase().includes(normalizedQuery) ||
      summary.programmeName.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      view === 'approval'
        ? statusFilter === 'approval-queue'
          ? approvalQueueStatuses.has(summary.approvalStatus)
          : summary.approvalStatus === statusFilter
        : statusFilter === 'all'
          ? true
          : summary.approvalStatus === statusFilter;

    return matchesQuery && matchesStatus;
  });
  const detail = selectedStudentId && summaries.some((summary) => summary.studentId === selectedStudentId) ? getStudentProfile(selectedStudentId) : null;
  const pageContent: Record<ResultsView, { title: string; description: string; sectionEmptyMessage?: string }> = {
    'score-entry': {
      title: 'Score entry',
      description: 'A lecturer and departmental workbench for semester result rows, student averages, and score-sheet inspection.',
      sectionEmptyMessage: 'Choose a faculty and department to load result rows.',
    },
    approval: {
      title: 'Approval queue',
      description: 'Result bundles still awaiting lecturer submission, departmental review, or faculty sign-off, now narrowed by academic ownership first.',
      sectionEmptyMessage: 'Choose a faculty and department to load approval cases.',
    },
    departments: {
      title: 'Department summaries',
      description: 'A management summary of result publication posture and carryover exposure by department.',
    },
  };

  function startEdit(resultId: string, ca: number, exam: number) {
    setEditingId(resultId);
    setEditCA(ca);
    setEditExam(exam);
  }

  function saveEdit() {
    if (!editingId) {
      return;
    }

    const result = updateResultEntry(editingId, editCA, editExam);
    if (result.ok) {
      toast.success(result.message);
      setEditingId(null);
      return;
    }

    toast.error(result.message);
  }

  function handleApprove(resultId: string) {
    const result = approveResult(resultId);
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  function handleFacultyChange(value: string) {
    setFacultyId(value);
    setDepartmentId('');
    setProgrammeId('');
    setLevelId('');
    setSelectedStudentId(null);
  }

  function handleDepartmentChange(value: string) {
    setDepartmentId(value);
    setProgrammeId('');
    setLevelId('');
    setSelectedStudentId(null);
  }

  function handleProgrammeChange(value: string) {
    setProgrammeId(value);
    setLevelId('');
    setSelectedStudentId(null);
  }

  const columns = [
    createColumnHelper<(typeof summaries)[number]>().accessor('studentName', {
      header: 'Student',
      cell: (info) => (
        <button type="button" className="link-button" onClick={() => setSelectedStudentId(info.row.original.studentId)}>
          {info.getValue()}
        </button>
      ),
    }),
    createColumnHelper<(typeof summaries)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof summaries)[number]>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
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

      {view !== 'departments' ? (
        <AcademicScopePanel
          title="Academic scope"
          description="Choose ownership first so result processing loads in the correct faculty and department context."
          facultyId={facultyId}
          departmentId={departmentId}
          programmeId={programmeId}
          levelId={levelId}
          faculties={faculties.map((faculty) => ({ id: faculty.id, label: faculty.name }))}
          departments={departments.map((department) => ({ id: department.id, label: department.name }))}
          programmes={programmes.map((programme) => ({ id: programme.id, label: `${programme.award} ${programme.name}` }))}
          levels={levels.map((level) => ({ id: level.id, label: level.name }))}
          resultLabel="result bundles in scope"
          resultCount={hasRequiredScope ? scopedSummaries.length : 0}
          resultMeta="Page-level scope narrows the ledger before search and status refine the rows below."
          emptyMessage={pageContent[view].sectionEmptyMessage ?? 'Choose a faculty and department to load result rows.'}
          onFacultyChange={handleFacultyChange}
          onDepartmentChange={handleDepartmentChange}
          onProgrammeChange={handleProgrammeChange}
          onLevelChange={setLevelId}
        />
      ) : null}

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
            subtitle="Search and status only refine already-scoped result bundles."
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
                  {view === 'approval' ? (
                    <>
                      <option value="approval-queue">All approval cases</option>
                      <option value="not_submitted">Not submitted</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                    </>
                  ) : (
                    <>
                      <option value="all">All states</option>
                      <option value="not_submitted">Not submitted</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                    </>
                  )}
                </select>
              </div>
            }
          >
            {hasRequiredScope ? <DataTable data={summaries} columns={columns} /> : <div className="empty-state">{pageContent[view].sectionEmptyMessage}</div>}
          </SectionCard>
          <SectionCard title="Selected score sheet" subtitle={view === 'score-entry' ? 'Click Edit to modify CA and exam scores for each course.' : 'Approve or publish individual result entries.'}>
            {detail ? (
              <div className="list-stack">
                {detail.results.slice(0, 12).map((result) => (
                  <div key={result.id} className="list-row">
                    {editingId === result.id ? (
                      <>
                        <div>
                          <strong>{result.course?.code}</strong>
                          <div className="score-edit-row">
                            <label>
                              CA
                              <input type="number" min={0} max={40} value={editCA} onChange={(event) => setEditCA(Number(event.target.value))} style={{ width: 60 }} />
                            </label>
                            <label>
                              Exam
                              <input type="number" min={0} max={60} value={editExam} onChange={(event) => setEditExam(Number(event.target.value))} style={{ width: 60 }} />
                            </label>
                          </div>
                        </div>
                        <div className="row-meta">
                          <button type="button" className="primary-button ghost-button--sm" onClick={saveEdit}>Save</button>
                          <button type="button" className="ghost-button ghost-button--sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <strong>{result.course?.code}</strong>
                          <p>{result.course?.title}</p>
                        </div>
                        <div className="row-meta">
                          <span title={`CA: ${result.caScore} | Exam: ${result.examScore}`}>{result.totalScore} ({result.grade})</span>
                          {result.carryover ? <StatusBadge tone="carryover" label="carryover" /> : null}
                          <StatusBadge tone={statusTone(result.status)} label={result.status} />
                          {view === 'score-entry' ? (
                            <button type="button" className="ghost-button ghost-button--sm" onClick={() => startEdit(result.id, result.caScore, result.examScore)}>Edit</button>
                          ) : (
                            <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleApprove(result.id)}>
                              {result.status === 'approved' ? 'Publish' : 'Approve'}
                            </button>
                          )}
                        </div>
                      </>
                    )}
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
