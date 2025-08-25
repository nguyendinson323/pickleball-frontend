import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { 
  selectMyDigitalCredential, 
  selectDigitalCredentialsLoading,
  selectDigitalCredentialsError,
  selectDigitalCredentialsRegeneratingQR,
  fetchMyDigitalCredential,
  regenerateQRCode
} from '../../../store/slices/digitalCredentialsSlice';
import { toast } from 'sonner';
import { getImageUrl } from '../../../lib/utils';
import { 
  QrCode, 
  RefreshCw, 
  Download, 
  Eye, 
  Shield, 
  Calendar,
  MapPin,
  Trophy,
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import QRCodeDisplay from '../../../components/QRCodeDisplay';

const QRCodeManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const credential = useSelector(selectMyDigitalCredential);
  const loading = useSelector(selectDigitalCredentialsLoading);
  const error = useSelector(selectDigitalCredentialsError);
  const regeneratingQR = useSelector(selectDigitalCredentialsRegeneratingQR);
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!credential) {
      dispatch(fetchMyDigitalCredential());
    }
  }, [dispatch, credential]);

  const handleRegenerateQR = async () => {
    if (!credential) return;
    
    try {
      const result = await dispatch(regenerateQRCode(credential.id)).unwrap();
      console.log('QR code regenerated successfully:', result);
      toast.success('QR code regenerated successfully!');
      
      // Refresh the credential data
      dispatch(fetchMyDigitalCredential());
    } catch (error: any) {
      console.error('Failed to regenerate QR code:', error);
      toast.error(error || 'Failed to regenerate QR code');
    }
  };

  const handleDownload = async () => {
    if (!credential?.qr_code_url) {
      toast.error('No QR code available to download');
      return;
    }

    try {
      const fullUrl = getImageUrl(credential.qr_code_url);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${credential.credential_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getClubStatusColor = (status: string) => {
    switch (status) {
      case 'club_member': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'independent': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading digital credential...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="border border-red-200 bg-red-50 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Credential</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => dispatch(fetchMyDigitalCredential())}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="p-6">
        <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="text-center">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Digital Credential Found</h3>
              <p className="text-gray-600 mb-4">You need to create a digital credential first to manage QR codes.</p>
              <button 
                onClick={() => dispatch(fetchMyDigitalCredential())}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Digital Credential
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
            <p className="text-gray-600">Manage your digital credential QR codes for tournament verification</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              View QR Code
            </button>
            <button
              onClick={handleRegenerateQR}
              disabled={regeneratingQR}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingQR ? 'animate-spin' : ''}`} />
              {regeneratingQR ? 'Regenerating...' : 'Regenerate QR'}
            </button>
            {credential.qr_code_url && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Credential Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Credential Info */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Credential Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Player Name</label>
                <p className="text-lg font-semibold text-gray-900">{credential.player_name}</p>
              </div>

              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">NRTP Level</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    <Trophy className="h-3 w-3 mr-1" />
                    {credential.nrtp_level || 'Not Rated'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(credential.affiliation_status)}`}>
                    {credential.affiliation_status.charAt(0).toUpperCase() + credential.affiliation_status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">State</label>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium">{credential.state_affiliation || 'Not Specified'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Club Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getClubStatusColor(credential.club_status)}`}>
                    <Users className="h-3 w-3 mr-1" />
                    {credential.club_status === 'club_member' ? 'Club Member' : 'Independent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Credential ID</label>
                <p className="text-sm font-mono text-gray-900">{credential.credential_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Verification Code</label>
                <p className="text-sm font-mono text-gray-900">{credential.verification_code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Issued Date</label>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium">
                    {new Date(credential.issued_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {credential.expiry_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Expiry Date</label>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium">
                      {new Date(credential.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {credential.qr_code_url ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {credential.qr_code_url ? 'QR Code Available' : 'No QR Code'}
                </p>
                <p className="text-xs text-gray-500">
                  {credential.qr_code_url ? 'Ready for verification' : 'Generate a QR code first'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Verification Count</p>
                <p className="text-xs text-gray-500">
                  {credential.verification_count || 0} times verified
                </p>
              </div>
            </div>

            {credential.last_verified && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Verified</p>
                  <p className="text-xs text-gray-500">
                    {new Date(credential.last_verified).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowQRModal(true)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {credential.qr_code_url ? 'View QR Code' : 'Generate QR Code'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5">
            <QRCodeDisplay
              qrCodeUrl={credential.qr_code_url}
              qrCodeData={credential.qr_code_data}
              credentialNumber={credential.credential_number}
              verificationCode={credential.verification_code}
              playerName={credential.player_name}
              onRegenerate={handleRegenerateQR}
              onClose={() => setShowQRModal(false)}
              loading={regeneratingQR}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManagement; 