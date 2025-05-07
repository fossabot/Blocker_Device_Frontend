import React, { useState } from 'react';
import { Update } from '../../types/device';
import { deviceApi } from '../../services/deviceApi';
import Alert from '../shared/Alert';
import { formatEther } from '../../utils/formatter';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface UpdatesListProps {
  updates: Update[];
  onUpdateInstall?: () => void;
  onRefresh?: () => void;
}

const UpdatesList: React.FC<UpdatesListProps> = ({ updates, onUpdateInstall, onRefresh }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="card flex flex-col bg-[#fafafa]/80 rounded-md shadow-sm p-6 w-[500px] min-h-[200px] max-h-[250px]">
      <div className="card-header flex justify-between items-center mb-4">
        <div className="card-title text-lg font-semibold text-[#2e2e2e]">
          Available Updates
        </div>
        <button 
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className={`p-1.5 rounded-full hover:bg-gray-100 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
          title="업데이트 목록 새로고침"
        >
          <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="card-content overflow-y-auto">
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}
        
        {updates.length === 0 ? (
          <div className="text-sm text-gray-500">사용 가능한 업데이트가 없습니다</div>
        ) : (
          <div className="space-y-2">
            {updates.map(update => (
              <div key={`${update.uid}-${update.version}`} className="update-row flex justify-between text-sm">
                <span>{update.uid}</span>
                <span>v{update.version}</span>
                <span>{update.price ? `${formatEther(update.price.toString())} ETH` : '-'}</span>
                <div>
                  {loading === update.uid ? (
                    <button className="update-btn installing" disabled>설치 중...</button>
                  ) : update.status === 'installing' ? (
                    <button className="update-btn installing" disabled>설치 중</button>
                  ) : !update.isAuthorized ? (
                    <button 
                      className="update-btn install" 
                      onClick={() => handlePurchase(update)}
                      disabled={loading !== null}
                    >
                      구매
                    </button>
                  ) : (
                    <button 
                      className="update-btn install" 
                      onClick={() => handleInstall(update)}
                      disabled={loading !== null}
                    >
                      설치
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesList;