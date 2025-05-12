import React, { useState, useCallback } from 'react';
import { Scene } from './Scene';
import { useSetRecoilState } from 'recoil';
import { showAnimationState } from '../../store/atoms';

export function UpdateAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const setShowAnimation = useSetRecoilState(showAnimationState);

  const steps = [
    "현재 차량 상태 스캔 중...",
    "IPFS 네트워크에 업데이트 파일 업로드 중...",
    "블록체인에 업데이트 정보 기록 중...",
    "업데이트 검증 진행 중...",
    "업데이트 완료!"
  ];

  const handleStartAnimation = useCallback(() => {
    setIsAnimating(true);
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      if (step === 2) {  // 블록체인에 업데이트 정보 기록 단계에서
        setIsAnimating(true);  // 카메라 줌인 시작
      } else if (step === 3) {  // 다음 단계에서
        setIsAnimating(false);  // 카메라 원위치
      }
      setCurrentStep(step);
      
      if (step >= steps.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 5000);
  }, [steps.length]);

  const handleReset = useCallback(() => {
    setIsAnimating(false);
    setCurrentStep(0);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    setShowAnimation(false);
  }, [handleReset, setShowAnimation]);

  return (
    <div className="update-animation">
      <div className="scene-container">
        <Scene isAnimating={isAnimating} />
      </div>
      
      <button
        className="close-animation-btn"
        onClick={handleClose}
        aria-label="Close animation"
      >
        ✕
      </button>

      <div className="content-overlay">
        <div className="description" style={{ opacity: isAnimating ? 1 : 0 }}>
          {steps[currentStep]}
        </div>

        <div className="transaction-info">
          {currentStep >= 1 && (
            <div className="verification-step active">
              <span className="hash-value">QmW12XF...</span>
              IPFS에 업로드 완료
            </div>
          )}
          {currentStep >= 2 && (
            <div className="verification-step active">
              트랜잭션 해시:
              <span className="hash-value">0x7d3c...</span>
            </div>
          )}
          {currentStep >= 3 && (
            <div className="decryption-process">
              <div className="decryption-step active">
                서명 검증 완료
              </div>
              <div className="decryption-arrow">↓</div>
              <div className="decryption-step active">
                해시값 검증 완료
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="controls">
        <button 
          id="play-btn" 
          onClick={handleStartAnimation}
          disabled={isAnimating}
        >
          애니메이션 시작
        </button>
        <button 
          id="reset-btn" 
          onClick={handleReset}
          disabled={!isAnimating && currentStep === 0}
        >
          처음부터
        </button>
      </div>
    </div>
  );
}