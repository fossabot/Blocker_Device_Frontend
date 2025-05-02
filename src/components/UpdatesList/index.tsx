import React, { useState } from 'react';
import { Update } from '../../types/device';
import { deviceApi } from '../../services/deviceApi';
import Button from '../shared/Button';
import Alert from '../shared/Alert';

interface UpdatesListProps {
  updates: Update[];
  onUpdateInstall?: () => void;
  onRefresh?: () => void;
}

const UpdatesList: React.FC<UpdatesListProps> = ({ updates, onUpdateInstall, onRefresh }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInstall = async (update: Update) => {
    try {
      setLoading(update.uid);
      const response = await deviceApi.installUpdate(update.uid);
      
      if (response.success) {
        onUpdateInstall?.();
      } else {
        setError(`업데이트 설치 실패: ${response.message || '알 수 없는 오류'}`);
      }
    } catch (err) {
      setError('업데이트 설치 중 오류가 발생했습니다');
    } finally {
      setLoading(null);
    }
  };

  const handlePurchase = async (update: Update) => {
    if (!update.price) return;
    
    try {
      setLoading(update.uid);
      const response = await deviceApi.purchaseUpdate(update.uid, update.price);
      
      if (response.success) {
        onUpdateInstall?.();
      } else {
        setError(`업데이트 구매 실패: ${response.message || '알 수 없는 오류'}`);
      }
    } catch (err) {
      setError('업데이트 구매 중 오류가 발생했습니다');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="updates-list">
      {error && (
        <Alert 
          type="error" 
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {updates.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          사용 가능한 업데이트가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {updates.map(update => (
            <div key={update.uid} className="update-row">
              <span>{update.uid}</span>
              <span>v{update.version}</span>
              <span>{update.price} ETH</span>
              {loading === update.uid ? (
                <button className="update-btn installing" disabled>
                  설치 중...
                </button>
              ) : update.status === 'installing' ? (
                <button className="update-btn installing" disabled>
                  설치 중
                </button>
              ) : !update.isAuthorized ? (
                <button 
                  className="update-btn install"
                  onClick={() => handlePurchase(update)}
                >
                  구매
                </button>
              ) : (
                <button 
                  className="update-btn install"
                  onClick={() => handleInstall(update)}
                >
                  설치
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdatesList;