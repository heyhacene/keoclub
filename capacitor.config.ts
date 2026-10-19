import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.otsmane.keoclub',
  appName: 'KeoClub',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'keoclub.app',
    cleartext: true,
  },
};

export default config;
