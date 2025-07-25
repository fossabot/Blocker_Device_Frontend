import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '../../hooks/WebSocketContext';
import { VehicleStatus } from '../../types/device';
import { CubeIcon, BellIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import VehicleLabels from './labels';
import { DeviceInfo } from '../../types/device';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { toastsState, installSuccessTriggerState } from '../../store/atoms';
import { deviceApi } from '../../services/deviceApi';
import MicModal from './MicModal';
import styles from './Vehicle3DView.module.css';

interface UpdateLabelInfo {
  uid?: string;
  version?: string;
  description?: string;
  active: boolean;
  position: 'door' | 'engine';
}

const getUpdateLabelInfo = (deviceInfo: DeviceInfo): UpdateLabelInfo | null => {
  if (!deviceInfo.lastUpdateUid || !deviceInfo.lastUpdateDescription) return null;
  const desc = deviceInfo.lastUpdateDescription.toLowerCase();
  if (desc.includes('stop')) {
    return null;
  }
  if (desc.includes('직진') || desc.includes('straight')) {
    return {
      uid: deviceInfo.lastUpdateUid,
      version: deviceInfo.version,
      description: deviceInfo.lastUpdateDescription,
      active: true,
      position: 'door',
    };
  }
  if (desc.includes('zigzag') || desc.includes('지그재그')) {
    return {
      uid: deviceInfo.lastUpdateUid,
      version: deviceInfo.version,
      description: deviceInfo.lastUpdateDescription,
      active: true,
      position: 'engine',
    };
  }
  return null;
};

interface Vehicle3DViewProps {
  deviceInfo?: DeviceInfo;
  onRefresh?: () => void;
}

const Vehicle3DView: React.FC<Vehicle3DViewProps> = ({ deviceInfo, onRefresh }) => {
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>({
    trunkOpen: false,
    doorOpen: false,
    engineOn: false,
    batteryLevel: 90
  });
  // 설치 완료 시 D를 10초간 초록색으로 표시
  const [installedHighlight, setInstalledHighlight] = useState(false);
  const [micOpen, setMicOpen] = useState(false);

  const { lastNotification, isConnected } = useWebSocketContext();
  const setToasts = useSetRecoilState(toastsState);
  const installSuccessTrigger = useRecoilValue(installSuccessTriggerState);

  useEffect(() => {
    if (lastNotification?.type === 'vehicle_status') {
      setVehicleStatus(prev => ({
        ...prev,
        ...lastNotification.data as VehicleStatus
      }));
    }
    // 웹소켓 기반 설치완료 D 하이라이트는 제거 (토스트 기반만 사용)
  }, [lastNotification]);

  useEffect(() => {
    if (installSuccessTrigger > 0) {
      setInstalledHighlight(true);
      const timer = setTimeout(() => setInstalledHighlight(false), 13000);
      return () => clearTimeout(timer);
    }
  }, [installSuccessTrigger]);

  // 업데이트 정보 파싱
  const updateLabelInfo = deviceInfo ? getUpdateLabelInfo(deviceInfo) : null;

  const handleAlarmClick = async () => {
    try {
      // 1. 목록 새로고침 (최신 업데이트 목록 fetch)
      const updates = await deviceApi.getAvailableUpdates();
      if (!updates || updates.length === 0) return;
      // 2. 제일 위(최신) 업데이트로 알림
      const latest = updates[0];
      if (!latest?.uid) return;
      const toastId = `update-${latest.uid}`;
      setToasts(prev => {
        if (prev.some(t => t.id === toastId)) return prev;
        return [
          ...prev,
          {
            id: toastId,
            type: 'new',
            title: 'New Update',
            message: `새로운 업데이트 ${latest.uid}가 있습니다.`,
            progress: 0,
            showProgress: false,
            icon: 'bell'
          }
        ];
      });
      // 목록 새로고침 트리거
      onRefresh?.();
    } catch (e) {
      // 필요시 에러 토스트 처리
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'a' 또는 'ㅁ' 키만 눌러도 알람 실행
      const key = e.key.toLowerCase();
      const isAKey = key === 'a';
      const isMKey = key === 'ㅁ';
      if ((isAKey || isMKey) && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        console.log('Alarm clicked via keyboard');
        e.preventDefault();
        handleAlarmClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAlarmClick]);

  return (
    <div className={styles.mainContent}>
      <div className={styles.statusBar}>
        <div className={styles.statusRow}>
          <div className={styles.gear}>
            <span className={installedHighlight ? 'text-black' : 'text-red-500'}>P</span>{' '}
            R N{' '}
            <span className={installedHighlight ? 'text-red-500' : 'text-black'}>D</span>
          </div>
          <div className={styles.battery}>
            <div className={styles.batteryBar}>
              <div 
                className={styles.batteryLevel}
                style={{ width: `${(vehicleStatus?.batteryLevel || 0) * 0.75}px` }}
              ></div>
            </div>
            <span className={styles.batteryPercent}>{vehicleStatus?.batteryLevel || 0}%</span>
          </div>
        </div>
        <div className={`${styles.statusRow} ${styles.alarmColumn}`}>
          <div className={`${styles.blockchainStatus} blockchain-status flex items-center gap-3 pl-2 pr-6 py-2 bg-gray-100 rounded-full`}>
            <CubeIcon className={`w-6 h-6 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`blockchain-text font-semibold ${isConnected ? 'text-gray-800' : 'text-gray-800'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className={`${styles.alarm} pl-1 flex gap-4`}>
            <BellIcon className="w-7 h-7 text-gray-400 cursor-pointer" onClick={handleAlarmClick} />
            <MicrophoneIcon className="w-7 h-7 text-gray-400 cursor-pointer" onClick={() => setMicOpen(true)} />
          </div>
        </div>
      </div>
      <MicModal open={micOpen} onClose={() => setMicOpen(false)} />

      <div className={styles.carArea}>
        <img
          src="/automobile.svg"
          alt="Car"
          className={styles.carImage}
        />
        <VehicleLabels 
          updateLabelInfo={updateLabelInfo}
        />
      </div>
    </div>
  );
};

export default Vehicle3DView;