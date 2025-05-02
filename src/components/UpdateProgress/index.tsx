import React from 'react';
import { Update } from '../../types/device';
import { deviceApi } from '../../services/deviceApi';

interface UpdateProgressProps {
  updates: Update[];
}

const UpdateProgress: React.FC<UpdateProgressProps> = ({ updates }) => {
  const [installing, setInstalling] = React.useState<string | null>(null);

  const handleInstall = async (uid: string) => {
    try {
      setInstalling(uid);
      const result = await deviceApi.installUpdate(uid);
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('업데이트 설치 실패:', error);
    } finally {
      setInstalling(null);
    }
  };

  return (
    <div className="card bg-[#fafafa] rounded-md shadow-sm p-6 w-[400px] min-h-[200px]">
      <div className="card-title text-lg font-semibold text-[#2e2e2e] mb-4">
        Available Updates
      </div>
      <div className="updates-list">
        {updates.map(update => (
          <div key={update.uid} className="update-row flex items-center justify-between mb-2">
            <span>{`Handle_update_${update.uid.substring(0, 5)}`}</span>
            <span>v{update.version}</span>
            <span>{update.price} ETH</span>
            <button 
              className={`update-btn ${
                update.status === 'installing' ? 'installing' : 'install'
              } bg-[#262626] text-white rounded-[20px] px-[18px] py-1 text-sm font-medium`}
              onClick={() => handleInstall(update.uid)}
              disabled={installing === update.uid}
            >
              {update.status === 'installing' || installing === update.uid ? '설치 중' : '설치'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpdateProgress;