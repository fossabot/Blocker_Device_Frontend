import { atom } from 'recoil';
import { DeviceInfo, Update } from '../types/device';

export const deviceInfoState = atom<DeviceInfo | null>({
  key: 'deviceInfoState',
  default: null,
});

export const updatesState = atom<Update[]>({
  key: 'updatesState',
  default: [],
});

export const connectionState = atom<boolean>({
  key: 'connectionState',
  default: false,
});