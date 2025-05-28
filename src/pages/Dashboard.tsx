import React, { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useWebSocketContext } from '../hooks/WebSocketContext';
import { deviceApi } from '../services/deviceApi';
import { toastsState } from '../store/atoms';
import UpdatesList from '../components/UpdatesList';
import Vehicle3DView from '../components/Vehicle3DView';
import DeviceInfo from '../components/DeviceInfo';
import { DeviceInfo as IDeviceInfo, Update, UpdateProgress } from '../types/device';

const Dashboard: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<IDeviceInfo>({
    id: 'Unknown',
    model: 'Unknown',
    serialNumber: 'Unknown',
    version: 'Unknown',
    status: 'normal',
    lastUpdate: undefined
  });
  const [updates, setUpdates] = useState<Update[]>([]);
  const { lastNotification, isNotificationShown } = useWebSocketContext();
  const setToasts = useSetRecoilState(toastsState);

  const loadDeviceInfo = async () => {
    try {
      const info = await deviceApi.getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to load device info:', error);
      setDeviceInfo({
        id: 'Unknown',
        model: 'Unknown',
        serialNumber: 'Unknown',
        version: 'Unknown',
        status: 'error'
      });
    }
  };

  // 초기 로딩 시 HTTP로 데이터 가져오기
  useEffect(() => {
    const loadInitialData = async () => {
      await loadDeviceInfo();
      try {
        const updatesData = await deviceApi.getAvailableUpdates();
        setUpdates(updatesData);
      } catch (error) {
        console.error('Failed to load updates:', error);
      }
    };
    loadInitialData();
  }, []);

  // WebSocket 알림 처리
  useEffect(() => {
    if (!lastNotification || isNotificationShown(lastNotification)) return;
    
    const isUpdateData = (data: any): data is Update => {
      return 'uid' in data && 'version' in data;
    };

    const isUpdateProgressData = (data: any): data is UpdateProgress => {
      return 'uid' in data && 'progress' in data;
    };

    if (lastNotification.type === 'new_update' && isUpdateData(lastNotification.data)) {
      console.log('[Dashboard] Creating toast for new update:', lastNotification.data);
      const updateData = lastNotification.data;
      const toastId = `update-${updateData.uid}`;
      const newToast = {
        id: toastId,
        type: 'new' as const,
        title: `New Update`,
        message: `새로운 업데이트 ${updateData.uid}가 있습니다.`,
        progress: 0,
        showProgress: false,
        icon: 'bell' as const
      };
      setToasts(prevToasts => {
        if (prevToasts.some(t => t.id === toastId)) return prevToasts;
        return [...prevToasts, newToast];
      });
      handleRefresh();
    }

    if (lastNotification.type === 'update_progress' && isUpdateProgressData(lastNotification.data)) {
      const progressData = lastNotification.data;
      const { uid, progress = 0 } = progressData;
      
      setUpdates(prev => prev.map(update => 
        update.uid === uid 
          ? { ...update, progress, status: progress === 100 ? 'completed' : 'installing' }
          : update
      ));

      // Update existing progress toast or create new one
      const toastId = `install-${uid}`;
      setToasts(prev => {
        const existing = prev.find(t => t.id === toastId);
        if (existing) {
          return prev.map(t => 
            t.id === toastId 
              ? { 
                  ...t, 
                  type: progress === 100 ? 'success' : 'default',
                  title: progress === 100 ? '업데이트 설치 완료!' : '업데이트 설치 중',
                  message: `${Math.round(progress)}% 완료`,
                  percent: progress 
                }
              : t
          );
        }
        return prev;
      });

      if (progress === 100) {
        loadDeviceInfo();
        setTimeout(() => {
          setToasts(prevToasts => prevToasts.filter(t => t.id !== toastId));
        }, 3000);
      }
    }
  }, [lastNotification]);

  const handleRefresh = async () => {
    try {
      const updatesData = await deviceApi.getAvailableUpdates();
      setUpdates(updatesData);
    } catch (error) {
      console.error('Failed to refresh updates:', error);
      setToasts(prev => [...prev, {
        id: `error-refresh-${Date.now()}`,
        type: 'default',
        title: '오류',
        message: '업데이트 목록을 새로고침하는데 실패했습니다',
        progress: 0
      }]);
    }
  };

  return (
    <div className="main-frame">
      <Vehicle3DView deviceInfo={deviceInfo} />
      <div className="bottom-cards">
        <UpdatesList 
          updates={updates} 
          onUpdateInstall={loadDeviceInfo}
          onRefresh={handleRefresh}
        />
        <DeviceInfo info={deviceInfo} />
      </div>
      {/* ToastContainer는 App에서만 렌더링 */}
    </div>
  );
};

export default Dashboard;