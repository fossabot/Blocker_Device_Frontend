import React, { useRef, useState, useEffect } from 'react';
import { deviceApi } from '../../services/deviceApi';

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
  const [isUserRegistration, setIsUserRegistration] = useState(false);
  const [userName, setUserName] = useState('');
  const [recordingCountdown, setRecordingCountdown] = useState(0);
  const [isInputShaking, setIsInputShaking] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 타이핑 효과 (에러 메시지는 제외) - 임시로 비활성화
  useEffect(() => {
    console.log('타이핑 효과 useEffect 실행:', { transcribedText, isProcessing, isUserRegistration, isRegistrationSuccess });
    
    if (transcribedText && !isProcessing) {
      // 에러 메시지인 경우 타이핑 효과 없이 바로 표시
      if (transcribedText.includes('오류가 발생했습니다')) {
        console.log('에러 메시지 감지, 바로 표시');
        setDisplayText(transcribedText);
        return;
      }
      
      // 사용자 등록 성공 메시지인 경우도 바로 표시
      if (transcribedText.includes('환영합니다')) {
        console.log('등록 성공 메시지 감지, 바로 표시:', JSON.stringify(transcribedText));
        setDisplayText(transcribedText);
        return;
      }
      
      console.log('텍스트 바로 표시 (타이핑 효과 비활성화):', JSON.stringify(transcribedText));
      setDisplayText(transcribedText);
      
      // 원래 타이핑 효과 코드 (임시 주석)
      /*
      console.log('타이핑 효과 시작, 원본 텍스트:', JSON.stringify(transcribedText));
      
      // 정상적인 음성 인식 결과는 타이핑 효과 적용
      setDisplayText('');
      let index = 0;
      const timer = setInterval(() => {
        if (index < transcribedText.length) {
          setDisplayText(prev => {
            const newText = prev + transcribedText[index];
            console.log(`타이핑 진행: ${index}/${transcribedText.length} - "${newText}"`);
            return newText;
          });
          index++;
        } else {
          console.log('타이핑 완료');
          clearInterval(timer);
        }
      }, 50);
      return () => clearInterval(timer);
      */
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
    
    setIsProcessing(true);
    setTranscribedText('');
    setDisplayText('');
    setDetectedLang('');
    
    try {
      const result = await deviceApi.speechToText(blob);
      
      if (result.success) {
        // 백엔드 응답 데이터 로깅
        console.log('백엔드 응답 전체:', result);
        console.log('transcribed_text 타입:', typeof result.transcribed_text);
        console.log('transcribed_text 길이:', result.transcribed_text?.length);
        console.log('transcribed_text 원본:', JSON.stringify(result.transcribed_text));
        console.log('detected_lang:', result.detected_lang);
        console.log('is_match:', result.is_match);
        console.log('predicted_speaker:', result.predicted_speaker);
        
        // 값 설정 전 한번 더 확인
        const rawText = result.transcribed_text;
        const cleanedText = (typeof rawText === 'string' ? rawText.trim() : '') || '';
        console.log('정제된 텍스트:', JSON.stringify(cleanedText));
        
        // 안전한 언어 정보 처리
        const safeLang = result.detected_lang && typeof result.detected_lang === 'string' ? result.detected_lang.trim() : '';
        
        // 화자 인식 정보 추가
        let displayMessage = cleanedText;
        if (result.is_match && result.predicted_speaker) {
          displayMessage = `[${result.predicted_speaker}님] ${cleanedText}`;
        } else if (result.predicted_speaker) {
          displayMessage = `[미등록 화자] ${cleanedText}`;
        }
        
        setTranscribedText(displayMessage);
        setDetectedLang(safeLang);
      } else {
        console.error('음성 처리 실패:', result.error);
        setTranscribedText('음성 처리 중 오류가 발생했습니다.');
      }
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

  // 사용자 등록 모드 토글
  const toggleUserRegistration = () => {
    setIsUserRegistration(!isUserRegistration);
    // 모드 변경 시 상태 초기화
    setTranscribedText('');
    setDisplayText('');
    setDetectedLang('');
    setIsProcessing(false);
    setRecordingCountdown(0);
    setIsInputShaking(false);
    setIsRegistrationSuccess(false);
    if (isRecording) {
      stopRecording();
    }
  };

  // 5초 카운트다운과 함께 녹음 시작 (사용자 등록용)
  const startUserRegistrationRecording = async () => {
    if (!userName.trim()) {
      // alert 대신 입력 필드 흔들기
      setIsInputShaking(true);
      setTimeout(() => setIsInputShaking(false), 600);
      return;
    }

    setIsRecording(true);
    setRecordingCountdown(5);
    
    // 카운트다운 타이머
    let countdown = 5;
    countdownTimerRef.current = setInterval(() => {
      countdown--;
      setRecordingCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(countdownTimerRef.current!);
        stopRecording();
      }
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        sendUserRegistrationToBackend();
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
    } catch (err) {
      setIsRecording(false);
      setRecordingCountdown(0);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      alert('마이크 권한이 필요합니다.');
    }
  };

  // 사용자 등록용 음성 데이터 백엔드 전송
  const sendUserRegistrationToBackend = async () => {
    const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const currentUserName = userName.trim(); // 이름을 미리 저장
    
    setIsProcessing(true);
    setTranscribedText('');
    setDisplayText('');
    
    try {
      const result = await deviceApi.registerUserVoice(blob, currentUserName);
      
      if (result.success) {
        setTranscribedText(result.message);
        setUserName(''); // 등록 후 이름 초기화
        setIsRegistrationSuccess(true); // 성공 상태 설정
      } else {
        setTranscribedText(result.message);
      }
    } catch (error) {
      console.error('사용자 등록 실패:', error);
      setTranscribedText(`${currentUserName}님 사용자 등록 중 오류가 발생했습니다.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 버튼 클릭 핸들러
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (isUserRegistration) {
        startUserRegistrationRecording();
      } else {
        startRecording();
      }
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setTranscribedText('');
    setDisplayText('');
    setDetectedLang('');
    setIsProcessing(false);
    setIsUserRegistration(false);
    setUserName('');
    setRecordingCountdown(0);
    setIsInputShaking(false);
    setIsRegistrationSuccess(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
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
          isUserRegistration && isRegistrationSuccess ? 'w-[280px] h-[250px]' :
          isUserRegistration ? 'w-[280px] h-[360px]' :
          (isProcessing || transcribedText) ? 'w-80 h-96' : 'w-64 h-64'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 사용자 등록 버튼 (오른쪽 아래) */}
        <button
          className={`absolute bottom-3 right-3 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
            isUserRegistration 
              ? 'bg-gray-700 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
          }`}
          onClick={toggleUserRegistration}
        >
          {isUserRegistration ? '음성 비서' : '사용자 등록'}
        </button>

        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl"
          onClick={handleClose}
        >
          ×
        </button>
        
        {/* 사용자 등록 모드 */}
        {isUserRegistration ? (
          <div className="flex flex-col items-center gap-4 w-full -mt-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {isRegistrationSuccess ? '등록 완료' : '사용자 등록'}
            </h3>
            
            {/* 등록 성공 전에만 입력 필드와 녹음 버튼 표시 */}
            {!isRegistrationSuccess && (
              <>
                <div className="w-full">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${
                      isInputShaking 
                        ? 'border-red-400 focus:ring-red-500 animate-pulse' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="이름을 입력하세요"
                    disabled={isRecording || isProcessing}
                    style={isInputShaking ? { 
                      animation: 'shake 0.6s ease-in-out'
                    } : {}}
                  />
                </div>

                <div className="flex flex-col items-center gap-4 mt-6">
                  <button
                    className={`w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isRecording ? 'bg-red-400' : 'hover:bg-gray-300'
                    }`}
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

                  {recordingCountdown > 0 && (
                    <div className="text-2xl font-bold text-red-500">
                      {recordingCountdown}
                    </div>
                  )}

                  <div className="text-sm text-center text-gray-600 whitespace-pre-line">
                    {isProcessing ? '등록 처리 중...' :
                     isRecording ? `녹음 중...` :
                     '녹음 버튼을 눌러\n5초 동안 음성을 등록하세요'}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* 기존 음성 비서 모드 */
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
               isRecording ? (isSilent ? '녹음 종료' : '녹음 중...') : 
               '음성 비서'}
            </div>
          </div>
        )}

        {/* 결과 표시 영역 - 음성 전송 후에만 표시 (중앙에 컴팩트하게) */}
        {(isProcessing || transcribedText) && (
          <div className="w-full bg-gray-50 rounded-lg p-4 mt-4 max-h-32 overflow-y-auto">
            {isProcessing && (
              <div className="flex items-center justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}                  {displayText && !isProcessing && (
              <div className="space-y-2">
                {detectedLang && !isUserRegistration && (
                  <div className="text-xs text-gray-500 mb-2">
                    언어: {detectedLang}
                  </div>
                )}
                <div className="text-sm text-gray-800 leading-relaxed text-center whitespace-pre-line">
                  {isUserRegistration && isRegistrationSuccess && (
                    <div className="text-2xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-500 mx-auto">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 22h8" />
                      </svg>
                    </div>
                  )}
                  {/* 화자 정보가 포함된 텍스트 표시 */}
                  {displayText.includes('[') && displayText.includes(']') ? (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-blue-600 mb-1">
                        {displayText.match(/\[(.*?)\]/)?.[1]}
                      </div>
                      <div>{displayText.replace(/\[.*?\]\s*/, '')}</div>
                    </div>
                  ) : (
                    displayText
                  )}
                  {/* 커서 임시 비활성화
                  {!displayText.includes('오류가 발생했습니다') && (
                    <span className="animate-pulse">|</span>
                  )}
                  */}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MicModal;
