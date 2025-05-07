import React from 'react';

interface ToastProps {
  id: string;
  type: 'default' | 'success' | 'info';
  title: string;
  message?: string;
  percent?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, title, message, percent, onClose }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          text: 'text-[#25cb55]',
          progress: 'bg-[#25cb55]'
        };
      case 'info':
        return {
          text: 'text-[#3b82f6]',
          progress: 'bg-[#3b82f6]'
        };
      default:
        return {
          text: 'text-[#2e2e2e]',
          progress: 'bg-[#3b3c3b]'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`toast min-w-[260px] bg-white rounded-lg shadow-lg p-5 flex items-center gap-4 relative backdrop-blur-sm border border-gray-100 ${type === 'success' ? 'success' : ''}`}>
      <button className="toast-close absolute top-2 right-3 text-xl text-gray-400 hover:text-gray-600" onClick={() => onClose(id)}>
        &times;
      </button>
      <div className="w-full">
        <div className={`toast-title text-base font-semibold mb-2 ${styles.text}`}>
          {title}
        </div>
        {message && (
          <div className="text-sm text-gray-600 mb-2">{message}</div>
        )}
        {typeof percent === 'number' && (
          <div>
            <div className="progress-bar-bg w-full h-2 bg-[#dfe4ea] rounded-full relative">
              <div 
                className={`progress-bar-fg h-2 rounded-full absolute left-0 top-0 ${styles.progress}`}
                style={{ width: `${percent}%` }} 
              />
              <span 
                className={`progress-percent text-xs text-white px-2 py-0.5 rounded absolute -top-5 right-0 ${styles.progress}`}
              >
                {percent}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;