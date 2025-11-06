import QRCode from 'qrcode';

export interface QRCodeData {
  productId?: number;
  qrCode: string;
  timestamp: number;
  manufacturer?: string;
}

class QRCodeService {
  async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      const qrData = JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#1E40AF',
          light: '#FFFFFF'
        },
        width: 256
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  async generateProductQRCode(productName: string, manufacturer: string): Promise<{ code: string; dataURL: string }> {
    const uniqueCode = this.generateUniqueCode();
    const qrData: QRCodeData = {
      qrCode: uniqueCode,
      timestamp: Date.now(),
      manufacturer
    };
    
    const dataURL = await this.generateQRCode(qrData);
    return { code: uniqueCode, dataURL };
  }

  parseQRCode(qrCodeString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrCodeString);
      if (data.qrCode && data.timestamp) {
        return data as QRCodeData;
      }
      return null;
    } catch (error) {
      // If it's not JSON, treat it as a simple QR code
      return {
        qrCode: qrCodeString,
        timestamp: Date.now()
      };
    }
  }

  private generateUniqueCode(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `PRD-${timestamp}-${randomPart}`.toUpperCase();
  }

  validateQRCodeFormat(qrCode: string): boolean {
    // Check if QR code follows expected format
    const pattern = /^PRD-[A-Z0-9]+-[A-Z0-9]+$/;
    return pattern.test(qrCode);
  }

  async scanQRCodeFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        // For demo purposes, we'll extract QR code from filename or use demo codes
        const fileName = file.name.toLowerCase();
        
        // Check if filename contains demo QR codes
        if (fileName.includes('authentic') || fileName.includes('demo-authentic')) {
          resolve('PRD-DEMO-AUTHENTIC');
        } else if (fileName.includes('counterfeit') || fileName.includes('demo-counterfeit')) {
          resolve('PRD-DEMO-COUNTERFEIT');
        } else if (fileName.includes('prd-') || fileName.includes('qr-')) {
          // Try to extract QR code from filename
          const matches = fileName.match(/prd-[a-z0-9]+-[a-z0-9]+/i);
          if (matches) {
            resolve(matches[0].toUpperCase());
          } else {
            // Generate a random QR code for testing
            resolve(`PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`);
          }
        } else {
          // For any other image, generate a test QR code
          resolve(`PRD-${Date.now().toString(36).toUpperCase()}-TEST`);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const qrCodeService = new QRCodeService();