/**
 * Credential Verification Component
 * 
 * This component provides a comprehensive interface for verifying digital credentials
 * including QR code scanning, manual verification, and detailed credential display.
 * 
 * @author Pickleball Federation Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { digitalCredentialApi } from '../lib/api';
import { toast } from 'sonner';
import { 
  QrCode, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Trophy, 
  Users, 
  Calendar,
  Download,
  Copy,
  Eye,
  Search
} from 'lucide-react';
import { getImageUrl } from '../lib/utils';

interface VerificationResult {
  credential: any;
  verification: {
    timestamp: string;
    method: string;
    valid: boolean;
    warning?: string;
  };
}

interface CredentialVerificationProps {
  verificationCode?: string;
  onVerificationComplete?: (result: VerificationResult) => void;
  showScanner?: boolean;
  isAdmin?: boolean;
}

const CredentialVerification: React.FC<CredentialVerificationProps> = ({
  verificationCode: initialCode,
  onVerificationComplete,
  showScanner = true,
  isAdmin = false
}) => {
  const dispatch = useDispatch();
  
  // State
  const [verificationCode, setVerificationCode] = useState(initialCode || '');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');

  // Handle verification code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value.toUpperCase());
    setError(null);
    setVerificationResult(null);
  };

  // Handle manual verification
  const handleManualVerification = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }

    await verifyCredential(verificationCode.trim());
  };

  // Handle QR code scan
  const handleQRScan = (data: string) => {
    setScannedData(data);
    // Extract verification code from QR data
    const url = new URL(data);
    const code = url.pathname.split('/').pop();
    if (code) {
      setVerificationCode(code);
      verifyCredential(code);
    }
  };

  // Verify credential
  const verifyCredential = async (code: string) => {
    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await digitalCredentialApi.verify(code);
      const result: VerificationResult = {
        credential: response.data.credential,
        verification: response.data.verification
      };
      
      setVerificationResult(result);
      onVerificationComplete?.(result);
      toast.success('Credential verified successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify credential';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Handle download QR code
  const handleDownloadQR = async () => {
    if (!verificationResult?.credential.qr_code_url) {
      toast.error('QR code not available');
      return;
    }

    try {
      const response = await fetch(getImageUrl(verificationResult.credential.qr_code_url));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${verificationResult.credential.credential_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('QR code downloaded successfully');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'inactive':
        return { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' };
      case 'suspended':
        return { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'expired':
        return { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      default:
        return { icon: Shield, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Get club status color
  const getClubStatusColor = (status: string) => {
    switch (status) {
      case 'club_member':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'independent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Credential Verification</h1>
        <p className="text-gray-600">
          Verify the authenticity and status of digital credentials
        </p>
      </div>

      {/* Verification Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="Enter verification code or scan QR code"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                maxLength={20}
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleManualVerification}
              disabled={loading || !verificationCode.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Result Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getStatusIcon(verificationResult.credential.affiliation_status).bgColor}`}>
                  {React.createElement(getStatusIcon(verificationResult.credential.affiliation_status).icon, {
                    className: `h-5 w-5 ${getStatusIcon(verificationResult.credential.affiliation_status).color}`
                  })}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Credential Verified Successfully
                  </h2>
                  <p className="text-sm text-gray-600">
                    Verified on {new Date(verificationResult.verification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
                
                {verificationResult.credential.qr_code_url && (
                  <button
                    onClick={handleDownloadQR}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Credential Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Credential Number:</span>
                      <span className="text-sm text-gray-900 font-mono">
                        {verificationResult.credential.credential_number}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Player Name:</span>
                      <span className="text-sm text-gray-900">
                        {verificationResult.credential.player_name}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">NRTP Level:</span>
                      <span className="text-sm text-gray-900">
                        {verificationResult.credential.nrtp_level || 'Not Rated'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">State:</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {verificationResult.credential.state_affiliation || 'Not Specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Status Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Affiliation Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusIcon(verificationResult.credential.affiliation_status).bgColor} ${getStatusIcon(verificationResult.credential.affiliation_status).color}`}>
                        {verificationResult.credential.affiliation_status.charAt(0).toUpperCase() + verificationResult.credential.affiliation_status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Club Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getClubStatusColor(verificationResult.credential.club_status)}`}>
                        {verificationResult.credential.club_status === 'club_member' ? 'Club Member' : 'Independent'}
                      </span>
                    </div>
                    
                    {verificationResult.credential.club_name && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Club Name:</span>
                        <span className="text-sm text-gray-900">
                          {verificationResult.credential.club_name}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Verification Count:</span>
                      <span className="text-sm text-gray-900">
                        {verificationResult.credential.verification_count || 0} times
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Issued Date:</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(verificationResult.credential.issued_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {verificationResult.credential.expiry_date && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Expiry Date:</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(verificationResult.credential.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {verificationResult.credential.ranking_position && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Ranking Position:</span>
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm text-gray-900">
                            #{verificationResult.credential.ranking_position}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Federation:</span>
                      <span className="text-sm text-gray-900">
                        {verificationResult.credential.federation_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Verification Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Verification Method:</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {verificationResult.verification.method.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Verification Time:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(verificationResult.verification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {verificationResult.verification.warning && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <div className="ml-2">
                            <p className="text-sm text-yellow-800">
                              {verificationResult.verification.warning}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Details */}
            {showDetails && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Extended Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Code</h4>
                    <div className="flex items-center space-x-2">
                      <code className="px-3 py-2 bg-gray-100 rounded-md text-sm font-mono">
                        {verificationResult.credential.verification_code}
                      </code>
                      <button
                        onClick={() => handleCopy(verificationResult.credential.verification_code)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last Verified</h4>
                    <p className="text-sm text-gray-900">
                      {verificationResult.credential.last_verified ? 
                        new Date(verificationResult.credential.last_verified).toLocaleString() : 
                        'Never verified before'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!verificationResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How to Verify</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Enter the verification code manually, or</li>
                  <li>Scan the QR code using your device camera</li>
                  <li>The system will verify the credential's authenticity</li>
                  <li>View detailed information about the credential and player</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialVerification; 