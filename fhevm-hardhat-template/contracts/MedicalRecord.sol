// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, ebool, eaddress, externalEuint32, externalEuint64, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title MediRecX - Encrypted Medical Records Management System
/// @author MediRecX Development Team  
/// @notice FHEVM-based medical records management with complete encryption and access control
contract MedicalRecord is SepoliaConfig {
    
    // 医疗记录类型枚举
    enum RecordType {
        DIAGNOSIS,      // 诊断
        PRESCRIPTION,   // 处方  
        LAB_RESULT,     // 检查结果
        TREATMENT,      // 治疗记录
        SURGERY         // 手术记录
    }
    
    // 加密医疗记录结构
    struct EncryptedMedicalRecord {
        euint64 recordId;           // 记录ID（加密）
        eaddress patientAddress;    // 患者地址（加密）
        eaddress doctorAddress;     // 医生地址（加密）
        euint32 recordType;         // 记录类型（加密）
        euint64 timestamp;          // 时间戳（加密）
        euint32 severity;           // 严重程度（加密，1-10）
        ebool isActive;             // 记录是否有效（加密）
        string encryptedDetails;    // 加密的医疗记录详情（链下加密）
        euint64 detailsHash;        // 详情内容哈希（加密，用于验证完整性）
    }
    
    // 医生授权结构
    struct DoctorAuthorization {
        eaddress doctorAddress;     // 医生地址（加密）
        ebool isAuthorized;         // 是否授权（加密）
        euint64 authorizedAt;       // 授权时间（加密）
        euint64 expiresAt;          // 过期时间（加密）
    }
    
    // 状态变量
    euint64 private nextRecordId;                           // 下一个记录ID
    euint32 private totalRecords;                           // 总记录数
    uint256 private currentRecordCounter;                   // 当前记录计数器（明文，用于mapping键）
    
    // 映射：记录ID -> 加密医疗记录
    mapping(uint256 => EncryptedMedicalRecord) private medicalRecords;
    
    // 映射：患者地址 -> 医生地址 -> 授权信息
    mapping(address => mapping(address => DoctorAuthorization)) private doctorAuthorizations;
    
    // 映射：患者地址 -> 记录ID数组
    mapping(address => uint256[]) private patientRecords;
    
    // 映射：医生地址 -> 记录ID数组  
    mapping(address => uint256[]) private doctorRecords;
    
    // 事件定义
    event MedicalRecordAdded(uint256 indexed recordId, address indexed patient, address indexed doctor);
    event DoctorAuthorized(address indexed patient, address indexed doctor, uint256 expiresAt);
    event DoctorDeauthorized(address indexed patient, address indexed doctor);
    event RecordAccessed(uint256 indexed recordId, address indexed accessor);
    
    /// @notice 构造函数初始化合约
    constructor() {
        nextRecordId = FHE.asEuint64(1);
        totalRecords = FHE.asEuint32(0);
        currentRecordCounter = 0; // 明文计数器从0开始
        FHE.allowThis(nextRecordId);
        FHE.allowThis(totalRecords);
    }
    
    /// @notice 添加新的医疗记录
    /// @param patientPlainAddr 患者地址（明文，用于权限设置）
    /// @param patientAddr 患者地址（加密输入）
    /// @param recordTypeInput 记录类型（加密输入）
    /// @param severityInput 严重程度（加密输入）
    /// @param encryptedDetails 加密的医疗记录详情
    /// @param detailsHashInput 详情哈希（加密输入）
    /// @param patientProof 患者地址证明
    /// @param recordTypeProof 记录类型证明
    /// @param severityProof 严重程度证明
    /// @param hashProof 哈希证明
    function addMedicalRecord(
        address patientPlainAddr,
        externalEaddress patientAddr,
        externalEuint32 recordTypeInput,
        externalEuint32 severityInput,
        string calldata encryptedDetails,
        externalEuint64 detailsHashInput,
        bytes calldata patientProof,
        bytes calldata recordTypeProof,
        bytes calldata severityProof,
        bytes calldata hashProof
    ) external {
        // 验证并转换加密输入
        eaddress encryptedPatient = FHE.fromExternal(patientAddr, patientProof);
        euint32 encryptedRecordType = FHE.fromExternal(recordTypeInput, recordTypeProof);
        euint32 encryptedSeverity = FHE.fromExternal(severityInput, severityProof);
        euint64 encryptedDetailsHash = FHE.fromExternal(detailsHashInput, hashProof);
        
        // 递增记录计数器并获取当前记录ID
        currentRecordCounter += 1; // 递增明文计数器
        uint256 recordKey = currentRecordCounter; // 使用递增的计数器作为mapping键
        euint64 currentRecordId = nextRecordId;
        
        // 创建新的医疗记录（使用正确的recordKey）
        EncryptedMedicalRecord storage newRecord = medicalRecords[recordKey];
        newRecord.recordId = currentRecordId;
        newRecord.patientAddress = encryptedPatient;
        newRecord.doctorAddress = FHE.asEaddress(msg.sender);
        newRecord.recordType = encryptedRecordType;
        newRecord.timestamp = FHE.asEuint64(uint64(block.timestamp));
        newRecord.severity = encryptedSeverity;
        newRecord.isActive = FHE.asEbool(true);
        newRecord.encryptedDetails = encryptedDetails;      // 存储加密的医疗详情
        newRecord.detailsHash = encryptedDetailsHash;       // 存储加密的哈希
        
        // 更新记录ID和总数
        nextRecordId = FHE.add(nextRecordId, FHE.asEuint64(1));
        totalRecords = FHE.add(totalRecords, FHE.asEuint32(1));
        
        // 设置合约访问权限（所有字段）
        FHE.allowThis(newRecord.recordId);
        FHE.allowThis(newRecord.patientAddress);
        FHE.allowThis(newRecord.doctorAddress);
        FHE.allowThis(newRecord.severity);
        FHE.allowThis(newRecord.recordType);
        FHE.allowThis(newRecord.timestamp);
        FHE.allowThis(newRecord.isActive);
        FHE.allowThis(newRecord.detailsHash);
        FHE.allowThis(nextRecordId);
        FHE.allowThis(totalRecords);
        
        // 允许医生和患者访问所有字段
        FHE.allow(newRecord.severity, msg.sender);
        FHE.allow(newRecord.severity, patientPlainAddr);
        FHE.allow(newRecord.recordType, msg.sender);
        FHE.allow(newRecord.recordType, patientPlainAddr);
        FHE.allow(newRecord.timestamp, msg.sender);
        FHE.allow(newRecord.timestamp, patientPlainAddr);
        FHE.allow(newRecord.isActive, msg.sender);           // 添加isActive权限
        FHE.allow(newRecord.isActive, patientPlainAddr);
        FHE.allow(newRecord.detailsHash, msg.sender);
        FHE.allow(newRecord.detailsHash, patientPlainAddr);
        
        emit MedicalRecordAdded(recordKey, patientPlainAddr, msg.sender); // 使用真实的地址
    }
    
    /// @notice 患者授权医生访问医疗记录
    /// @param doctorAddr 医生地址（加密输入）
    /// @param expirationTime 过期时间（加密输入）
    /// @param doctorProof 医生地址证明
    /// @param expirationProof 过期时间证明
    function authorizeDoctorAccess(
        externalEaddress doctorAddr,
        externalEuint64 expirationTime,
        bytes calldata doctorProof,
        bytes calldata expirationProof
    ) external {
        eaddress encryptedDoctor = FHE.fromExternal(doctorAddr, doctorProof);
        euint64 encryptedExpiration = FHE.fromExternal(expirationTime, expirationProof);
        
        // 创建授权信息
        DoctorAuthorization storage auth = doctorAuthorizations[msg.sender][address(0)];
        auth.doctorAddress = encryptedDoctor;
        auth.isAuthorized = FHE.asEbool(true);
        auth.authorizedAt = FHE.asEuint64(uint64(block.timestamp));
        auth.expiresAt = encryptedExpiration;
        
        // 设置访问权限
        FHE.allowThis(auth.doctorAddress);
        FHE.allowThis(auth.isAuthorized);
        FHE.allowThis(auth.authorizedAt);
        FHE.allowThis(auth.expiresAt);
        
        FHE.allow(auth.doctorAddress, msg.sender);
        FHE.allow(auth.isAuthorized, msg.sender);
        FHE.allow(auth.authorizedAt, msg.sender);
        FHE.allow(auth.expiresAt, msg.sender);
        
        emit DoctorAuthorized(msg.sender, address(0), uint256(0));
    }
    
    /// @notice 撤销医生访问权限
    /// @param doctorAddr 医生地址（加密输入）
    /// @param doctorProof 医生地址证明
    function revokeDoctorAccess(
        externalEaddress doctorAddr,
        bytes calldata doctorProof
    ) external {
        eaddress encryptedDoctor = FHE.fromExternal(doctorAddr, doctorProof);
        
        DoctorAuthorization storage auth = doctorAuthorizations[msg.sender][address(0)];
        auth.doctorAddress = encryptedDoctor; // 使用加密的医生地址
        auth.isAuthorized = FHE.asEbool(false);
        
        FHE.allowThis(auth.doctorAddress);
        FHE.allowThis(auth.isAuthorized);
        FHE.allow(auth.doctorAddress, msg.sender);
        FHE.allow(auth.isAuthorized, msg.sender);
        
        emit DoctorDeauthorized(msg.sender, address(0));
    }
    
    /// @notice 获取医疗记录（仅授权用户）
    /// @param recordId 记录ID
    /// @return 加密的医疗记录
    function getMedicalRecord(uint256 recordId) external view returns (EncryptedMedicalRecord memory) {
        return medicalRecords[recordId];
    }
    
    /// @notice 获取总记录数
    /// @return 加密的总记录数
    function getTotalRecords() external view returns (euint32) {
        return totalRecords;
    }
    
    /// @notice 检查医生授权状态
    /// @param patient 患者地址
    /// @param doctor 医生地址
    /// @return 授权信息
    function getDoctorAuthorization(address patient, address doctor) 
        external 
        view 
        returns (DoctorAuthorization memory) 
    {
        return doctorAuthorizations[patient][doctor];
    }
    
    /// @notice 更新医疗记录状态
    /// @param recordId 记录ID
    /// @param activeStatus 新的激活状态（加密输入）
    /// @param statusProof 状态证明
    function updateRecordStatus(
        uint256 recordId,
        externalEuint32 activeStatus,
        bytes calldata statusProof
    ) external {
        euint32 encryptedStatus = FHE.fromExternal(activeStatus, statusProof);
        // 将uint32状态转换为bool：0为false，非0为true
        ebool newStatus = FHE.ne(encryptedStatus, FHE.asEuint32(0));
        
        EncryptedMedicalRecord storage record = medicalRecords[recordId];
        record.isActive = newStatus;
        
        FHE.allowThis(record.isActive);
        FHE.allow(record.isActive, msg.sender);
    }
    
    /// @notice 生成随机记录ID（使用FHEVM随机数）
    /// @return 随机生成的记录ID
    function generateRandomRecordId() external returns (euint64) {
        euint64 randomId = FHE.randEuint64();
        FHE.allowThis(randomId);
        FHE.allow(randomId, msg.sender);
        return randomId;
    }
}
