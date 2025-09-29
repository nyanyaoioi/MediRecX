// 医疗记录文本加密工具
import { ethers } from "ethers";

/**
 * 使用AES加密医疗记录文本详情
 */
export async function encryptMedicalDetails(
  details: string,
  patientAddress: string,
  doctorAddress: string
): Promise<{
  encryptedDetails: string;
  detailsHash: string;
}> {
  try {
    // 创建基于地址的加密密钥（确保密钥长度正确）
    const keyMaterial = `${patientAddress}-${doctorAddress}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // 生成固定长度的32字节密钥
    const keyArray = new Uint8Array(32);
    for (let i = 0; i < keyArray.length; i++) {
      keyArray[i] = keyData[i % keyData.length];
    }
    
    // 生成加密密钥
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyArray,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    // 生成随机IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // 加密医疗详情
    const detailsData = encoder.encode(details);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      detailsData
    );

    // 组合IV和加密数据
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // 转换为hex字符串
    const encryptedDetails = "0x" + Array.from(combined)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 计算详情哈希
    const detailsHash = ethers.keccak256(ethers.toUtf8Bytes(details));

    console.log(`[医疗记录加密] ✅ 文本加密完成`);
    console.log(`  原文长度: ${details.length} 字符`);
    console.log(`  加密长度: ${encryptedDetails.length} 字符`);
    console.log(`  哈希值: ${detailsHash}`);

    return {
      encryptedDetails,
      detailsHash,
    };

  } catch (error) {
    console.error("[医疗记录加密] ❌ 加密失败:", error);
    throw new Error("医疗记录文本加密失败");
  }
}

/**
 * 解密医疗记录文本详情
 */
export async function decryptMedicalDetails(
  encryptedDetails: string,
  expectedHash: string,
  patientAddress: string,
  doctorAddress: string
): Promise<string> {
  try {
    console.log(`[医疗记录解密] 🔓 开始解密医疗文本...`);
    
    // 移除0x前缀并转换为字节数组
    const hexString = encryptedDetails.startsWith('0x') 
      ? encryptedDetails.slice(2) 
      : encryptedDetails;
    
    const combined = new Uint8Array(
      hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    if (combined.length < 12) {
      throw new Error("加密数据格式无效");
    }

    // 分离IV和加密数据
    const iv = combined.slice(0, 12);
    const encryptedBuffer = combined.slice(12);

    // 创建解密密钥（与加密时相同的方法）
    const keyMaterial = `${patientAddress}-${doctorAddress}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // 生成固定长度的32字节密钥
    const keyArray = new Uint8Array(32);
    for (let i = 0; i < keyArray.length; i++) {
      keyArray[i] = keyData[i % keyData.length];
    }
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyArray,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // 解密数据
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encryptedBuffer
    );

    // 转换为文本
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);

    // 验证哈希完整性
    const actualHash = ethers.keccak256(ethers.toUtf8Bytes(decryptedText));
    if (actualHash !== expectedHash) {
      console.warn("[医疗记录解密] ⚠️ 哈希验证失败，数据可能已被篡改");
    }

    console.log(`[医疗记录解密] ✅ 文本解密完成`);
    console.log(`  解密长度: ${decryptedText.length} 字符`);
    console.log(`  哈希验证: ${actualHash === expectedHash ? '✅ 通过' : '❌ 失败'}`);

    return decryptedText;

  } catch (error) {
    console.error("[医疗记录解密] ❌ 解密失败:", error);
    throw new Error("医疗记录文本解密失败");
  }
}

/**
 * 生成示例医疗记录文本
 */
