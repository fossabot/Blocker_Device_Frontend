import axios from 'axios';
import { DeviceInfo, Update, UpdateHistory } from '../types/device';

const api = axios.create({
  baseURL: '/api/device',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const deviceApi = {
  async getDeviceInfo(): Promise<DeviceInfo> {
    const { data } = await api.get('/info');
    return {
      id: data.id,
      model: data.model,
      serialNumber: data.serial,
      version: data.version,
      status: 'normal',
      lastUpdate: data.lastUpdate, // timestamp
      lastUpdateUid: data.uid,
      lastUpdateDescription: data.description
    };
  },

  async checkConnection(): Promise<boolean> {
    const { data } = await api.get('/connection');
    return data.connected;
  },

  async getAvailableUpdates(): Promise<Update[]> {
    const { data } = await api.get('/updates');
    return data.updates.map((update: any) => ({
      uid: update.uid,
      version: update.version,
      description: update.description,
      price: parseFloat(update.price),
      status: update.status || 'available',
      date: update.date ? new Date(update.date * 1000).toISOString() : undefined
    }));
  },

  async getUpdateHistory(): Promise<UpdateHistory[]> {
    try {
      const { data } = await api.get('/history');
      // 실제 데이터가 있으면 해당 데이터 반환
      if (data && Array.isArray(data.history) && data.history.length > 0) {
        return data.history;
      }
      // 데이터가 없는 경우 빈 배열 반환
      return [];
    } catch (error) {
      // API 호출 실패 시 빈 배열 반환
      console.warn('Failed to fetch update history:', error);
      return [];
    }
  },

  async installUpdate(uid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data } = await api.post('/updates/install', { uid });
      return {
        success: data.success,
        message: data.message || data.error
      };
    } catch (error: any) {
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || error.response.data.error || '설치 중 알 수 없는 오류'
        };
      }
      return {
        success: false,
        message: '네트워크 오류 또는 서버에 접근할 수 없습니다'
      };
    }
  },

  async purchaseUpdate(uid: string, price: number): Promise<{ success: boolean; message?: string }> {
    try {
      const { data } = await api.post('/updates/purchase', { 
        uid, 
        price: price.toString()
      });
      return {
        success: data.success,
        message: data.message || data.error
      };
    } catch (error: any) {
      // 백엔드에서 에러 메시지를 응답한 경우 우선 반환
      const backendError = error.response?.data?.error || error.response?.data?.message;
      if (backendError) {
        return {
          success: false,
          message: backendError
        };
      }
      // 네트워크 오류나 기타 오류
      return {
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      };
    }
  }
};