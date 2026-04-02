import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { listHostelBlocks, listRoomAssignments, listStudents, listVacantRooms } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';

type HostelView = 'directory' | 'assignments' | 'vacancies';

interface HostelsPageProps {
  view?: HostelView;
}

export function HostelsPage({ view = 'directory' }: HostelsPageProps) {
  useDemoRevision();
  const assignRoom = useDemoDataStore((state) => state.assignRoom);
  const vacateAssignment = useDemoDataStore((state) => state.vacateAssignment);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [blockFilter, setBlockFilter] = useState('all');
  const [assignDraft, setAssignDraft] = useState({ studentId: '', roomId: '' });
  const [formError, setFormError] = useState('');

  const blocks = listHostelBlocks();
  const allAssignments = listRoomAssignments();
  const vacantRooms = listVacantRooms();
  const allStudents = listStudents();

  const totalBeds = blocks.reduce((sum, b) => sum + b.totalBeds, 0);
  const occupiedBeds = blocks.reduce((sum, b) => sum + b.occupiedBeds, 0);
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const assignments = allAssignments.filter((a) => blockFilter === 'all' || a.blockId === blockFilter);

  // Students not already assigned this session
  const assignedStudentIds = new Set(allAssignments.filter((a) => a.status !== 'vacated').map((a) => a.studentId));
  const unassignedStudents = allStudents.filter((s) => s.status === 'active' && !assignedStudentIds.has(s.id));

  const filteredVacantRooms = vacantRooms.filter((r) => blockFilter === 'all' || r.blockId === blockFilter);

  const pageContent: Record<HostelView, { eyebrow: string; title: string; description: string }> = {
    directory: {
      eyebrow: 'Hostel management',
      title: 'Hostel directory',
      description: 'An overview of all residential halls, their capacity, and current occupancy status.',
    },
    assignments: {
      eyebrow: 'Hostel management',
      title: 'Room assignments',
      description: 'Track which students are assigned to which rooms across all halls of residence.',
    },
    vacancies: {
      eyebrow: 'Hostel management',
      title: 'Bed vacancies',
      description: 'Rooms with available bed spaces, useful for new assignments and transfers.',
    },
  };

  const assignmentColumns = [
    createColumnHelper<(typeof assignments)[number]>().accessor('studentName', { header: 'Student', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof assignments)[number]>().accessor('matricNumber', { header: 'Matric No.', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof assignments)[number]>().accessor('blockName', { header: 'Block', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof assignments)[number]>().accessor('roomNumber', { header: 'Room', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof assignments)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<(typeof assignments)[number]>().display({
      id: '_actions',
      header: '',
      cell: (info) =>
        info.row.original.status !== 'vacated' ? (
          <button
            type="button"
            className="ghost-button ghost-button--sm"
            onClick={() => {
              const result = vacateAssignment(info.row.original.id);
              result.ok ? toast.success(result.message) : toast.error(result.message);
            }}
          >
            Vacate
          </button>
        ) : null,
    }),
  ];

  const vacancyColumns = [
    createColumnHelper<(typeof filteredVacantRooms)[number]>().accessor('blockName', { header: 'Block', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredVacantRooms)[number]>().accessor('roomNumber', { header: 'Room', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredVacantRooms)[number]>().accessor('type', { header: 'Type', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredVacantRooms)[number]>().accessor('capacity', { header: 'Capacity', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredVacantRooms)[number]>().accessor('occupancy', { header: 'Occupied', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof filteredVacantRooms)[number]>().accessor('vacantBeds', { header: 'Vacant', cell: (info) => info.getValue() }),
  ];

  function openAssignModal() {
    setAssignDraft({ studentId: unassignedStudents[0]?.id ?? '', roomId: vacantRooms[0]?.id ?? '' });
    setFormError('');
    setShowAssignModal(true);
  }

  function handleAssign() {
    const result = assignRoom(assignDraft);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setShowAssignModal(false);
    toast.success(result.message);
  }

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow={pageContent[view].eyebrow}
        title={pageContent[view].title}
        description={pageContent[view].description}
        actions={
          <button type="button" className="primary-button" onClick={openAssignModal}>
            Assign student
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total beds" value={String(totalBeds)} meta="Across all halls of residence." />
        <StatCard label="Occupied" value={String(occupiedBeds)} meta="Students currently assigned or checked in." />
        <StatCard label="Vacant" value={String(vacantBeds)} meta="Bed spaces available for assignment." />
        <StatCard label="Occupancy rate" value={`${occupancyRate}%`} meta="Current utilisation of hostel capacity." />
      </div>

      {view === 'directory' ? (
        <div className="triple-grid">
          {blocks.map((block) => (
            <SectionCard
              key={block.id}
              title={block.name}
              subtitle={`${block.location} • ${block.type} hall • ${block.totalRooms} rooms`}
              aside={
                <Link to={`/hostels/directory/${block.id}`} className="ghost-button ghost-button--sm">
                  View rooms
                </Link>
              }
            >
              <div className="info-grid">
                <div><span>Porter</span><strong>{block.porterName}</strong></div>
                <div><span>Beds</span><strong>{block.totalBeds}</strong></div>
                <div><span>Occupied</span><strong>{block.occupiedBeds}</strong></div>
                <div><span>Vacant</span><strong>{block.vacantBeds}</strong></div>
              </div>
              <div className="occupancy-bar" style={{ marginTop: 8 }}>
                <div className="occupancy-bar__fill" style={{ width: `${block.occupancyRate}%` }} />
              </div>
              <p className="occupancy-bar__label">{block.occupancyRate}% occupied</p>
            </SectionCard>
          ))}
        </div>
      ) : null}

      {view === 'assignments' ? (
        <SectionCard
          title="Room assignment register"
          subtitle="All current and past room assignments across halls."
          aside={
            <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              <option value="all">All blocks</option>
              {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          }
        >
          <DataTable data={assignments} columns={assignmentColumns} exportFilename="hostel-assignments" />
        </SectionCard>
      ) : null}

      {view === 'vacancies' ? (
        <SectionCard
          title="Available bed spaces"
          subtitle="Rooms with at least one unoccupied bed."
          aside={
            <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              <option value="all">All blocks</option>
              {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          }
        >
          <DataTable data={filteredVacantRooms} columns={vacancyColumns} exportFilename="hostel-vacancies" />
        </SectionCard>
      ) : null}

      {showAssignModal ? (
        <Modal
          title="Assign student to room"
          description="Select a student and an available room to create a new hostel assignment."
          onClose={() => setShowAssignModal(false)}
          footer={
            <>
              <button type="button" className="ghost-button" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={handleAssign}>Assign</button>
            </>
          }
        >
          <div className="form-grid">
            <label className="field-group">
              <span>Student</span>
              <select value={assignDraft.studentId} onChange={(e) => setAssignDraft((d) => ({ ...d, studentId: e.target.value }))}>
                {unassignedStudents.length === 0 ? <option value="">No unassigned students</option> : null}
                {unassignedStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.matricNumber}) — {s.gender}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Room</span>
              <select value={assignDraft.roomId} onChange={(e) => setAssignDraft((d) => ({ ...d, roomId: e.target.value }))}>
                {vacantRooms.length === 0 ? <option value="">No vacant rooms</option> : null}
                {vacantRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.blockName} — {r.roomNumber} ({r.blockType}, {r.vacantBeds} bed{r.vacantBeds !== 1 ? 's' : ''} free)</option>
                ))}
              </select>
            </label>
          </div>
          {formError ? <div className="note-callout note-callout--danger">{formError}</div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
