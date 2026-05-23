const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const runNumber = Number(process.env.GITHUB_RUN_NUMBER || 0);
const baseVersion = process.env.APP_BASE_VERSION || "1.1";
const buildNumber = runNumber > 0 ? Math.max(runNumber, 2) : 2;
const appVersion = runNumber > 0 ? `${baseVersion}.${runNumber}` : `${baseVersion}.0`;

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(
    path.join(root, file),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8"
  );
}

const appConfig = readJson("app.json");
appConfig.expo.version = appVersion;
appConfig.expo.android = appConfig.expo.android || {};
appConfig.expo.android.versionCode = buildNumber;
writeJson("app.json", appConfig);

const pkg = readJson("package.json");
pkg.version = appVersion;
writeJson("package.json", pkg);

const lockPath = path.join(root, "package-lock.json");
if (fs.existsSync(lockPath)) {
  const lock = readJson("package-lock.json");
  lock.version = appVersion;
  if (lock.packages && lock.packages[""]) {
    lock.packages[""].version = appVersion;
  }
  writeJson("package-lock.json", lock);
}

const eas = readJson("eas.json");
eas.build = eas.build || {};
eas.build.preview = eas.build.preview || {};
eas.build.preview.env = {
  ...(eas.build.preview.env || {}),
  EXPO_PUBLIC_APP_VERSION: appVersion,
  EXPO_PUBLIC_BUILD_NUMBER: String(buildNumber),
};
writeJson("eas.json", eas);

console.log(`Prepared APP ${appVersion} (${buildNumber})`);
