#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const SRC_DIR = 'src';
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /\.d\.ts$/,
  /middleware\.ts$/,
  /layout\.tsx$/,
  /page\.tsx$/,
  /not-found\.tsx$/,
  /loading\.tsx$/,
  /error\.tsx$/,
  /global-error\.tsx$/
];

// 获取所有TypeScript/JavaScript文件
function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== 'node_modules' && item !== '.next') {
      getAllFiles(fullPath, files);
    } else if (EXTENSIONS.includes(path.extname(item))) {
      files.push(fullPath);
    }
  }

  return files;
}

// 检查文件是否被引用
function isFileReferenced(filePath, allFiles) {
  const relativePath = path.relative('src', filePath);
  const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));

  // 排除特殊文件
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
    return true; // 认为是被使用的
  }

  // 生成可能的导入模式
  const importPatterns = [
    relativePath.replace(/\\/g, '/'),
    relativePath.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, ''),
    `./${relativePath.replace(/\\/g, '/')}`,
    `./${relativePath.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '')}`,
    `@/${relativePath.replace(/\\/g, '/')}`,
    `@/${relativePath.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '')}`,
    fileNameWithoutExt
  ];

  // 在所有文件中搜索引用
  for (const searchFile of allFiles) {
    if (searchFile === filePath) continue;

    try {
      const content = fs.readFileSync(searchFile, 'utf8');

      // 检查import语句
      for (const pattern of importPatterns) {
        const importRegex = new RegExp(`(import.*from\\s+['"\`]${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]|import\\s+['"\`]${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`])`, 'g');
        if (importRegex.test(content)) {
          return true;
        }
      }

      // 检查dynamic import
      for (const pattern of importPatterns) {
        const dynamicImportRegex = new RegExp(`import\\s*\\(\\s*['"\`]${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`, 'g');
        if (dynamicImportRegex.test(content)) {
          return true;
        }
      }

      // 检查require语句
      for (const pattern of importPatterns) {
        const requireRegex = new RegExp(`require\\s*\\(\\s*['"\`]${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`, 'g');
        if (requireRegex.test(content)) {
          return true;
        }
      }

    } catch (error) {
      // 忽略读取错误
    }
  }

  return false;
}

// 主函数
function findUnusedFiles() {
  console.log('🔍 扫描未使用的文件...\n');

  const allFiles = getAllFiles(SRC_DIR);
  const unusedFiles = [];
  const usedFiles = [];

  console.log(`📊 总共找到 ${allFiles.length} 个文件\n`);

  for (const file of allFiles) {
    const isUsed = isFileReferenced(file, allFiles);

    if (isUsed) {
      usedFiles.push(file);
    } else {
      unusedFiles.push(file);
    }

    console.log(`${isUsed ? '✅' : '❌'} ${file}`);
  }

  console.log('\n📋 扫描结果:');
  console.log(`✅ 被使用的文件: ${usedFiles.length}`);
  console.log(`❌ 未被使用的文件: ${unusedFiles.length}\n`);

  if (unusedFiles.length > 0) {
    console.log('🚨 疑似未使用的文件列表:');
    unusedFiles.forEach(file => {
      const size = fs.statSync(file).size;
      console.log(`   ${file} (${(size / 1024).toFixed(1)}KB)`);
    });

    console.log('\n⚠️  注意: 这些文件可能是:');
    console.log('   - 真正的未使用文件 (可以删除)');
    console.log('   - 动态导入的文件 (需要手动检查)');
    console.log('   - 配置文件或特殊用途文件');
    console.log('   - 检测逻辑遗漏的文件');
    console.log('\n   请手动验证后再删除!');
  } else {
    console.log('🎉 没有发现未使用的文件!');
  }

  return unusedFiles;
}

// 运行扫描
if (require.main === module) {
  try {
    const unusedFiles = findUnusedFiles();

    // 输出到文件
    if (unusedFiles.length > 0) {
      const reportPath = 'unused-files-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalFiles: getAllFiles(SRC_DIR).length,
        unusedFiles: unusedFiles.map(file => ({
          path: file,
          size: fs.statSync(file).size
        }))
      }, null, 2));

      console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    }

  } catch (error) {
    console.error('❌ 扫描失败:', error.message);
    process.exit(1);
  }
}

module.exports = { findUnusedFiles };
