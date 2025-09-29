// Authorization utility functions for Patient Dashboard

export interface AuthorizationForm {
  doctorAddress: string;
  authorizationDays: number;
}

export interface DoctorAuthorization {
  address: string;
  name: string;
  authorizedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export const validateDoctorAddress = (address: string): boolean => {
  if (!address.trim()) return false;
  if (address.length < 10) return false;
  if (!address.startsWith('0x')) return false;
  return true;
};

export const createDoctorAuthorization = (
  doctorAddress: string,
  expirationTime: number
): DoctorAuthorization => {
  return {
    address: doctorAddress,
    name: `Dr. ${doctorAddress.slice(-4)}`,
    authorizedAt: new Date().toLocaleDateString(),
    expiresAt: new Date(expirationTime * 1000).toLocaleDateString(),
    isActive: true
  };
};

export const deactivateDoctorAuthorization = (
  authList: DoctorAuthorization[],
  doctorAddress: string
): DoctorAuthorization[] => {
  return authList.map(auth =>
    auth.address === doctorAddress
      ? { ...auth, isActive: false }
      : auth
  );
};

