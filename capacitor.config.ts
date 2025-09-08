import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.225265a95487462f97a0f7afb5f22eff',
  appName: 'omni-traveler-brain',
  webDir: 'dist',
  server: {
    url: 'https://225265a9-5487-462f-97a0-f7afb5f22eff.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#f97316",
      showSpinner: false
    },
    StatusBar: {
      style: 'default'
    }
  }
};

export default config;