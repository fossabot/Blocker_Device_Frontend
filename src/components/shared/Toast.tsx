import React from 'react';

interface ToastProps {
  id: string;
  type: 'default' | 'success';
  title: string;
  percent?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, title, percent, onClose }) => {
  return (
    <div className={`toast min-w-[260px] bg-white rounded-lg shadow-lg p-5 flex items-center gap-4 relative ${type === 'success' ? 'success' : ''}`}>
      <button className="toast-close absolute top-2 right-3 text-xl text-gray-400" onClick={() => onClose(id)}>
        &times;
      </button>
      <div>
        <div className={`toast-title text-base font-semibold mb-2 ${type === 'success' ? 'text-[#25cb55]' : 'text-[#2e2e2e]'}`}>
          {title}
        </div>
        {typeof percent === 'number' && (
          <div>
            <div className="progress-bar-bg w-[180px] h-2 bg-[#dfe4ea] rounded-full relative">
              <div 
                className={`progress-bar-fg h-2 rounded-full absolute left-0 top-0 ${
                  type === 'success' ? 'bg-[#25cb55]' : 'bg-[#3b3c3b]'
                }`} 
                style={{ width: `${percent}%` }} 
              />
              <span 
                className={`progress-percent text-xs text-white px-2 py-0.5 rounded absolute -top-5 right-0 ${
                  type === 'success' ? 'bg-[#25cb55]' : 'bg-[#3b3c3b]'
                }`}
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