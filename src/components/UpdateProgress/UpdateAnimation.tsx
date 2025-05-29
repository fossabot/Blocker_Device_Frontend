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
  const [isDownloading, setIsDownloading] = useState(false);
  const [ipfsFileInfo, setIpfsFileInfo] = useState<{
    cid: string;
    name: string;
    size: number;
  } | undefined>(undefined);
  const [hidePanels, setHidePanels] = useState(false);
  const [carDriveStage, setCarDriveStage] = useState<'idle' | 'back' | 'forward'>('idle');

  const [buttonLabel, setButtonLabel] = useState("블록체인으로 이동");
  const [verificationStage, setVerificationStage] = useState<'idle' | 'hash-verification' | 'cpabe-decryption' | 'final-decryption'>('idle');

  const handleVerificationStageChange = useCallback((stage: 'idle' | 'hash-verification' | 'cpabe-decryption' | 'final-decryption') => {
    setVerificationStage(stage);
    if (stage === 'idle') {
      // 모든 검증이 완료됨
      setCurrentStep(prev => prev + 1);
      setButtonLabel("완료됨");
    }
  }, []);

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
      setButtonLabel("IPFS 다운로드");
    } else if (currentStep === 3) {
      // 4단계: IPFS 다운로드 시작
      console.log('Starting IPFS download');
      setIsDownloading(true);
      setIpfsFileInfo({
        cid: "QmX8n7dK3oHNAqYxgkrBq21v7rbYthWQpvhA5KWbVHPEGK",
        name: "fw_update_v2.5.0",
        size: 10240306
      });
      setButtonLabel("다운로드 중...");
    } else if (currentStep === 4) {
      // 5단계: 해시 검증 시작
      console.log('Starting hash verification');
      setVerificationStage('hash-verification');
      setButtonLabel("해시 검증 중...");
      // 2초 후 다음 단계로
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setButtonLabel("CP-ABE 복호화 시작");
      }, 2000);
    } else if (currentStep === 5) {
      // 6단계: CP-ABE 복호화
      console.log('Starting CP-ABE decryption');
      setVerificationStage('cpabe-decryption');
      setButtonLabel("CP-ABE 복호화 중...");
      // 2초 후 다음 단계로
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setButtonLabel("최종 복호화 시작");
      }, 2000);
    } else if (currentStep === 6) {
      // 7단계: 최종 복호화
      console.log('Starting final decryption');
      setVerificationStage('final-decryption');
      setButtonLabel("최종 복호화 중...");
      // 8초 후 완료 (기존 2초 → 8초)
      setTimeout(() => {
        setVerificationStage('idle');
        setCurrentStep(prev => prev + 1);
        setButtonLabel("완료됨");
      }, 8000);
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
    setIsDownloading(false);
    setIpfsFileInfo(undefined);
    setCurrentStep(0);
    setButtonLabel("블록체인으로 이동");
    setVerificationStage('idle');
    setHidePanels(false);
    setCarDriveStage('idle');
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    setShowAnimation(false);
  }, [handleReset, setShowAnimation]);

  const handleDone = useCallback(() => {
    setHidePanels(true);
    setTimeout(() => {
      setCarDriveStage('back');
      setTimeout(() => {
        setCarDriveStage('forward');
      }, 600); // 살짝 뒤로 0.6초
    }, 400); // 패널 사라진 후 0.4초 뒤 시작
  }, []);

  return (
    <div className="update-animation">
      <div className="scene-container">
        <Scene 
          isAnimating={isAnimating} 
          showCarView={showCarView}
          showBlockchainInfo={showBlockchainInfo && !hidePanels}
          onReturnToInitial={handleReturnToInitial}
          isDownloading={isDownloading}
          ipfsFileInfo={hidePanels ? undefined : ipfsFileInfo}
          verificationStage={verificationStage}
          onVerificationStageChange={handleVerificationStageChange}
          carDriveStage={carDriveStage}
          onCarDriveStageChange={setCarDriveStage}
          onDownloadComplete={() => {
            setIsDownloading(false);
            setCurrentStep(prev => prev + 1);
            setButtonLabel("해시 검증 시작");
          }}
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
          onClick={currentStep >= 7 ? handleDone : handleStartAnimation}
          disabled={isDownloading}
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