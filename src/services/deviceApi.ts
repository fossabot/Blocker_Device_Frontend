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
      lastUpdate: data.lastUpdate
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
      date: update.date ? new Date(update.date).toISOString() : undefined
    }));
  },

  async getUpdateHistory(): Promise<UpdateHistory[]> {
    const { data } = await api.get('/history');
    return data.history.map((item: any) => ({
      uid: item.uid,
      version: item.version,
      description: item.description,
      timestamp: item.timestamp,
      tx_hash: item.tx_hash
    }));
  },

  async installUpdate(uid: string): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post('/updates/install', { uid });
    return {
      success: data.success,
      message: data.message || data.error
    };
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
      // 일반적인 구매 실패 에러 처리
      if (error.response?.status === 500) {
        return {
          success: false,
          message: '업데이트 구매 중 오류가 발생했습니다.'
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