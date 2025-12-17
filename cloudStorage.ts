import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// S3 upload configuration
export const s3Upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'virtualfit-uploads',
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const folder = file.fieldname === 'photo' ? 'user-photos' : 
                    file.fieldname === 'logo' ? 'brand-logos' : 'clothing-images';
      const filename = `${folder}/${uuidv4()}-${Date.now()}.${file.originalname.split('.').pop()}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Image optimization service
export const optimizeImage = async (imageUrl: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}): Promise<string> => {
  try {
    // Use AWS Lambda or CloudFront for image optimization
    const optimizedUrl = `https://d1234567890.cloudfront.net/optimize?url=${encodeURIComponent(imageUrl)}&w=${options.width || 800}&h=${options.height || 600}&q=${options.quality || 80}&f=${options.format || 'webp'}`;
    
    return optimizedUrl;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return imageUrl; // Return original if optimization fails
  }
};

// CDN configuration
export const getCDNUrl = (path: string): string => {
  const cdnDomain = process.env.CDN_DOMAIN || 'https://cdn.virtualfit.com';
  return `${cdnDomain}/${path}`;
};