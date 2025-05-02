import React from 'react';
import Toast from './Toast';

export interface ToastData {
  id: string;
  type: 'default' | 'success';
  title: string;
  percent?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="toast-container fixed top-[110px] right-10 z-[1000] flex flex-col gap-4 items-end">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          percent={toast.percent}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer;