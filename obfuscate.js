const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const config = require("./obfuscate.config.js");

// 민감한 코드가 포함된 파일 경로
const filePath = path.join(__dirname, "app", "actions", "polygonWallets.ts");

// 파일 읽기
let fileContent = fs.readFileSync(filePath, "utf8");

// 파일 백업 (배포 후 로컬에서 원본 복원을 위해)
const backupPath = path.join(
    __dirname,
    "app",
    "actions",
    "polygonWallets.backup.ts"
);
if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, fileContent, "utf8");
    console.log(`Original file backed up to ${backupPath}`);
}

// 민감한 함수 식별
const encryptPrivateKeyRegex =
    /function encryptPrivateKey\(privateKey: string\): KeyParts \{[\s\S]*?\}/;
const getPrivateKeyRegex =
    /export async function getPrivateKey\(address: string\) \{[\s\S]*?\}/;

// 민감한 함수 추출
const encryptPrivateKeyMatch = fileContent.match(encryptPrivateKeyRegex);
const getPrivateKeyMatch = fileContent.match(getPrivateKeyRegex);

if (encryptPrivateKeyMatch) {
    const encryptPrivateKeyFunc = encryptPrivateKeyMatch[0];
    // 함수 난독화
    const obfuscatedEncryptFunc = JavaScriptObfuscator.obfuscate(
        encryptPrivateKeyFunc,
        config
    ).getObfuscatedCode();

    // 난독화된 함수로 대체
    fileContent = fileContent.replace(
        encryptPrivateKeyRegex,
        `// This function has been obfuscated for security
function encryptPrivateKey(privateKey: string): KeyParts {
  // @ts-ignore
  ${obfuscatedEncryptFunc.replace(
      /function encryptPrivateKey/,
      "return eval(function"
  )} ();
}`
    );
}

if (getPrivateKeyMatch) {
    const getPrivateKeyFunc = getPrivateKeyMatch[0];
    // 함수 난독화
    const obfuscatedGetPrivateKeyFunc = JavaScriptObfuscator.obfuscate(
        getPrivateKeyFunc,
        config
    ).getObfuscatedCode();

    // 난독화된 함수로 대체
    fileContent = fileContent.replace(
        getPrivateKeyRegex,
        `// This function has been obfuscated for security
export async function getPrivateKey(address: string) {
  // @ts-ignore
  ${obfuscatedGetPrivateKeyFunc.replace(
      /export async function getPrivateKey/,
      "return eval(async function"
  )} ();
}`
    );
}

// 원본 파일을 난독화된 버전으로 직접 덮어쓰기
fs.writeFileSync(filePath, fileContent, "utf8");

console.log(`File has been obfuscated directly: ${filePath}`);

// 복원 스크립트 생성
const restoreScript = `
const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, 'app', 'actions', 'polygonWallets.backup.ts');
const currentPath = path.join(__dirname, 'app', 'actions', 'polygonWallets.ts');

if (fs.existsSync(originalPath)) {
  const originalContent = fs.readFileSync(originalPath, 'utf8');
  fs.writeFileSync(currentPath, originalContent, 'utf8');
  console.log('Original file has been restored');
} else {
  console.log('Backup file not found');
}
`;

fs.writeFileSync("restore-original.js", restoreScript, "utf8");
console.log("Restore script created: restore-original.js");