export function generateSampleMedicalDetails(
  recordType: string,
  severity: number,
  patientName: string = "患者"
): string {
  const timestamp = new Date().toLocaleString();
  
  const templates = {
    "诊断": `📋 诊断记录

患者信息：${patientName}
诊断时间：${timestamp}
主要症状：${severity > 7 ? '严重症状，需要立即关注' : severity > 4 ? '中等症状，建议观察' : '轻微症状，定期复查'}

诊断结果：
根据患者的临床表现和检查结果，初步诊断为相关疾病。患者目前状况${severity > 7 ? '需要紧急处理' : '相对稳定'}。

治疗建议：
1. ${severity > 7 ? '立即住院治疗' : '门诊随访治疗'}
2. 定期复查相关指标
3. 注意休息和饮食调节
4. 如有异常及时就医

医生签名：Dr.${new Date().getTime().toString().slice(-4)}
记录等级：${severity}/10`,

    "处方": `💊 处方记录

患者信息：${patientName}
开方时间：${timestamp}
症状严重程度：${severity}/10

处方药物：
1. ${severity > 7 ? '强效抗生素' : severity > 4 ? '常规消炎药' : '维生素补充剂'} - 每日3次，饭后服用
2. 止痛药物 - 疼痛时服用，每日最多3次
3. 辅助药物 - 改善症状，每日1次

用药注意事项：
- 按时按量服药，不可擅自停药
- 如有过敏反应立即停药就医
- 服药期间避免饮酒
- 定期复查肝肾功能

医生嘱托：严格按照处方用药，有问题及时联系。`,

    "检查结果": `🔬 检查结果报告

患者信息：${patientName}
检查时间：${timestamp}
检查类型：${severity > 7 ? '紧急检查' : '常规检查'}

检查结果：
- 血常规：${severity > 7 ? '异常，需要关注' : '基本正常'}
- 生化指标：各项指标${severity > 4 ? '部分异常' : '正常范围内'}
- 影像学检查：${severity > 7 ? '发现异常信号' : '未见明显异常'}

结果分析：
根据检查结果，患者目前状况为${severity > 7 ? '需要密切监护' : severity > 4 ? '需要注意观察' : '基本稳定'}。
建议${severity > 7 ? '立即制定治疗方案' : '定期随访复查'}。

检查医生：Dr.${new Date().getTime().toString().slice(-4)}
报告日期：${timestamp}`,

    "治疗": `⚕️ 治疗记录

患者信息：${patientName}
治疗时间：${timestamp}
治疗方案：根据患者病情制定的个性化治疗方案

治疗过程：
1. 初步评估：患者症状严重程度${severity}/10
2. 治疗方法：${severity > 7 ? '积极治疗方案' : severity > 4 ? '标准治疗方案' : '保守治疗方案'}
3. 治疗效果：${severity > 7 ? '需要持续观察' : '效果良好'}

治疗详情：
- 药物治疗：根据病情调整用药方案
- 物理治疗：配合相应的物理康复训练
- 生活指导：调整作息和饮食习惯
- 心理支持：提供必要的心理疏导

后续计划：
${severity > 7 ? '每日观察，根据情况调整治疗' : '每周复查，评估治疗效果'}

主治医生：Dr.${new Date().getTime().toString().slice(-4)}`,

    "手术": `🏥 手术记录

患者信息：${patientName}
手术时间：${timestamp}
手术类型：${severity > 7 ? '紧急手术' : '择期手术'}

手术前评估：
- 患者一般状况：${severity > 7 ? '危重，需要紧急干预' : '良好'}
- 手术适应症：符合手术指征
- 风险评估：${severity > 7 ? '高风险手术' : '低风险手术'}

手术过程：
- 手术开始：${timestamp}
- 麻醉方式：全身麻醉
- 手术步骤：按照标准流程进行
- 手术时长：${severity > 7 ? '较长时间' : '常规时间'}
- 术中情况：${severity > 7 ? '复杂，处理困难' : '顺利，无异常'}

术后情况：
- 患者生命体征平稳
- 伤口情况良好
- 预后评估：${severity > 7 ? '需要密切观察' : '预后良好'}

主刀医生：Dr.${new Date().getTime().toString().slice(-4)}
手术等级：${severity}/10`
  };

  return templates[recordType as keyof typeof templates] || templates["诊断"];
}

/**
 * 基于FHEVM解密数据生成完整医疗详情
 */
