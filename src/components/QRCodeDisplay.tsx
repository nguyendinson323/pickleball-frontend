import React, { useState } from 'react';
import { QrCode, Download, RefreshCw, Eye, X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '../lib/utils';

interface QRCodeDisplayProps {
  qrCodeUrl?: string;
  qrCodeData?: string;
  credentialNumber: string;
  verificationCode: string;
  playerName: string;
  onRegenerate?: () => void;
  onClose?: () => void;
  loading?: boolean;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeUrl,
  qrCodeData,
  credentialNumber,
  verificationCode,
  playerName,
  onRegenerate,
  onClose,
  loading = false,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    if (!qrCodeUrl) {
      toast.error('No QR code available to download');
      return;
    }

    try {
      const fullUrl = getImageUrl(qrCodeUrl);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${credentialNumber}.png`;
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

  const handleCopyVerificationCode = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      toast.success('Verification code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy verification code:', error);
      toast.error('Failed to copy verification code');
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load QR code image:', qrCodeUrl);
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <QrCode className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Digital Credential QR Code</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* QR Code Display */}
        <div className="text-center">
          {qrCodeUrl && !imageError ? (
            <div className="bg-gray-50 p-6 rounded-lg inline-block">
              <img
                src={getImageUrl(qrCodeUrl)}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
                onError={handleImageError}
                onLoad={() => console.log('QR code image loaded successfully')}
              />
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg inline-block">
              <QrCode className="h-48 w-48 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">QR Code Image</p>
              <p className="text-xs text-gray-400">
                {imageError ? 'Image could not be loaded' : 'No QR code available'}
              </p>
            </div>
          )}
        </div>

        {/* Credential Information */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Player Name:</span>
            <span className="text-gray-900">{playerName}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Credential ID:</span>
            <span className="text-gray-900 font-mono">{credentialNumber}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Verification Code:</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-mono">{verificationCode}</span>
              <button
                onClick={handleCopyVerificationCode}
                className="text-blue-600 hover:text-blue-700 transition-colors"
                title="Copy verification code"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Verification URL */}
        {qrCodeData && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-700">
              <strong>Verification URL:</strong> This QR code links to a secure verification page.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors flex items-center justify-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Regenerating...' : 'Regenerate QR Code'}
            </button>
          )}
          
          {qrCodeUrl && (
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md font-medium transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <p className="text-xs text-gray-600 text-center">
            <strong>How to use:</strong> Tournament officials and club staff can scan this QR code 
            to quickly verify your digital credential and check your current status.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay; 