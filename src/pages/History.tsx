import React, { useEffect, useState } from 'react';
import { deviceApi } from '../services/deviceApi';
import { Update } from '../types/device';
import Alert from '../components/shared/Alert';
import { formatDate } from '../utils/formatter';

const History: React.FC = () => {
  const [history, setHistory] = useState<Update[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await deviceApi.getUpdateHistory();
        setHistory(response);
      } catch (err) {
        setError('업데이트 이력을 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-md">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <Alert 
          type="error" 
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <h1 className="text-2xl font-bold mb-6">업데이트 이력</h1>
      
      {history.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-gray-500">
          업데이트 이력이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((update) => (
            <div key={update.uid} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">버전 {update.version}</h3>
                  <p className="text-sm text-gray-500">{update.description}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(update.date)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-green-600 text-sm">설치 완료</span>
                {update.price && (
                  <span className="text-sm text-gray-500">
                    비용: {update.price} ETH
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;