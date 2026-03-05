import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = Constants.expoConfig?.extra?.sentryDsn || process.env.SENTRY_DSN || '';

export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    debug: __DEV__,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
    release: `com.karekontrol.app@${Constants.expoConfig?.version ?? '1.0.0'}`,
  });
}

export { Sentry };
