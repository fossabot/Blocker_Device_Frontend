import React from 'react';
import { DeviceInfo as IDeviceInfo } from '../../types/device';
import { formatDateHome } from '../../utils/formatter';

interface DeviceInfoProps {
  info: IDeviceInfo | null;
}

const DeviceInfo: React.FC<DeviceInfoProps> = ({ info }) => {
  console.log('DeviceInfo info:', info);
  if (!info) {
    return (
      <div className="card flex flex-col bg-[#fafafa]/80 rounded-md shadow-sm p-6 w-[400px] min-h-[200px] animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="card-content space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col bg-[#fafafa]/80 rounded-md shadow-sm p-6">
      <div className="card-title text-xl font-semibold text-[#2e2e2e] mb-4">
        Device Information
      </div>
      <div className="card-content overflow-y-auto max-h-[300px]">
        <div className="device-info-list">
          <div className="device-info-row">
            <span className="device-info-label text-[#2e2e2e] font-medium">Device ID</span>
            <span className="device-info-value text-[#2e2e2e] text-right">{info.id}</span>
          </div>
          <div className="device-info-row">
            <span className="device-info-label text-[#2e2e2e] font-medium">Model</span>
            <span className="device-info-value text-[#2e2e2e] text-right">{info.model}</span>
          </div>
          <div className="device-info-row">
            <span className="device-info-label text-[#2e2e2e] font-medium">Serial Number</span>
            <span className="device-info-value text-[#2e2e2e] text-right">{info.serialNumber}</span>
          </div>
          <div className="device-info-row">
            <span className="device-info-label text-[#2e2e2e] font-medium">Software Version</span>
            <span className="device-info-value text-[#2e2e2e] text-right">{info.version}</span>
          </div>
          <div className="device-info-row">
            <span className="device-info-label text-[#2e2e2e] font-medium">Software Status</span>
            <span className="device-info-value text-[#2e2e2e] text-right">
              <span className="status-normal text-[#25cb55] font-semibold">
                {info.status === 'normal' ? 'Normal' : info.status === 'error' ? 'Error' : 'Updating'}
              </span>
            </span>
          </div>
          <div className="device-info-row">
            <span className="device-info-label text-[#2e2e2e] font-medium">Final Update</span>
            <span className="device-info-value text-[#2e2e2e] text-right final-update font-medium">
              {info.lastUpdate ? formatDateHome(info.lastUpdate) : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceInfo;