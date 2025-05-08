import { atom } from 'recoil';
import { DeviceInfo, Update } from '../types/device';
import { ToastData } from '../components/shared/ToastContainer';

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

export const showAnimationState = atom<boolean>({
  key: 'showAnimationState',
  default: false,
});

export const toastsState = atom<ToastData[]>({
  key: 'toastsState',
  default: [],
});