export function generateCompleteMedicalDetails(
  recordType: string,
  severity: number,
  timestamp: number,
  isActive: boolean,
  doctorAddress: string
): string {
  const recordTime = new Date(timestamp * 1000).toLocaleString();
  const doctorId = doctorAddress.slice(-4);
  
  const severityLevel = severity > 7 ? '严重' : severity > 4 ? '中等' : '轻微';
  const urgency = severity > 7 ? '需要立即处理' : severity > 4 ? '建议密切观察' : '定期复查即可';
  
  const detailTemplates = {
    "诊断": `📋 详细诊断报告

🏥 诊断信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 诊断时间：${recordTime}
👨‍⚕️ 主诊医师：Dr.${doctorId}
⚕️ 严重等级：${severity}/10 (${severityLevel})
🔐 记录状态：${isActive ? '✅ 有效记录' : '❌ 已归档'}

🩺 临床表现
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
主要症状：${severity > 7 ? '患者出现严重症状，包括持续性疼痛、功能障碍等' : 
           severity > 4 ? '患者有明显不适症状，日常活动受到一定影响' : 
           '患者症状较轻，基本不影响正常生活'}

体征检查：
- 一般状况：${severity > 7 ? '较差，精神萎靡' : severity > 4 ? '一般，轻度不适' : '良好，精神饱满'}
- 生命体征：血压、心率、体温等${severity > 7 ? '异常' : '基本正常'}
- 专科检查：${severity > 7 ? '发现明显异常体征' : '轻微异常或正常'}

🔬 诊断结论
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
初步诊断：基于临床症状和检查结果的综合判断
诊断依据：临床表现 + 辅助检查 + 医师经验
可信度评估：${severity > 7 ? '高度可信，建议立即治疗' : severity > 4 ? '较为可信，建议进一步确认' : '初步判断，建议观察'}

💊 治疗建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
治疗方案：${severity > 7 ? '积极治疗，必要时住院' : severity > 4 ? '药物治疗配合物理疗法' : '保守治疗，定期随访'}
用药指导：根据患者具体情况制定个性化用药方案
生活建议：${urgency}，注意休息，合理饮食，适度运动

📋 随访计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
复查时间：${severity > 7 ? '1周内' : severity > 4 ? '2-4周' : '1-3个月'}
复查项目：相关检查指标和症状评估
联系方式：如有紧急情况请及时就医

🔐 隐私声明：本记录通过FHEVM完全同态加密技术保护，确保患者医疗隐私安全。`,

    "处方": `💊 详细处方记录

🏥 处方信息  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 开方时间：${recordTime}
👨‍⚕️ 开方医师：Dr.${doctorId}
⚕️ 病情严重度：${severity}/10 (${severityLevel})
🔐 处方状态：${isActive ? '✅ 有效处方' : '❌ 已失效'}

💊 处方药物清单
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
主要药物：
${severity > 7 ? 
`1. 强效抗生素片 500mg - 每日3次，饭后服用，连续7天
2. 强效止痛药 100mg - 疼痛时服用，每日最多4次  
3. 免疫调节剂 25mg - 每日1次，睡前服用` :
severity > 4 ?
`1. 常规抗炎药 250mg - 每日2次，饭后服用，连续5天
2. 止痛药 50mg - 需要时服用，每日最多3次
3. 维生素补充剂 - 每日1次，随餐服用` :
`1. 温和调理药 100mg - 每日1次，饭后服用  
2. 维生素复合片 - 每日1次，早餐后服用
3. 益生菌胶囊 - 每日1次，睡前服用`}

📋 用药指导
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
服药时间：严格按照上述时间安排服药
注意事项：
- ${severity > 7 ? '密切观察药物反应，如有不适立即停药' : '按时服药，不可擅自停药或改变剂量'}
- 服药期间避免饮酒，注意饮食清淡
- 如出现过敏症状（皮疹、呼吸困难等）立即就医
- 定期复查相关指标，评估药物效果

⚠️ 禁忌症：孕妇、哺乳期妇女、对药物过敏者禁用
🔄 复查要求：${severity > 7 ? '3-5天后复查' : severity > 4 ? '1-2周后复查' : '1个月后复查'}

🔐 处方编号：RX-${timestamp}-${doctorId}`,

    "检查结果": `🔬 详细检查报告

🏥 检查信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 检查时间：${recordTime}
👨‍⚕️ 检查医师：Dr.${doctorId}
🔍 检查类型：${severity > 7 ? '紧急全面检查' : severity > 4 ? '常规专项检查' : '体检筛查'}
🔐 报告状态：${isActive ? '✅ 正式报告' : '❌ 已归档'}

📊 检查结果数据
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
血液检查：
- 白细胞计数：${severity > 7 ? '异常升高' : severity > 4 ? '轻度升高' : '正常范围'}
- 红细胞计数：${severity > 7 ? '偏低' : '正常'}
- 血小板：${severity > 7 ? '异常' : '正常'}
- 生化指标：肝功能、肾功能等${severity > 7 ? '多项异常' : severity > 4 ? '个别异常' : '基本正常'}

影像检查：
- X光/CT：${severity > 7 ? '发现明显病变' : severity > 4 ? '轻微异常影像' : '未见明显异常'}
- 超声检查：${severity > 7 ? '多处异常回声' : severity > 4 ? '局部异常' : '正常'}

🔬 结果分析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
临床意义：
检查结果显示患者目前${severity > 7 ? '病情较重，需要积极干预治疗' : 
                     severity > 4 ? '有一定程度的异常，建议治疗' : 
                     '状况良好，继续保持健康生活方式'}

异常指标：${severity > 7 ? '多项指标异常，提示疾病进展' : severity > 4 ? '少数指标异常，需要关注' : '各项指标基本正常'}

📋 医师建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
后续处理：${urgency}
复查计划：${severity > 7 ? '1周内复查相关指标' : severity > 4 ? '2-4周复查' : '3-6个月常规复查'}
生活指导：根据检查结果调整生活方式和治疗方案

🔐 报告编号：RPT-${timestamp}-${doctorId}`,

    "治疗": `⚕️ 详细治疗记录

🏥 治疗信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 治疗时间：${recordTime}
👨‍⚕️ 主治医师：Dr.${doctorId}
🏥 治疗方式：${severity > 7 ? '住院综合治疗' : severity > 4 ? '门诊专科治疗' : '门诊保守治疗'}
⚕️ 治疗等级：${severityLevel} (${severity}/10)
🔐 记录状态：${isActive ? '✅ 进行中' : '❌ 已完成'}

💊 治疗方案详情
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
药物治疗：
${severity > 7 ? 
`- 主要药物：强效治疗药物，静脉给药
- 辅助药物：对症支持治疗
- 监护要求：密切监测生命体征` :
severity > 4 ? 
`- 主要药物：标准治疗药物，口服为主
- 辅助治疗：物理治疗配合
- 观察要求：定期评估治疗效果` :
`- 保守药物：温和调理药物
- 生活调节：作息和饮食指导
- 随访要求：定期门诊随访`}

物理治疗：
${severity > 7 ? '卧床休息，必要的护理措施' : 
  severity > 4 ? '适度活动，专业物理康复' : 
  '正常活动，适度锻炼'}

🏥 治疗过程记录
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
治疗开始：${recordTime}
初始评估：患者症状严重程度${severity}/10，${urgency}
治疗响应：${severity > 7 ? '密切观察中，效果待评估' : severity > 4 ? '治疗响应良好' : '症状明显改善'}

📊 疗效评估
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
客观指标：${severity > 7 ? '关键指标改善有限' : severity > 4 ? '部分指标好转' : '各项指标明显改善'}
主观感受：${severity > 7 ? '患者仍有明显不适' : severity > 4 ? '患者自觉症状减轻' : '患者感觉良好'}
生活质量：${severity > 7 ? '严重影响日常生活' : severity > 4 ? '轻度影响生活质量' : '基本不影响正常生活'}

📋 后续计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
继续治疗：${severity > 7 ? '调整治疗方案，加强监护' : severity > 4 ? '维持当前治疗方案' : '逐步减药观察'}
复查安排：${severity > 7 ? '每3-5天复查' : severity > 4 ? '每1-2周复查' : '每月复查'}
康复指导：${severity > 7 ? '院内康复训练' : severity > 4 ? '门诊康复指导' : '居家自我康复'}

🔐 治疗记录ID：TRT-${timestamp}-${doctorId}`,

    "手术": `🏥 详细手术记录

🏥 手术基本信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 手术时间：${recordTime}
👨‍⚕️ 主刀医师：Dr.${doctorId}
🏥 手术类型：${severity > 7 ? '急诊重大手术' : severity > 4 ? '择期中等手术' : '门诊小手术'}
⚕️ 手术等级：${severityLevel} (${severity}/10)
🔐 记录状态：${isActive ? '✅ 术后恢复中' : '❌ 已康复出院'}

🔧 手术详细过程
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
术前准备：
- 患者评估：一般状况${severity > 7 ? '较差，高风险' : severity > 4 ? '良好，中等风险' : '良好，低风险'}
- 麻醉方式：${severity > 7 ? '全身麻醉+监护' : severity > 4 ? '局部麻醉或全麻' : '局部麻醉'}
- 手术团队：${severity > 7 ? '多学科协作' : '专科医师'}

手术经过：
- 手术开始：按计划顺利开始
- 操作过程：${severity > 7 ? '手术复杂，耗时较长，处理困难' : 
            severity > 4 ? '手术顺利，按计划进行' : 
            '手术简单，快速完成'}
- 术中发现：${severity > 7 ? '病变范围较广，情况复杂' : severity > 4 ? '病变局限，处理顺利' : '病变轻微，易于处理'}
- 手术结束：顺利完成，患者生命体征平稳

🏥 术后情况
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
即时状况：
- 生命体征：${severity > 7 ? '需要密切监护' : severity > 4 ? '基本平稳' : '完全稳定'}
- 伤口情况：${severity > 7 ? '需要特殊护理' : '愈合良好'}
- 疼痛评估：${severity > 7 ? '中重度疼痛，需要止痛' : severity > 4 ? '轻中度疼痛' : '轻微疼痛'}

康复计划：
- 卧床时间：${severity > 7 ? '3-7天绝对卧床' : severity > 4 ? '1-3天相对卧床' : '当日可适度活动'}
- 饮食安排：${severity > 7 ? '流质饮食，逐步过渡' : severity > 4 ? '半流质饮食' : '正常饮食'}
- 活动指导：${severity > 7 ? '严格限制活动' : severity > 4 ? '逐步增加活动' : '正常活动'}

📋 出院指导
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
预期住院：${severity > 7 ? '7-14天' : severity > 4 ? '3-7天' : '当日或次日'}
居家护理：伤口换药、用药指导、活动限制
复查安排：${severity > 7 ? '1周内复查' : severity > 4 ? '2周后复查' : '1个月后复查'}

🔐 手术记录号：SUR-${timestamp}-${doctorId}`
  };

  return detailTemplates[recordType as keyof typeof detailTemplates] || 
         detailTemplates["诊断"].replace("诊断", recordType);
}
