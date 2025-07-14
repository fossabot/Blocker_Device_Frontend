import React, { useRef, useState, useEffect } from 'react';

interface MicModalProps {
  open: boolean;
  onClose: () => void;
}

const MicModal: React.FC<MicModalProps> = ({ open, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [displayText, setDisplayText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // 타이핑 효과
  useEffect(() => {
    if (transcribedText && !isProcessing) {
      setDisplayText('');
      let index = 0;
      const timer = setInterval(() => {
        if (index < transcribedText.length) {
          setDisplayText(prev => prev + transcribedText[index]);
          index++;
        } else {
          clearInterval(timer);
        }
      }, 50);
      return () => clearInterval(timer);
    }
  }, [transcribedText, isProcessing]);

  // 음성 녹음 시작
  const startRecording = async () => {
    setIsSilent(false);
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        sendAudioToBackend();
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      detectSilence(stream);
    } catch (err) {
      setIsRecording(false);
      alert('마이크 권한이 필요합니다.');
    }
  };

  // 음성 녹음 중지
  const stopRecording = () => {
    setIsRecording(false);
    setIsSilent(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
  };

//   // 로컬에 음성 파일 저장
//   const saveAudioLocally = (blob: Blob) => {
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.style.display = 'none';
//     a.href = url;
//     a.download = `voice_recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

  // 음성 데이터 백엔드로 전송
  const sendAudioToBackend = async () => {
    const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
    
    // 로컬에 음성 파일 저장 (디버깅용)
    // saveAudioLocally(blob);
    // console.log('음성 파일이 다운로드 폴더에 저장되었습니다:', blob.size, 'bytes');
    
    setIsProcessing(true);
    setTranscribedText('');
    setDisplayText('');
    setDetectedLang('');
    
    try {
      const response = await uploadVoice(blob);
      const data = await response.json();
      setTranscribedText(data.transcribed_text || '');
      setDetectedLang(data.detected_lang || '');
    } catch (error) {
      console.error('음성 처리 실패:', error);
      setTranscribedText('음성 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 무음 감지 (2초 후 멈춤)
  const detectSilence = (stream: MediaStream) => {
    const audioCtx = new window.AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 2048;
    const data = new Uint8Array(analyser.fftSize);
    let silentCount = 0;
    let stopped = false;
    let silenceTimer: NodeJS.Timeout | null = null;
    const check = () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        stopped = true;
        audioCtx.close();
        if (silenceTimer) clearTimeout(silenceTimer);
        return;
      }
      analyser.getByteTimeDomainData(data);
      const max = Math.max(...data);
      const min = Math.min(...data);
      const volume = max - min;
      if (volume < 8) {
        silentCount++;
        if (silentCount > 60 && !silenceTimer) { // 약 2초(30fps 기준)
          setIsSilent(true);
          silenceTimer = setTimeout(() => {
            stopRecording();
            stopped = true;
            audioCtx.close();
          }, 2000);
        }
      } else {
        silentCount = 0;
        setIsSilent(false);
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
      }
      if (!stopped) requestAnimationFrame(check);
    };
    check();
  };

  // 버튼 클릭 핸들러
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setTranscribedText('');
    setDisplayText('');
    setDetectedLang('');
    setIsProcessing(false);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      stopRecording();
    }
    // eslint-disable-next-line
  }, [open]);

  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20"
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center relative animate-fadeIn p-6 transition-all duration-300 ${
          (isProcessing || transcribedText) ? 'w-80 h-96' : 'w-64 h-64'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl"
          onClick={handleClose}
        >
          ×
        </button>
        
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="relative">
            <button
              className={`w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${isRecording ? 'bg-red-400' : 'hover:bg-gray-300'}`}
              onClick={handleMicClick}
              disabled={isProcessing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 22h8" />
              </svg>
            </button>
            
            {/* 녹음 중 애니메이션 */}
            {isRecording && (
              <div className="absolute -inset-2 rounded-full border-2 border-red-500 animate-ping"></div>
            )}
          </div>
          
          <div className="text-lg font-semibold text-gray-700 text-center">
            {isProcessing ? '음성 처리 중...' : 
             isRecording ? (isSilent ? '무음 감지, 녹음 종료' : '녹음 중...') : 
             '음성 인식 준비'}
          </div>
        </div>

        {/* 결과 표시 영역 - 음성 전송 후에만 표시 */}
        {(isProcessing || transcribedText) && (
          <div className="flex-1 w-full bg-gray-50 rounded-lg p-4 overflow-y-auto">
            {isProcessing && (
              <div className="flex items-center justify-center h-full">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
            
            {displayText && !isProcessing && (
              <div className="space-y-2">
                {detectedLang && (
                  <div className="text-xs text-gray-500 mb-2">
                    언어: {detectedLang}
                  </div>
                )}
                <div className="text-sm text-gray-800 leading-relaxed">
                  {displayText}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 백엔드로 음성 파일 전송 API
export async function uploadVoice(blob: Blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'voice.webm');
  return fetch('/api/device/voice/stt', {
    method: 'POST',
    body: formData,
  });
}

export default MicModal;
