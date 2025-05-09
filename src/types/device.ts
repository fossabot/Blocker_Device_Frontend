export interface DeviceInfo {
  id: string;
  model: string;
  serialNumber: string;
  version: string;
  status: 'normal' | 'error' | 'updating';
  lastUpdate?: string;
}

export interface VehicleStatus {
  trunkOpen: boolean;
  doorOpen: boolean;
  engineOn: boolean;
  batteryLevel?: number;
}

export interface Update {
  uid: string;
  version: string;
  description?: string;
  price?: number;
  status: 'available' | 'installing' | 'completed';
  progress?: number;
  date?: string;
}

export interface UpdateHistory {
  uid: string;
  version: string;
  description: string;
  price_wei: string;
  price_eth: number;
  isPurchased: boolean | 'refunded';
  isInstalled: boolean;
  installedAt?: number;
  purchasedAt?: number;
  tx_hash?: string;
}

export interface UpdateProgress {
  uid: string;
  progress: number;
}

export interface WebSocketNotification {
  type: 'new_update' | 'vehicle_status' | 'update_progress' | 'connection_status';
  data: VehicleStatus | UpdateProgress | Update | { connected: boolean };
}