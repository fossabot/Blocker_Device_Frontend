export const formatDate = (dateInput: string | number): string => {
  let date: Date;
  if (typeof dateInput === 'number') {
    // 10자리면 초 단위로 간주
    date = dateInput < 1e12 ? new Date(dateInput * 1000) : new Date(dateInput);
  } else {
    date = new Date(dateInput);
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const toWei = (eth: number): string => {
  return (eth * 1e18).toString();
};

export const fromWei = (wei: string): number => {
  return parseFloat(wei) / 1e18;
};

export const formatEther = (value: string): string => {
  const eth = fromWei(value);
  return eth.toFixed(2);
};

export const truncateHash = (hash: string, length: number = 8): string => {
  if (!hash) return '';
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
};