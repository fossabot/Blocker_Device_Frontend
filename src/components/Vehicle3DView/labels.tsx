import React from 'react';
import { VehicleStatus } from '../../types/device';
import { BounceLoader } from 'react-spinners';

interface VehicleLabelsProps {
  status: VehicleStatus;
}

const VehicleLabels: React.FC<VehicleLabelsProps> = ({ status }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Door position */}
      <div className="absolute left-[12%] top-[16%]">
        <BounceLoader 
          size={20} 
          color={status.doorOpen ? '#EF4444' : '#25cb55'} 
          speedMultiplier={0.6}
        />
      </div>

      {/* Trunk position
      <div className="absolute left-[95%] top-[45%]">
        <BounceLoader 
          size={30} 
          color={status.trunkOpen ? '#25cb55' : '#6B7280'} 
          speedMultiplier={0.6}
        />
      </div> */}

      {/* Engine position */}
      <div className="absolute left-[55%] bottom-[96%]">
        <BounceLoader 
          size={20} 
          color={status.engineOn ? '#25cb55' : '#6B7280'} 
          speedMultiplier={0.6}
        />
      </div>
    </div>
  );
};

export default VehicleLabels;