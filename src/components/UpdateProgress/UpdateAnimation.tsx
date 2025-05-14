import React, { useState, useCallback } from 'react';
import { Scene } from './Scene';
import { useSetRecoilState } from 'recoil';
import { showAnimationState } from '../../store/atoms';

export function UpdateAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const setShowAnimation = useSetRecoilState(showAnimationState);

  const steps = [
    "블록체인에서 업데이트 트랜잭션 감지 중...",
    "업데이트 구매 트랜잭션 전송 중...",
    "블록체인에서 암호화 키 및 IPFS 정보 수신 중...",
    "IPFS에서 암호화된 파일 다운로드 중...",
    "파일 무결성 검증 중...",
    "CP-ABE로 대칭키 복호화 중...",
    "업데이트 파일 복호화 중...",
    "설치 완료 확인 전송 중..."
  ];

  const handleStartAnimation = useCallback(() => {
    setIsAnimating(true);
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      if (step === 0) {  // 트랜잭션 감지 단계에서
        setIsAnimating(true);  // 카메라 줌인 시작
      } else if (step === 1) {  // 구매 트랜잭션 전송 단계에서
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
          {currentStep >= 2 && (
            <div className="verification-step active">
              트랜잭션 해시:
              <span className="hash-value">0x7d3c...</span>
            </div>
          )}
          {currentStep >= 3 && (
            <div className="verification-step active">
              CP-ABE 키 및 IPFS 정보 수신됨
              <div className="hash-info">
                <span className="hash-label">IPFS 해시:</span>
                <span className="hash-value">QmW12XF...</span>
              </div>
            </div>
          )}
          {currentStep >= 5 && (
            <div className="decryption-process">
              <div className="decryption-step active">
                파일 해시 검증 완료
              </div>
              <div className="decryption-arrow">↓</div>
              <div className="decryption-step active">
                CP-ABE 키로 복호화 진행
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