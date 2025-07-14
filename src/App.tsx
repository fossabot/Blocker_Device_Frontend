import './App.css';
import AppRouter from './router/AppRouter';
import NavBar from './components/NavBar';
import { UpdateAnimation } from './components/UpdateProgress/UpdateAnimation';
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { showAnimationState, toastsState, updatesRefreshTriggerState } from './store/atoms';
import ToastContainer from './components/shared/ToastContainer';
import { WebSocketProvider, useWebSocketContext } from './hooks/WebSocketContext';
import { Update, UpdateProgress } from './types/device';
import { useEffect } from 'react';

function App() {
  const showAnimation = useRecoilValue(showAnimationState);
  const [toasts, setToasts] = useRecoilState(toastsState);
  const ws = useWebSocketContext();
  const setUpdatesRefreshTrigger = useSetRecoilState(updatesRefreshTriggerState);

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 웹소켓 알림 Toast 모든 페이지에서 처리 및 목록 새로고침 트리거
  useEffect(() => {
    if (!ws?.lastNotification || ws.isNotificationShown(ws.lastNotification)) return;
    const { type, data } = ws.lastNotification;
    if (type === 'new_update' && (data as Update).uid) {
      const updateData = data as Update;
      const toastId = `update-${updateData.uid}`;
      setToasts(prev => {
        if (prev.some(t => t.id === toastId)) return prev;
        return [
          ...prev,
          {
            id: toastId,
            type: 'new',
            title: 'New Update',
            message: `새로운 업데이트 ${updateData.uid}가 있습니다.`,
            progress: 0,
            showProgress: false,
            icon: 'bell'
          }
        ];
      });
      setUpdatesRefreshTrigger((v: number) => v + 1); // 목록 새로고침 트리거
    }
    if (type === 'update_progress' && (data as UpdateProgress).uid) {
      const progressData = data as UpdateProgress;
      const { uid, progress = 0 } = progressData;
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
                  progress
                }
              : t
          );
        }
        return [
          ...prev,
          {
            id: toastId,
            type: 'default',
            title: '업데이트 설치 중',
            message: `${Math.round(progress)}% 완료`,
            progress,
            showProgress: true
          }
        ];
      });
      // 설치 완료시 3초 후 토스트 자동 제거
      if (progress === 100) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 3000);
      }
    }
  }, [ws?.lastNotification]);

  return (
    <div className="App">
      <NavBar />
      <AppRouter />
      {showAnimation && <UpdateAnimation />}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}

export default App;
