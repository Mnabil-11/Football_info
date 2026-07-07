import { useEffect, useState } from 'react';
import { fetchScheduledEvents, teamLogoUrl } from '../api';
import { ScheduledEvent } from '../types';

interface ScheduledMatchesProps {
  date: string;
  categoryId: number;
}

const ScheduledMatches = ({ date, categoryId }: ScheduledMatchesProps) => {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchScheduledEvents(date, categoryId);
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [date, categoryId]);

  const formatTime = (timestamp: number): string =>
    new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المباريات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">حدث خطأ</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">مباريات اليوم</h1>
          <p className="text-gray-600">{date}</p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
              {events.length}
            </span>
            المباريات
          </h2>

          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد مباريات في هذا التاريخ</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{formatTime(event.startTimestamp)}</span>
                    <span>{event.tournament.category.name}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col items-center flex-1">
                      <img
                        src={teamLogoUrl(event.homeTeam.id)}
                        alt={event.homeTeam.name}
                        className="w-12 h-12 mb-2"
                      />
                      <span className="text-sm font-medium text-center">
                        {event.homeTeam.name}
                      </span>
                      {event.homeScore.current !== undefined && (
                        <span className="text-2xl font-bold text-gray-900 mt-1">
                          {event.homeScore.current}
                        </span>
                      )}
                    </div>

                    <div className="text-xl font-bold text-gray-400 mx-4">-</div>

                    <div className="flex flex-col items-center flex-1">
                      <img
                        src={teamLogoUrl(event.awayTeam.id)}
                        alt={event.awayTeam.name}
                        className="w-12 h-12 mb-2"
                      />
                      <span className="text-sm font-medium text-center">
                        {event.awayTeam.name}
                      </span>
                      {event.awayScore.current !== undefined && (
                        <span className="text-2xl font-bold text-gray-900 mt-1">
                          {event.awayScore.current}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      {event.tournament.name} · {event.status.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ScheduledMatches;
