interface ScopeOption {
  id: string;
  label: string;
}

interface AcademicScopePanelProps {
  title: string;
  description: string;
  facultyId: string;
  departmentId: string;
  programmeId: string;
  levelId: string;
  faculties: ScopeOption[];
  departments: ScopeOption[];
  programmes: ScopeOption[];
  levels: ScopeOption[];
  resultLabel: string;
  resultCount: number;
  resultMeta: string;
  emptyMessage: string;
  onFacultyChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onProgrammeChange: (value: string) => void;
  onLevelChange: (value: string) => void;
}

export function AcademicScopePanel({
  title,
  description,
  facultyId,
  departmentId,
  programmeId,
  levelId,
  faculties,
  departments,
  programmes,
  levels,
  resultLabel,
  resultCount,
  resultMeta,
  emptyMessage,
  onFacultyChange,
  onDepartmentChange,
  onProgrammeChange,
  onLevelChange,
}: AcademicScopePanelProps) {
  const hasRequiredScope = Boolean(facultyId && departmentId);

  return (
    <section className="scope-panel">
      <div className="scope-panel__header">
        <div>
          <span className="eyebrow">Required scope</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="scope-panel__summary">
          <strong>{resultCount}</strong>
          <span>{resultLabel}</span>
          <p>{hasRequiredScope ? resultMeta : emptyMessage}</p>
        </div>
      </div>

      <div className="scope-panel__grid">
        <label className="field-group">
          <span>Faculty</span>
          <select value={facultyId} onChange={(event) => onFacultyChange(event.target.value)}>
            <option value="">Select faculty</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Department</span>
          <select value={departmentId} onChange={(event) => onDepartmentChange(event.target.value)} disabled={!facultyId}>
            <option value="">{facultyId ? 'Select department' : 'Choose faculty first'}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Programme</span>
          <select value={programmeId} onChange={(event) => onProgrammeChange(event.target.value)} disabled={!departmentId}>
            <option value="">{departmentId ? 'All programmes' : 'Choose department first'}</option>
            {programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-group">
          <span>Level</span>
          <select value={levelId} onChange={(event) => onLevelChange(event.target.value)} disabled={!programmeId}>
            <option value="">{programmeId ? 'All levels' : 'Choose programme first'}</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
