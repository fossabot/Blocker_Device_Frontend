import axios from 'axios';
import { DeviceInfo, Update, UpdateHistory } from '../types/device';

const API_BASE_URL = '/api/device';

export const deviceApi = {
    getInfo: () => 
        axios.get<DeviceInfo>(`${API_BASE_URL}/info`),
    
    checkConnection: () =>
        axios.get<{ connected: boolean }>(`${API_BASE_URL}/connection`),
    
    getUpdates: () =>
        axios.get<{ updates: Update[] }>(`${API_BASE_URL}/updates`),
    
    purchaseUpdate: (uid: string, price: number) =>
        axios.post<{ success: boolean; tx_hash?: string }>(`${API_BASE_URL}/updates/purchase`, { uid, price }),
    
    installUpdate: (uid: string) =>
        axios.post<{ success: boolean }>(`${API_BASE_URL}/updates/install`, { uid }),
    
    getHistory: () =>
        axios.get<{ history: UpdateHistory[] }>(`${API_BASE_URL}/history`)
};