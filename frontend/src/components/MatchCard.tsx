import { Match } from '../types/football';
import { formatDate, formatTime } from '../utils/date';

const FINISHED = new Set(['FINISHED', 'AWARDED']);

export const isFinished = (status: string): boolean => FINISHED.has(status);

const MatchCard = ({ match }: { match: Match }) => {
  const played = isFinished(match.status);
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(match.utcDate)}</span>
        {match.matchday !== null && <span>الجولة {match.matchday}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          {match.homeTeam.crest && (
            <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="h-10 w-10 object-contain" loading="lazy" />
          )}
          <span className="line-clamp-1 text-center text-xs font-medium">
            {match.homeTeam.shortName ?? match.homeTeam.name}
          </span>
        </div>

        <div className="flex flex-col items-center px-2">
          {played ? (
            <span className="text-xl font-bold text-gray-900">
              {match.score.fullTime.home ?? 0} - {match.score.fullTime.away ?? 0}
            </span>
          ) : (
            <span className="text-sm font-semibold text-blue-600">
              {formatTime(match.utcDate)}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          {match.awayTeam.crest && (
            <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="h-10 w-10 object-contain" loading="lazy" />
          )}
          <span className="line-clamp-1 text-center text-xs font-medium">
            {match.awayTeam.shortName ?? match.awayTeam.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
