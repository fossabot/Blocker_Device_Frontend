import React from 'react';
import Toast from './Toast';

export interface ToastData {
  id: string;
  type: 'default' | 'success' | 'info';
  title: string;
  message?: string;
  percent?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="toast-container fixed top-5 right-5 z-[9999] flex flex-col gap-4 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            percent={toast.percent}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;