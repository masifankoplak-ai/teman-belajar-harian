import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "id.temanbelajarku.app",
  appName: "Teman Belajarku",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      small: "ic_launcher",
    },
  },
};

export default config;
