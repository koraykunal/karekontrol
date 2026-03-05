import Constants from 'expo-constants';

const getApiBaseUrl = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configUrl) return configUrl;
  if (__DEV__) return 'http://192.168.1.4:8000/api/v1';
  throw new Error('API_BASE_URL must be configured for production builds via EAS secrets');
};

export const ENV = {
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT: Constants.expoConfig?.extra?.apiTimeout || 30000,
  ENABLE_DEVTOOLS: __DEV__ && (Constants.expoConfig?.extra?.enableDevtools ?? false),
  IS_DEV: __DEV__,
  VERSION: Constants.expoConfig?.version || '1.0.0',
};
