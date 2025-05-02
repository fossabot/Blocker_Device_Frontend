import axios from 'axios';
import { DeviceInfo, Update } from '../types/device';

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
      date: update.date ? new Date(update.date).toISOString() : undefined,
      isAuthorized: update.isAuthorized
    }));
  },

  async getUpdateHistory(): Promise<Update[]> {
    const { data } = await api.get('/history');
    return data.history.map((item: any) => ({
      uid: item.uid,
      version: item.version,
      description: item.description,
      date: new Date(item.timestamp * 1000).toISOString(),
      status: 'completed'
    }));
  },

  async installUpdate(uid: string): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post('/updates/install', { uid });
    return {
      success: data.success,
      message: data.message || data.error
    };
  },

  async purchaseUpdate(uid: string, price: number): Promise<{ success: boolean; transaction: string; message: string }> {
    const { data } = await api.post('/updates/purchase', { uid, price });
    return {
      success: data.success,
      transaction: data.transaction,
      message: data.message || data.error
    };
  }
};