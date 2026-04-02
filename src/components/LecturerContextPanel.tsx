interface LecturerOption {
  id: string;
  label: string;
}

interface LecturerContextMeta {
  facultyName: string;
  departmentName: string;
  courseCount: number;
  adviseeCount: number;
}

interface LecturerContextPanelProps {
  title: string;
  description: string;
  lecturers: LecturerOption[];
  selectedLecturerId: string;
  selectedLecturer?: LecturerContextMeta | null;
  summaryLabel: string;
  summaryCount: number;
  summaryMeta: string;
  onLecturerChange: (value: string) => void;
}

export function LecturerContextPanel({
  title,
  description,
  lecturers,
  selectedLecturerId,
  selectedLecturer,
  summaryLabel,
  summaryCount,
  summaryMeta,
  onLecturerChange,
}: LecturerContextPanelProps) {
  return (
    <section className="scope-panel lecturer-panel">
      <div className="scope-panel__header">
        <div>
          <span className="eyebrow">Lecturer context</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="scope-panel__summary">
          <strong>{summaryCount}</strong>
          <span>{summaryLabel}</span>
          <p>{summaryMeta}</p>
        </div>
      </div>

      <div className="scope-panel__grid lecturer-panel__grid">
        <label className="field-group">
          <span>Lecturer</span>
          <select value={selectedLecturerId} onChange={(event) => onLecturerChange(event.target.value)}>
            {lecturers.map((lecturer) => (
              <option key={lecturer.id} value={lecturer.id}>
                {lecturer.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field-group">
          <span>Faculty</span>
          <div className="readonly-field">{selectedLecturer?.facultyName ?? 'Not available'}</div>
        </div>

        <div className="field-group">
          <span>Department</span>
          <div className="readonly-field">{selectedLecturer?.departmentName ?? 'Not available'}</div>
        </div>

        <div className="field-group">
          <span>Coverage</span>
          <div className="readonly-field">
            {selectedLecturer ? `${selectedLecturer.courseCount} courses • ${selectedLecturer.adviseeCount} advisees` : 'Not available'}
          </div>
        </div>
      </div>
    </section>
  );
}
