import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { deviceApi } from '../services/deviceApi';
import UpdatesList from '../components/UpdatesList';
import Vehicle3DView from '../components/Vehicle3DView';
import DeviceInfo from '../components/DeviceInfo';
import { DeviceInfo as IDeviceInfo, Update, UpdateProgress } from '../types/device';
import ToastContainer, { ToastData } from '../components/shared/ToastContainer';

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
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { lastNotification, isConnected } = useWebSocket();

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
      if (!isConnected) {
        try {
          const updatesData = await deviceApi.getAvailableUpdates();
          setUpdates(updatesData);
        } catch (error) {
          console.error('Failed to load updates:', error);
        }
      }
    };
    loadInitialData();
  }, [isConnected]);

  // WebSocket 알림 처리
  useEffect(() => {
    if (!lastNotification) return;
    
    const isUpdateData = (data: any): data is Update => {
      return 'uid' in data && 'version' in data;
    };

    const isUpdateProgressData = (data: any): data is UpdateProgress => {
      return 'uid' in data && 'progress' in data;
    };

    if (lastNotification.type === 'new_update' && isUpdateData(lastNotification.data)) {
      console.log('[Dashboard] Creating toast for new update:', lastNotification.data);
      
      // 즉시 토스트 생성
      const updateData = lastNotification.data;
      const toastId = `update-${updateData.uid}-${Date.now()}`;
      const newToast = {
        id: toastId,
        type: 'info' as const,
        title: `새로운 업데이트 v${updateData.version}`,
        message: updateData.description || '새로운 업데이트가 있습니다'
      };
      console.log('[Dashboard] Adding new toast:', newToast);
      setToasts(prevToasts => [...prevToasts, newToast]);

      // 목록 갱신
      console.log('[Dashboard] Refreshing updates list after new update');
      handleRefresh();

      // 10초 후 토스트 제거
      setTimeout(() => {
        console.log('[Dashboard] Removing toast:', toastId);
        setToasts(prevToasts => prevToasts.filter(t => t.id !== toastId));
      }, 10000);
    }

    if (lastNotification.type === 'update_progress' && isUpdateProgressData(lastNotification.data)) {
      const progressData = lastNotification.data;
      const { uid, progress = 0 } = progressData;
      
      setUpdates(prev => prev.map(update => 
        update.uid === uid 
          ? { ...update, progress, status: progress === 100 ? 'completed' : 'installing' }
          : update
      ));

      const toastId = `progress-${uid}`;
      setToasts(prev => {
        const existing = prev.find(t => t.id === toastId);
        if (existing) {
          return prev.map(t => 
            t.id === toastId 
              ? { 
                  ...t, 
                  type: progress === 100 ? 'success' : 'default',
                  title: progress === 100 
                    ? '업데이트 완료!'
                    : `업데이트 진행 중: ${progress}%`,
                  percent: progress 
                }
              : t
          );
        }
        return [
          ...prev,
          {
            id: toastId,
            type: 'default',
            title: `업데이트 진행 중: ${progress}%`,
            percent: progress
          }
        ];
      });

      if (progress === 100) {
        loadDeviceInfo();
        setTimeout(() => {
          setToasts(prevToasts => prevToasts.filter(t => t.id !== toastId));
        }, 5000);
      }
    }
  }, [lastNotification]);

  // 새로고침 처리 - HTTP 요청 사용
  const handleRefresh = async () => {
    try {
      console.log('[Dashboard] Refreshing updates list...');
      const updatesData = await deviceApi.getAvailableUpdates();
      console.log('[Dashboard] Got updates:', updatesData);
      setUpdates(updatesData);
    } catch (error) {
      console.error('Failed to refresh updates:', error);
    }
  };

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="main-frame">
      <Vehicle3DView />
      
      <div className="bottom-cards">
        <UpdatesList 
          updates={updates} 
          onUpdateInstall={loadDeviceInfo}
          onRefresh={handleRefresh}
        />
        
        <DeviceInfo info={deviceInfo} />
      </div>
      
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};

export default Dashboard;