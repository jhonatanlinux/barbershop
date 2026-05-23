import appConfig from "../../app.json";

const envVersion = process.env.EXPO_PUBLIC_APP_VERSION;
const envBuild = process.env.EXPO_PUBLIC_BUILD_NUMBER;

export const APP_VERSION = envVersion || appConfig.expo.version || "1.1.0";
export const APP_BUILD_NUMBER =
  envBuild || String(appConfig.expo.android?.versionCode || "");

export const APP_VERSION_LABEL = `APP ${APP_VERSION.replace(/\.0$/, "")}`;
export const DEVELOPER_HANDLE = "@fox.solucoes.art";
export const DEVELOPER_URL = "https://www.instagram.com/fox.solucoes.art/";
