import React, { useState, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { showAnimationState } from '../../store/atoms';
import { Scene } from './Scene';

export function UpdateAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCarView, setShowCarView] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const setShowAnimation = useSetRecoilState(showAnimationState);
  const [showBlockchainInfo, setShowBlockchainInfo] = useState(false);
  const [returnedToInitial, setReturnedToInitial] = useState(false);

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
      setReturnedToInitial(false);
      setCurrentStep(prev => prev + 1);
      setButtonLabel("차량 뷰에서 대기 중...");
    } else if (currentStep === 2) {
      // 3단계: 블록체인 정보 수신 및 표시
      console.log('Receiving blockchain information');
      setShowBlockchainInfo(true);
      setCurrentStep(prev => prev + 1);
      setButtonLabel("완료됨");
    } else if (currentStep === 3) {
      // 4단계: 완료
      console.log('Animation sequence complete');
      setCurrentStep(prev => prev + 1);
      setButtonLabel("완료됨");
    }
  }, [currentStep, returnedToInitial]);

  const handleReturnToInitial = useCallback(() => {
    setButtonLabel("블록체인 정보 수신");
  }, []);

  const handleReset = useCallback(() => {
    setIsAnimating(false);
    setShowCarView(false);
    setShowBlockchainInfo(false);
    setReturnedToInitial(false);
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
        <Scene 
          isAnimating={isAnimating} 
          showCarView={showCarView}
          showBlockchainInfo={showBlockchainInfo}
          onReturnToInitial={handleReturnToInitial}
        />
      </div>
      
      <button
        className="close-animation-btn"
        onClick={handleClose}
        aria-label="Close animation"
      >
        ✕
      </button>

      <div className="content-overlay">
        {/* {currentStep >= 1 && (
          <div className="verification-step active">
            블록체인에서 업데이트 트랜잭션 감지됨
            <div className="hash-info">
              <span className="hash-label">트랜잭션 해시:</span>
              <span className="hash-value">0x7d3c...</span>
            </div>
          </div>
        )} */}

        {/* {currentStep >= 2 && (
          <div className="verification-step active">
            구매 완료
          </div>
        )} */}

        {/* {currentStep >= 3 && showBlockchainInfo && (
          <div className="verification-step active blockchain-info">
            <h3>블록체인 정보 수신 완료</h3>
            <div className="info-details">
              <div className="info-row">
                <span className="info-label">IPFS 해시:</span>
                <span className="info-value">QmX8n7d...</span>
              </div>
              <div className="info-row">
                <span className="info-label">CP-ABE 암호문:</span>
                <span className="info-value">A7bF9k...</span>
              </div>
              <div className="info-row">
                <span className="info-label">업데이트 파일 해시:</span>
                <span className="info-value">0xE9c2d...</span>
              </div>
            </div>
          </div>
        )} */}
      </div>

      <div className="controls">
        <button 
          id="play-btn" 
          onClick={handleStartAnimation}
          disabled={currentStep >= 4}
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