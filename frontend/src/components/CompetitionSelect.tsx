import { Competition } from '../types/football';

interface CompetitionSelectProps {
  competitions: Competition[];
  value: string;
  onChange: (code: string) => void;
}

const CompetitionSelect = ({
  competitions,
  value,
  onChange,
}: CompetitionSelectProps) => (
  <div className="mx-auto max-w-md">
    <label htmlFor="competition" className="mb-1 block text-sm text-gray-600">
      اختر المسابقة
    </label>
    <select
      id="competition"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none"
    >
      {competitions.map((c) => (
        <option key={c.id} value={c.code}>
          {c.name} — {c.area.name}
        </option>
      ))}
    </select>
  </div>
);

export default CompetitionSelect;
