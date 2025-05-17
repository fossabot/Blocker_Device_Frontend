import React, { useState, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { showAnimationState } from '../../store/atoms';
import { Scene } from './Scene';

export function UpdateAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCarView, setShowCarView] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const setShowAnimation = useSetRecoilState(showAnimationState);

  const [buttonLabel, setButtonLabel] = useState("블록체인으로 이동");

  const handleStartAnimation = useCallback(() => {
    if (currentStep === 0) {
      // 1단계: 블록체인으로 이동 (자동으로 원래 위치로 복귀)
      console.log('Starting camera movement to blockchain');
      setIsAnimating(true);
      setCurrentStep(prev => prev + 1);
      setButtonLabel("차량 뷰로 이동");
    } else if (currentStep === 1) {
      // 2단계: 차량 뷰로 이동
      console.log('Moving to car view');
      setIsAnimating(false);
      setShowCarView(true);
      setCurrentStep(prev => prev + 1);
      setButtonLabel("애니메이션 완료");
    } else if (currentStep === 2) {
      // 3단계: 완료
      console.log('Animation sequence complete');
      setCurrentStep(prev => prev + 1);
      setButtonLabel("완료됨");
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setIsAnimating(false);
    setShowCarView(false);
    setCurrentStep(0);
    setButtonLabel("블록체인으로 이동");
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    setShowAnimation(false);
  }, [handleReset, setShowAnimation]);

  return (
    <div className="update-animation">
      <div className="scene-container">
        <Scene isAnimating={isAnimating} showCarView={showCarView} />
      </div>
      
      <button
        className="close-animation-btn"
        onClick={handleClose}
        aria-label="Close animation"
      >
        ✕
      </button>

      <div className="content-overlay">
        {currentStep >= 1 && (
          <div className="verification-step active">
            블록체인에서 업데이트 트랜잭션 감지됨
            <div className="hash-info">
              <span className="hash-label">트랜잭션 해시:</span>
              <span className="hash-value">0x7d3c...</span>
            </div>
          </div>
        )}

        {currentStep >= 2 && (
          <div className="verification-step active">
            업데이트 설치 완료
          </div>
        )}
      </div>

      <div className="controls">
        <button 
          id="play-btn" 
          onClick={handleStartAnimation}
          disabled={currentStep >= 3}
        >
          {buttonLabel}
        </button>
        <button 
          id="reset-btn" 
          onClick={handleReset}
          disabled={currentStep === 0}
        >
          처음부터
        </button>
      </div>
    </div>
  );
}