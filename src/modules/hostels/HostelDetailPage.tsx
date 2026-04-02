import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getHostelBlockDetail, listStudents } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';

export function HostelDetailPage() {
  useDemoRevision();
  const { hostelId = '' } = useParams();
  const assignRoom = useDemoDataStore((state) => state.assignRoom);
  const vacateAssignment = useDemoDataStore((state) => state.vacateAssignment);
  const [assignRoomId, setAssignRoomId] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState('');
  const detail = getHostelBlockDetail(hostelId);

  if (!detail) {
    return <div className="empty-state">Hostel block not found.</div>;
  }

  const { block, rooms } = detail;
  const allStudents = listStudents();
  const assignedStudentIds = new Set(rooms.flatMap((r) => r.assignments.map((a) => a.studentId)));
  const eligibleStudents = allStudents.filter(
    (s) => s.status === 'active' && !assignedStudentIds.has(s.id) && ((block.type === 'male' && s.gender === 'Male') || (block.type === 'female' && s.gender === 'Female')),
  );

  function handleAssign(roomId: string) {
    if (!assignStudentId) return;
    const result = assignRoom({ studentId: assignStudentId, roomId });
    if (result.ok) {
      toast.success(result.message);
      setAssignRoomId(null);
      setAssignStudentId('');
    } else {
      toast.error(result.message);
    }
  }

  function handleVacate(assignmentId: string) {
    const result = vacateAssignment(assignmentId);
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  const totalOccupancy = rooms.reduce((sum, r) => sum + r.occupancy, 0);

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Hostel overview"
        title={block.name}
        description={`${block.location} • ${block.type} hall • Porter: ${block.porterName} • ${block.totalRooms} rooms, ${block.totalBeds} beds, ${totalOccupancy} occupied`}
      />

      <div className="list-stack">
        {rooms.map((room) => (
          <SectionCard
            key={room.id}
            title={`Room ${room.roomNumber}`}
            subtitle={`Floor ${room.floor} • ${room.type} • ${room.capacity} beds • ${room.occupancy} occupied`}
            aside={
              room.occupancy < room.capacity ? (
                assignRoomId === room.id ? (
                  <div className="button-row">
                    <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)} style={{ maxWidth: 220 }}>
                      <option value="">Select student...</option>
                      {eligibleStudents.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.matricNumber})</option>
                      ))}
                    </select>
                    <button type="button" className="primary-button ghost-button--sm" onClick={() => handleAssign(room.id)} disabled={!assignStudentId}>Assign</button>
                    <button type="button" className="ghost-button ghost-button--sm" onClick={() => setAssignRoomId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className="ghost-button ghost-button--sm" onClick={() => { setAssignRoomId(room.id); setAssignStudentId(''); }}>
                    Assign student
                  </button>
                )
              ) : null
            }
          >
            {room.assignments.length > 0 ? (
              <div className="list-stack">
                {room.assignments.map((a) => (
                  <div key={a.id} className="list-row">
                    <div>
                      <strong>{a.studentName}</strong>
                      <p>{a.matricNumber}</p>
                    </div>
                    <div className="row-meta">
                      <StatusBadge tone={statusTone(a.status)} label={a.status} />
                      <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleVacate(a.id)}>
                        Vacate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state empty-state--table">No occupants assigned.</p>
            )}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
