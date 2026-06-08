import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.licznik.kalorii.app',
  appName: 'Licznik Kalorii',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
