import React, { useState } from 'react';
import { Update } from '../../types/device';
import { deviceApi } from '../../services/deviceApi';
import Alert from '../shared/Alert';
import { formatEther } from '../../utils/formatter';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSetRecoilState } from 'recoil';
import { toastsState } from '../../store/atoms';
import SyncLoader from 'react-spinners/SyncLoader';
import { v4 as uuidv4 } from 'uuid';

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

  // Toast 추가 함수 (중복 방지)
  const addToast = (toast: any) => {
    setToasts(prev => {
      if (prev.some(t => t.id === toast.id)) return prev;
      return [...prev, toast];
    });
  };

  // Toast 삭제 함수
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handlePurchaseAndInstall = async (update: Update) => {
    if (!update.price) return;
    
    // 항상 고유한 id 사용
    const purchaseToastId = `purchase-${update.uid}-${uuidv4()}`;
    const errorToastId = `error-${update.uid}-${uuidv4()}`;
    let purchaseInterval: NodeJS.Timeout | null = null;
    let installInterval: NodeJS.Timeout | null = null;

    try {
      setLoading(update.uid);
      
      // Add purchase toast
      addToast({
        id: purchaseToastId,
        type: 'info',
        title: 'Purchase',
        message: `${update.uid} 구매 중`,
        progress: 0
      });

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
      removeToast(purchaseToastId);
      addToast({
        id: `success-purchase-${update.uid}-${uuidv4()}`,
        type: 'success',
        title: 'Complete!',
        message: `${update.uid}의 구매가 완료되었습니다`,
        progress: 100,
        completed: true
      });

      // Add installation toast
      const installToastId = `install-${update.uid}-${uuidv4()}`;
      addToast({
        id: installToastId,
        type: 'info',
        title: 'Installing...',
        message: `${update.uid} 설치 중`,
        progress: 0
      });

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
      removeToast(installToastId);
      addToast({
        id: `success-install-${update.uid}-${uuidv4()}`,
        type: 'success',
        title: 'Complete!',
        message: `${update.uid} 설치가 완료되었습니다`,
        progress: 100,
        completed: true
      });

      // 설치 성공 시 즉시 deviceInfo 갱신 (BounceLoader 반영)
      onUpdateInstall?.();
      
    } catch (err) {
      if (purchaseInterval) {
        clearInterval(purchaseInterval);
      }
      if (installInterval) {
        clearInterval(installInterval);
      }
      const errorMessage = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다';
      addToast({
        id: errorToastId,
        type: 'error',
        title: 'Error',
        message: errorMessage,
        progress: 0
      });
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
    <div className="card flex flex-col bg-[#fafafa]/80 rounded-md shadow-sm p-6 min-h-[300px]" style={{ maxWidth: '1200px', width: '130%', margin: '0 auto' }}>
      <div className="card-header flex justify-between items-center mb-1">
        <div className="card-title text-xl font-semibold text-[#2e2e2e]">
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
          <div className="space-y-2 w-full">
            {updates.map(update => (
              <div key={`${update.uid}-${update.version}`} className="update-row flex text-base w-full">
                <span className="flex-1 truncate" title={update.uid}>{update.uid}</span>
                <span className="w-20 text-left truncate">v.{update.version}</span>
                <span className="w-24 text-right truncate">{update.price ? `${formatEther(update.price.toString())} ETH` : '-'}</span>
                <div className="ml-8 mr-2">
                  {loading === update.uid || update.status === 'installing' ? (
                    <button
                      className="update-btn installing flex items-center justify-center"
                      disabled
                      style={{ width: 56, height: 32, minWidth: 56, minHeight: 32, padding: 0, lineHeight: '32px' }}
                    >
                      <SyncLoader size={4} color="#fff" style={{ display: 'block', margin: '0 auto' }} />
                    </button>
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