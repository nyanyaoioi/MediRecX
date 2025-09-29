# 🏥 MediRecX - 医疗记录管理系统

基于FHEVM技术的完全加密医疗记录管理dapp，确保患者隐私安全。

## 🌟 项目特色

- **完全加密存储** - 使用FHEVM全同态加密技术
- **精准权限控制** - 患者完全控制医疗数据访问
- **双环境支持** - 支持真实网络和本地Mock开发
- **现代化UI** - 美观的医疗主题界面设计
- **多角色支持** - 患者和医生不同功能界面

## 🏗️ 项目结构

```
zama_medrec_001/
├── fhevm-hardhat-template/     # 智能合约项目
│   ├── contracts/              # FHEVM智能合约
│   ├── deploy/                 # 部署脚本
│   ├── tasks/                  # Hardhat任务
│   └── test/                   # 合约测试
├── medrec-frontend/           # 前端应用
│   ├── app/                   # Next.js应用页面
│   ├── components/            # React组件
│   ├── hooks/                 # 自定义Hooks
│   ├── fhevm/                 # FHEVM集成
│   └── abi/                   # 合约ABI文件
└── frontend/                  # 参考实现（只读）
```

## 🚀 快速开始

### 1. 环境准备

确保已安装：
- Node.js >= 20
- npm >= 7
- MetaMask浏览器插件

### 2. 启动本地开发环境

**终端1 - 启动Hardhat节点:**
```bash
cd fhevm-hardhat-template
npm install
npm run compile
npx hardhat node --verbose
```

**终端2 - 部署合约:**
```bash
cd fhevm-hardhat-template
npx hardhat run deploy/deploy.ts --network localhost
```

**终端3 - 启动前端:**
```bash
cd medrec-frontend
npm install
npm run dev:mock
```

### 3. 访问应用

打开浏览器访问: `http://localhost:3000`

## 💻 使用说明

### Mock模式开发
- 自动检测本地Hardhat节点（Chain ID: 31337）
- 使用 `@fhevm/mock-utils` 进行本地开发
- 无需真实网络连接

### 真实网络部署
- 支持Sepolia测试网络
- 使用真实的 `@zama-fhe/relayer-sdk`
- 需要配置相应的网络参数

### 主要功能

#### 医生功能
- ✅ 添加加密医疗记录
- ✅ 管理患者信息
- ✅ 查看授权记录

#### 患者功能
- ✅ 查看个人医疗记录
- ✅ 授权医生访问
- ✅ 权限管理

#### 系统功能
- ✅ 完全加密数据存储
- ✅ 时间戳和数字签名
- ✅ 随机数生成
- ✅ 访问控制管理

## 🛠️ 技术栈

### 智能合约
- **Solidity** ^0.8.24
- **FHEVM** ^0.8.0 - 全同态加密
- **Hardhat** - 开发环境
- **TypeChain** - 类型生成

### 前端
- **Next.js** ^15.4.2 - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Ethers.js** - 区块链交互
- **Lucide React** - 图标库

### FHEVM集成
- **@zama-fhe/relayer-sdk** - 生产环境
- **@fhevm/mock-utils** - 开发环境
- **自动环境检测** - 智能切换

## 🔧 开发命令

### 智能合约
```bash
cd fhevm-hardhat-template

# 编译合约
npm run compile

# 运行测试
npm run test

# 部署合约
npx hardhat run deploy/deploy.ts --network localhost

# 执行任务
npx hardhat medical:get-total-records --contract 0x...
```

### 前端
```bash
cd medrec-frontend

# Mock模式开发
npm run dev:mock

# 生产模式开发
npm run dev

# 生成ABI
npm run genabi

# 构建生产版本
npm run build
```

## 📋 合约功能

### MedicalRecord.sol

#### 核心功能
- `addMedicalRecord()` - 添加加密医疗记录
- `authorizeDoctorAccess()` - 患者授权医生访问
- `revokeDoctorAccess()` - 撤销医生访问权限
- `getMedicalRecord()` - 获取加密记录
- `getTotalRecords()` - 获取总记录数

#### 数据结构
- **EncryptedMedicalRecord** - 加密医疗记录
- **DoctorAuthorization** - 医生授权信息
- **RecordType** - 记录类型枚举

## 🔐 安全特性

- **端到端加密** - 数据在整个处理过程中保持加密
- **零知识证明** - 验证数据有效性而不泄露内容
- **访问控制** - 细粒度的权限管理
- **时间限制** - 授权可设置过期时间
- **密态计算** - 在加密数据上直接计算

## 📈 演示场景

1. **患者注册** → 连接MetaMask钱包
2. **医生添加记录** → 创建加密医疗记录
3. **患者授权** → 授权医生访问权限
4. **医生查看记录** → 查看加密记录数据
5. **统计分析** → 查看系统统计信息

## 🎯 项目亮点

### 技术创新
- ✨ FHEVM原生加密支持
- 🔄 自动环境检测和切换
- 🎭 Mock模式无缝开发体验
- 🚀 现代化React架构

### 用户体验
- 🎨 医疗主题UI设计
- 📱 响应式布局
- 🌐 中英双语支持规划
- ⚡ 流畅的交互体验

### 开发体验
- 🛠️ 完整的开发工具链
- 📦 自动化部署脚本
- 🔍 详细的调试信息
- 📋 任务管理系统

## 🔮 未来规划

- [ ] 支持更多医疗记录类型
- [ ] 实现数据可视化图表
- [ ] 添加医生认证系统
- [ ] 支持多语言界面
- [ ] 集成更多区块链网络
- [ ] 医疗数据分析功能

---

*MediRecX - 让医疗数据管理更安全、更私密、更智能* 🏥✨
