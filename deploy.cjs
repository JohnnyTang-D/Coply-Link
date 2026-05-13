const { existsSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { NodeSSH } = require('node-ssh');
const AdmZip = require('adm-zip');

const zipName = 'deploy.zip';

/**
 * 远程服务器配置
 * @param {'test' | 'prod' | string} [value=''] 服务器环境
 */
function getServerConfig(value) {
  const config = {
    prod: {
      host: 'your-server-ip',
      port: 22,
      user: 'root',
      pwd: 'your-password',
    },
    test: {
      host: 'your-test-server-ip',
      port: 22,
      user: 'root',
      pwd: 'your-password',
    },
  };
  return config[value];
}

/**
 * 远程服务器存放位置
 */
function getRemoteDir() {
  return '/data/coply-link';
}

/**
 * 压缩部署文件
 */
function zipProject() {
  const zipPath = join(__dirname, zipName);
  const zip = new AdmZip();

  // docker-compose.yml 放在根目录
  zip.addLocalFile(join(__dirname, 'docker-compose.yml'));

  // backend 目录
  zip.addLocalFile(join(__dirname, 'backend', 'Dockerfile'), 'backend');
  zip.addLocalFile(join(__dirname, 'backend', 'package.json'), 'backend');
  zip.addLocalFile(join(__dirname, 'backend', 'server.js'), 'backend');

  // frontend 目录
  zip.addLocalFile(join(__dirname, 'frontend', 'Dockerfile'), 'frontend');
  zip.addLocalFile(join(__dirname, 'frontend', 'package.json'), 'frontend');
  zip.addLocalFile(join(__dirname, 'frontend', 'nginx.conf'), 'frontend');
  zip.addLocalFile(join(__dirname, 'frontend', 'index.html'), 'frontend');
  zip.addLocalFile(join(__dirname, 'frontend', 'vite.config.js'), 'frontend');
  zip.addLocalFolder(join(__dirname, 'frontend', 'src'), 'frontend/src');
  zip.addLocalFolder(join(__dirname, 'frontend', 'public'), 'frontend/public');

  zip.writeZip(zipPath);
  console.log(`[1] 已生成 ${zipPath} ✅`);
  return zipPath;
}

/**
 * 连接服务器
 */
async function connectSSH(env) {
  const cfg = getServerConfig(env);
  const ssh = new NodeSSH();
  await ssh.connect({
    host: cfg.host,
    port: cfg.port || 22,
    username: cfg.user.trim(),
    password: cfg.pwd.trim(),
  });
  return ssh;
}

/**
 * 上传到服务器
 */
async function uploadFile(ssh, localPath) {
  const remoteDir = getRemoteDir();
  const remotePath = `${remoteDir}/${zipName}`;

  await ssh.execCommand(`mkdir -p ${remoteDir}`);
  console.log(`[2] 已创建远程目录 ${remoteDir} ✅`);

  await ssh.putFile(localPath, remotePath);
  console.log(`[3] 已完成文件上传 ✅`);
}

/**
 * 远程解压并启动 docker-compose
 */
async function deployOnRemote(ssh) {
  const remoteDir = getRemoteDir();

  const cmd = `
cd ${remoteDir}

# 解压
unzip -o ${zipName}
rm -f ${zipName}

# 停止旧容器并删除旧镜像
docker-compose down --rmi local 2>/dev/null || true

# 构建并启动新容器
docker-compose up -d --build

echo "部署完成"
`;

  const result = await ssh.execCommand(cmd);
  if (result.code !== 0) {
    console.log(result.stderr);
    throw new Error('远程部署失败');
  }
  console.log('[4] 远程 docker-compose 已启动 ✅');
  console.log(result.stdout);
}

/**
 * 清除本地压缩文件
 */
function clearLocalZip() {
  const zipPath = join(__dirname, zipName);
  if (existsSync(zipPath)) {
    rmSync(zipPath, { force: true });
    console.log('[5] 本地 deploy.zip 已删除 ✅');
  }
}

async function deploy(env) {
  try {
    const zipPath = zipProject();
    const ssh = await connectSSH(env);
    await uploadFile(ssh, zipPath);
    await deployOnRemote(ssh);
    ssh.dispose();
    clearLocalZip();
    console.log('[6] 部署完成 ✅');
  } catch (e) {
    console.error('部署失败:', e.message);
    process.exit(1);
  }
}

deploy(process.argv[2] || 'prod');