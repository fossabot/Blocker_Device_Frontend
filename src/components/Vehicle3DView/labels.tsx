import React from 'react';
import { VehicleStatus } from '../../types/device';

interface VehicleLabelsProps {
  status: VehicleStatus;
}

const VehicleLabels: React.FC<VehicleLabelsProps> = ({ status }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Door status */}
      <div className="absolute left-1/3 top-1/2 transform -translate-y-1/2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status.doorOpen ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {status.doorOpen ? '도어 열림' : '도어 닫힘'}
        </span>
      </div>

      {/* Trunk status */}
      <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status.trunkOpen ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {status.trunkOpen ? '트렁크 열림' : '트렁크 닫힘'}
        </span>
      </div>

      {/* Engine status */}
      <div className="absolute left-1/4 top-1/3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status.engineOn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {status.engineOn ? '엔진 ON' : '엔진 OFF'}
        </span>
      </div>
    </div>
  );
};

export default VehicleLabels;