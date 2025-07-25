import React, { useState } from 'react';
import { BounceLoader } from 'react-spinners';
import styles from './Vehicle3DView.module.css';

interface UpdateLabelInfo {
  uid?: string;
  version?: string;
  description?: string;
  active: boolean;
  position: 'door' | 'engine';
}

interface VehicleLabelsProps {
  updateLabelInfo: UpdateLabelInfo | null;
}

const TooltipBox: React.FC<{ info?: UpdateLabelInfo; active: boolean }> = ({ info, active }) => {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-50 bg-white border border-gray-400 rounded-md shadow-md px-3 py-2 text-xs text-gray-700 pointer-events-auto">
      {active && info ? (
        <>
          <div><b>업데이트 UID:</b> {info.uid}</div>
          <div><b>버전:</b> {info.version}</div>
          <div><b>설명:</b> {info.description}</div>
          <div><b>상태:</b> {info.active ? 'on' : 'off'}</div>
        </>
      ) : (
        <>활성화된 기능이 없습니다</>
      )}
    </div>
  );
};

const VehicleLabels: React.FC<VehicleLabelsProps> = ({ updateLabelInfo }) => {
  const [hovered, setHovered] = useState<'door' | 'engine' | null>(null);

  return (
    <div className={styles.labelContainer}>
      {/* Door position */}
      <div
        className={styles.doorLabel}
        onMouseEnter={() => setHovered('door')}
        onMouseLeave={() => setHovered(null)}
      >
        <BounceLoader
          size={20}
          color={updateLabelInfo?.position === 'door' && updateLabelInfo.active ? '#25cb55' : '#171717'}
          speedMultiplier={0.6}
        />
        {hovered === 'door' && (
          <TooltipBox
            info={updateLabelInfo?.position === 'door' ? updateLabelInfo : undefined}
            active={!!(updateLabelInfo?.position === 'door' && updateLabelInfo.active)}
          />
        )}
      </div>

      {/* Engine position */}
      <div
        className={styles.engineLabel}
        onMouseEnter={() => setHovered('engine')}
        onMouseLeave={() => setHovered(null)}
      >
        <BounceLoader
          size={20}
          color={updateLabelInfo?.position === 'engine' && updateLabelInfo.active ? '#25cb55' : '#171717'}
          speedMultiplier={0.6}
        />
        {hovered === 'engine' && (
          <TooltipBox
            info={updateLabelInfo?.position === 'engine' ? updateLabelInfo : undefined}
            active={!!(updateLabelInfo?.position === 'engine' && updateLabelInfo.active)}
          />
        )}
      </div>
    </div>
  );
};

export default VehicleLabels;