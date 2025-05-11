import React from 'react';
import Toast from './Toast';

export interface ToastData {
  id: string;
  type: 'default' | 'success' | 'info' | 'error' | 'warning' | 'new'; 
  title: string;
  message?: string;
  progress: number;
  completed?: boolean;
  showProgress?: boolean; // 진행바 숨김 옵션
  icon?: 'exclamation' | 'check' | 'error' | 'info' | 'bell'; 
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="toast-container fixed top-[72px] right-5 z-[9999] flex flex-col gap-4 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;