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

type HostelView = 'overview' | 'allocation';
type AllocationMode = 'assigned' | 'vacant';

interface HostelsPageProps {
  view?: HostelView;
}

export function HostelsPage({ view = 'overview' }: HostelsPageProps) {
  useDemoRevision();
  const assignRoom = useDemoDataStore((state) => state.assignRoom);
  const vacateAssignment = useDemoDataStore((state) => state.vacateAssignment);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [blockFilter, setBlockFilter] = useState('all');
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('assigned');
  const [assignDraft, setAssignDraft] = useState({ studentId: '', roomId: '' });
  const [formError, setFormError] = useState('');

  const blocks = listHostelBlocks();
  const allAssignments = listRoomAssignments();
  const vacantRooms = listVacantRooms();
  const allStudents = listStudents();
  const pageContent: Record<HostelView, { eyebrow: string; title: string; description: string }> = {
    overview: {
      eyebrow: 'Hostel management',
      title: 'Hostel overview',
      description: 'A residential overview of hostel blocks, occupancy posture, and space availability across the estate.',
    },
    allocation: {
      eyebrow: 'Hostel management',
      title: 'Hostel allocation',
      description: 'One operational workbench for room assignments and current vacancies instead of split residential tables.',
    },
  };

  const totalBeds = blocks.reduce((sum, block) => sum + block.totalBeds, 0);
  const occupiedBeds = blocks.reduce((sum, block) => sum + block.occupiedBeds, 0);
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const assignments = allAssignments.filter((assignment) => blockFilter === 'all' || assignment.blockId === blockFilter);
  const filteredVacantRooms = vacantRooms.filter((room) => blockFilter === 'all' || room.blockId === blockFilter);

  const assignedStudentIds = new Set(allAssignments.filter((assignment) => assignment.status !== 'vacated').map((assignment) => assignment.studentId));
  const unassignedStudents = allStudents.filter((student) => student.status === 'active' && !assignedStudentIds.has(student.id));
  const modalRoomOptions = blockFilter === 'all' ? vacantRooms : filteredVacantRooms;

  const assignmentColumns = [
    createColumnHelper<(typeof assignments)[number]>().accessor('studentName', { header: 'Student', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof assignments)[number]>().accessor('matricNumber', { header: 'Matric no', cell: (info) => info.getValue() }),
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
              if (result.ok) {
                toast.success(result.message);
                return;
              }

              toast.error(result.message);
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
    setAssignDraft({ studentId: unassignedStudents[0]?.id ?? '', roomId: modalRoomOptions[0]?.id ?? '' });
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
          view === 'allocation' ? (
            <button type="button" className="primary-button" onClick={openAssignModal}>
              Assign student
            </button>
          ) : null
        }
      />

      <div className="stats-grid">
        <StatCard label="Total beds" value={String(totalBeds)} meta="Across all halls of residence." />
        <StatCard label="Occupied" value={String(occupiedBeds)} meta="Students currently assigned or checked in." />
        <StatCard label="Vacant" value={String(vacantBeds)} meta="Bed spaces available for assignment." />
        <StatCard label="Occupancy rate" value={`${occupancyRate}%`} meta="Current utilisation of hostel capacity." />
      </div>

      {view === 'overview' ? (
        <div className="triple-grid">
          {blocks.map((block) => (
            <SectionCard
              key={block.id}
              title={block.name}
              subtitle={`${block.location} • ${block.type} hall • ${block.totalRooms} rooms`}
              aside={
                <Link to={`/hostels/overview/${block.id}`} className="ghost-button ghost-button--sm">
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

      {view === 'allocation' ? (
        <SectionCard
          title={allocationMode === 'assigned' ? 'Room assignments' : 'Vacant rooms'}
          subtitle="Operational filters and actions stay on the allocation table itself."
          aside={
            <div className="table-toolbar">
              <select value={allocationMode} onChange={(event) => setAllocationMode(event.target.value as AllocationMode)}>
                <option value="assigned">Assigned</option>
                <option value="vacant">Vacant</option>
              </select>
              <select value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)}>
                <option value="all">All blocks</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {allocationMode === 'assigned' ? (
            <DataTable data={assignments} columns={assignmentColumns} exportFilename="hostel-assignments" />
          ) : (
            <DataTable data={filteredVacantRooms} columns={vacancyColumns} exportFilename="hostel-vacancies" />
          )}
        </SectionCard>
      ) : null}

      {showAssignModal ? (
        <Modal
          title="Assign student to room"
          description="Select a student and an available room to create a new hostel assignment."
          onClose={() => setShowAssignModal(false)}
          footer={
            <>
              <button type="button" className="ghost-button" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleAssign}>
                Assign
              </button>
            </>
          }
        >
          <div className="form-grid">
            <label className="field-group">
              <span>Student</span>
              <select value={assignDraft.studentId} onChange={(event) => setAssignDraft((current) => ({ ...current, studentId: event.target.value }))}>
                {unassignedStudents.length === 0 ? <option value="">No unassigned students</option> : null}
                {unassignedStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.matricNumber}) — {student.gender}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Room</span>
              <select value={assignDraft.roomId} onChange={(event) => setAssignDraft((current) => ({ ...current, roomId: event.target.value }))}>
                {modalRoomOptions.length === 0 ? <option value="">No vacant rooms</option> : null}
                {modalRoomOptions.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.blockName} — {room.roomNumber} ({room.blockType}, {room.vacantBeds} bed{room.vacantBeds !== 1 ? 's' : ''} free)
                  </option>
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
