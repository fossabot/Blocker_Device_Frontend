import React, { useState } from 'react';
import { Update } from '../../types/device';
import { deviceApi } from '../../services/deviceApi';
import Alert from '../shared/Alert';
import { formatEther } from '../../utils/formatter';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSetRecoilState } from 'recoil';
import { toastsState } from '../../store/atoms';

interface UpdatesListProps {
  updates: Update[];
  onUpdateInstall?: () => void;
  onRefresh?: () => void;
}

const UpdatesList: React.FC<UpdatesListProps> = ({ updates, onUpdateInstall, onRefresh }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const setToasts = useSetRecoilState(toastsState);

  const handlePurchaseAndInstall = async (update: Update) => {
    if (!update.price) return;
    
    const purchaseToastId = `purchase-${update.uid}`;
    const errorToastId = `error-${update.uid}`;
    let purchaseInterval: NodeJS.Timeout | null = null;
    let installInterval: NodeJS.Timeout | null = null;

    try {
      setLoading(update.uid);
      
      // Add purchase toast
      setToasts(prev => [...prev, {
        id: purchaseToastId,
        type: 'info',
        title: 'Purchase',
        message: `${update.uid} 구매 중`,
        progress: 0
      }]);

      let purchaseProgress = 0;
      // Start progress animation for purchase
      purchaseInterval = setInterval(() => {
        purchaseProgress += 2;
        if (purchaseProgress <= 90) {
          setToasts(prev => prev.map(toast => 
            toast.id === purchaseToastId 
              ? { ...toast, progress: purchaseProgress }
              : toast
          ));
        }
      }, 100);
      
      const purchaseResponse = await deviceApi.purchaseUpdate(update.uid, update.price);
      
      if (purchaseInterval) {
        clearInterval(purchaseInterval);
        purchaseInterval = null;
      }
      
      if (!purchaseResponse.success) {
        throw new Error(purchaseResponse.message || '구매 실패');
      }

      // Show purchase success toast
      setToasts(prev => [
        ...prev.filter(t => t.id !== purchaseToastId),
        {
          id: `success-purchase-${update.uid}`,
          type: 'success',
          title: 'Complete!',
          message: `${update.uid}의 구매가 완료되었습니다`,
          progress: 100,
          completed: true
        }
      ]);

      // Add installation toast
      const installToastId = `install-${update.uid}`;
      setToasts(prev => [...prev, {
        id: installToastId,
        type: 'info',
        title: 'Installing...',
        message: `${update.uid} 설치 중`,
        progress: 0
      }]);

      let installProgress = 0;
      // Start progress animation for installation
      installInterval = setInterval(() => {
        installProgress += 2;
        if (installProgress <= 90) {
          setToasts(prev => prev.map(toast => 
            toast.id === installToastId 
              ? { ...toast, progress: installProgress }
              : toast
          ));
        }
      }, 100);

      const installResponse = await deviceApi.installUpdate(update.uid);
      
      if (installInterval) {
        clearInterval(installInterval);
        installInterval = null;
      }
      
      if (!installResponse.success) {
        throw new Error(installResponse.message || '설치 실패');
      }

      // Show installation success toast
      setToasts(prev => [
        ...prev.filter(t => t.id !== installToastId),
        {
          id: `success-install-${update.uid}`,
          type: 'success',
          title: 'Complete!',
          message: `${update.uid} 설치가 완료되었습니다`,
          progress: 100,
          completed: true
        }
      ]);

      onUpdateInstall?.();
      
    } catch (err) {
      // Clear any running intervals
      if (purchaseInterval) {
        clearInterval(purchaseInterval);
      }
      if (installInterval) {
        clearInterval(installInterval);
      }

      const errorMessage = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다';
      
      // Add error toast while keeping the current progress toast
      setToasts(prev => [...prev, {
        id: errorToastId,
        type: 'error',
        title: 'Error',
        message: errorMessage,
        progress: 0
      }]);
      
      setError(null);
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
      <div className="card-header flex justify-between items-center mb-1">
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
              <div key={`${update.uid}-${update.version}`} className="update-row flex text-sm">
                <span className="w-52 truncate" title={update.uid}>{update.uid}</span>
                <span className="w-12 text-left truncate">v.{update.version}</span>
                <span className="w-24 text-right truncate">{update.price ? `${formatEther(update.price.toString())} ETH` : '-'}</span>
                <div className="ml-6">
                  {loading === update.uid ? (
                    <button className="update-btn installing" disabled>처리 중...</button>
                  ) : update.status === 'installing' ? (
                    <button className="update-btn installing" disabled>설치 중</button>
                  ) : (
                    <button 
                      className="update-btn install" 
                      onClick={() => handlePurchaseAndInstall(update)}
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