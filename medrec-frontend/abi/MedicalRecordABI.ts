/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const MedicalRecordABI = {
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "patient",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "doctor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "expiresAt",
          "type": "uint256"
        }
      ],
      "name": "DoctorAuthorized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "patient",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "doctor",
          "type": "address"
        }
      ],
      "name": "DoctorDeauthorized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "recordId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "patient",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "doctor",
          "type": "address"
        }
      ],
      "name": "MedicalRecordAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "recordId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "accessor",
          "type": "address"
        }
      ],
      "name": "RecordAccessed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "patientPlainAddr",
          "type": "address"
        },
        {
          "internalType": "externalEaddress",
          "name": "patientAddr",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "recordTypeInput",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "severityInput",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "encryptedDetails",
          "type": "string"
        },
        {
          "internalType": "externalEuint64",
          "name": "detailsHashInput",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "patientProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "recordTypeProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "severityProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "hashProof",
          "type": "bytes"
        }
      ],
      "name": "addMedicalRecord",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEaddress",
          "name": "doctorAddr",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint64",
          "name": "expirationTime",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "doctorProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "expirationProof",
          "type": "bytes"
        }
      ],
      "name": "authorizeDoctorAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "generateRandomRecordId",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "patient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "doctor",
          "type": "address"
        }
      ],
      "name": "getDoctorAuthorization",
      "outputs": [
        {
          "components": [
            {
              "internalType": "eaddress",
              "name": "doctorAddress",
              "type": "bytes32"
            },
            {
              "internalType": "ebool",
              "name": "isAuthorized",
              "type": "bytes32"
            },
            {
              "internalType": "euint64",
              "name": "authorizedAt",
              "type": "bytes32"
            },
            {
              "internalType": "euint64",
              "name": "expiresAt",
              "type": "bytes32"
            }
          ],
          "internalType": "struct MedicalRecord.DoctorAuthorization",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "recordId",
          "type": "uint256"
        }
      ],
      "name": "getMedicalRecord",
      "outputs": [
        {
          "components": [
            {
              "internalType": "euint64",
              "name": "recordId",
              "type": "bytes32"
            },
            {
              "internalType": "eaddress",
              "name": "patientAddress",
              "type": "bytes32"
            },
            {
              "internalType": "eaddress",
              "name": "doctorAddress",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "recordType",
              "type": "bytes32"
            },
            {
              "internalType": "euint64",
              "name": "timestamp",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "severity",
              "type": "bytes32"
            },
            {
              "internalType": "ebool",
              "name": "isActive",
              "type": "bytes32"
            },
            {
              "internalType": "string",
              "name": "encryptedDetails",
              "type": "string"
            },
            {
              "internalType": "euint64",
              "name": "detailsHash",
              "type": "bytes32"
            }
          ],
          "internalType": "struct MedicalRecord.EncryptedMedicalRecord",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalRecords",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEaddress",
          "name": "doctorAddr",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "doctorProof",
          "type": "bytes"
        }
      ],
      "name": "revokeDoctorAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "recordId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32",
          "name": "activeStatus",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "statusProof",
          "type": "bytes"
        }
      ],
      "name": "updateRecordStatus",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
