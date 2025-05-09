import React, { useEffect, useState } from 'react';
import { deviceApi } from '../services/deviceApi';
import { UpdateHistory } from '../types/device';
import Alert from '../components/shared/Alert';
import { UpdateHistoryList } from '../components/UpdateHistory';

const History: React.FC = () => {
  const [history, setHistory] = useState<UpdateHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const response = await deviceApi.getUpdateHistory();
      setHistory(response);
      setError(null);
    } catch (err) {
      setError('업데이트 이력을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await loadHistory();
  };

  return (
    <div className="p-6 pt-20 min-h-screen bg-[#fafafa]">
      {error && (
        <Alert 
          type="error" 
          message={error}
          onClose={() => setError(null)}
        />
      )}
      
      <UpdateHistoryList
        history={history}
        isLoading={loading}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
};

export default History;