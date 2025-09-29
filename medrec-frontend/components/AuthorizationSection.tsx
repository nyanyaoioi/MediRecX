"use client";

import { useState } from "react";
import { 
  Shield, 
  Users, 
  Plus, 
  EyeOff, 
  Loader2
} from "lucide-react";

interface AuthorizationSectionProps {
  authForm: {
    doctorAddress: string;
    authorizationDays: number;
  };
  setAuthForm: (form: {
    doctorAddress: string;
    authorizationDays: number;
  }) => void;
  onAuthorizeDoctorAccess: () => Promise<void>;
  onRevokeDoctorAccess: (doctorAddress: string) => Promise<void>;
  isAuthorizingDoctor: boolean;
  doctorAuthorizationList: {
    address: string;
    name: string;
    authorizedAt: string;
    expiresAt: string;
    isActive: boolean;
  }[];
}

export const AuthorizationSection: React.FC<AuthorizationSectionProps> = ({
  authForm,
  setAuthForm,
  onAuthorizeDoctorAccess,
  onRevokeDoctorAccess,
  isAuthorizingDoctor,
  doctorAuthorizationList
}) => {
  const [showAuthorizationForm, setShowAuthorizationForm] = useState(false);

  const cardClass = "bg-white rounded-xl shadow-card p-6 border border-gray-100";

  const handleAuthorizeDoctorAccess = async () => {
    await onAuthorizeDoctorAccess();
    setShowAuthorizationForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Permission Management</h2>
        <button
          onClick={() => setShowAuthorizationForm(!showAuthorizationForm)}
          className="bg-medical-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-medical-primary/90 transition-all duration-200 inline-flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Authorize New Doctor
        </button>
      </div>

      {/* Authorization Form */}
      {showAuthorizationForm && (
        <div className={cardClass}>
          <h3 className="font-semibold text-lg mb-4">Authorize New Doctor</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Address</label>
              <input
                type="text"
                placeholder="0x..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                value={authForm.doctorAddress}
                onChange={(e) => setAuthForm({...authForm, doctorAddress: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Authorization Duration (Days)</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                value={authForm.authorizationDays}
                onChange={(e) => setAuthForm({...authForm, authorizationDays: parseInt(e.target.value)})}
              >
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
                <option value={365}>1 Year</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleAuthorizeDoctorAccess}
                disabled={isAuthorizingDoctor}
                className="bg-medical-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-medical-primary/90 transition-all duration-200 flex-1 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {isAuthorizingDoctor ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Authorize Doctor Access
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowAuthorizationForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorized Doctors List */}
      <div className={cardClass}>
        <h3 className="font-semibold text-lg mb-4">Authorized Doctors</h3>
        {doctorAuthorizationList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No doctors authorized yet.</p>
            <p className="text-sm">Authorize doctors to give them access to your medical records.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doctorAuthorizationList.map((authorization, index) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                authorization.isActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    authorization.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      authorization.isActive ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{authorization.name}</p>
                    <p className="text-sm text-gray-500">{authorization.address.slice(0, 8)}...{authorization.address.slice(-6)}</p>
                    <p className="text-xs text-gray-400">
                      {authorization.isActive ? (
                        <>Authorized: {authorization.authorizedAt} - {authorization.expiresAt}</>
                      ) : (
                        <>Access Revoked</>
                      )}
                    </p>
                  </div>
                </div>
                
                {authorization.isActive && (
                  <button 
                    onClick={() => onRevokeDoctorAccess(authorization.address)}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors inline-flex items-center"
                  >
                    <EyeOff className="w-4 h-4 mr-1" />
                    Revoke Access
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

