import React, { useEffect, useState, useRef } from 'react';
import type { ToastData } from './ToastContainer';

type ToastProps = ToastData & {
  onClose: (id: string) => void;
};

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type,
  title, 
  message, 
  progress = 0,
  completed = false,
  onClose 
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const prevTypeRef = useRef(type);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // 이전 상태가 일반이고 현재 상태가 에러로 변경된 경우
    if (prevTypeRef.current !== 'error' && type === 'error') {
      // 현재 진행률부터 5%까지 부드럽게 증가
      const startProgress = currentProgress;
      const targetProgress = Math.max(5, startProgress);
      const startTime = performance.now();
      const duration = 500; // 500ms

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOut 효과 적용
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        const nextProgress = startProgress + (targetProgress - startProgress) * easeProgress;
        
        setCurrentProgress(nextProgress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } 
    // 일반적인 진행 상황 업데이트
    else if (type !== 'error') {
      setCurrentProgress(progress);
    }

    prevTypeRef.current = type;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [progress, type, currentProgress]);

  const getTypeStyles = () => {
    if (completed) {
      return {
        icon: "bg-green-500",
        progress: "bg-green-500",
        text: "text-green-600"
      };
    }
    
    switch (type) {
      case 'error':
        return {
          icon: "bg-red-500",
          progress: "bg-red-500",
          text: "text-red-600"
        };
      case 'success':
      case 'info':
      default:
        return {
          icon: "bg-gray-800",
          progress: "bg-gray-800",
          text: "text-gray-700"
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="w-80 rounded-lg shadow-md px-3 pt-2 pb-3 bg-white border relative">
      <button
        className="absolute -top-1 right-1 text-gray-400 hover:text-gray-600"
        onClick={() => onClose(id)}
      >
        &times;
      </button>
      <div className="flex flex-col">
        <div className="flex items-start gap-2 pr-5">
          <div className={`w-6 h-6 flex items-center justify-center rounded-md mt-1 ${styles.icon}`}>
            {completed ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : type === 'error' ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-base font-semibold truncate">
              {title || (completed ? "Complete!" : "Updating...")}
            </p>
          </div>
        </div>
        {message && (
          <div className="pl-8">
            <p className="text-xs text-gray-600">{message}</p>
          </div>
        )}
      </div>

      {type !== 'error' && (
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full transition-all duration-300 ease-out ${styles.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;