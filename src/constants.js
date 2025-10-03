import dotenv from 'dotenv';
dotenv.config();

export const DB_NAME = 'YTDATABASE';
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10);
export const ACCESS_TOKEN_SECRET = process.env.ACCESSS_TOKEN_SECRET;
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESSS_TOKEN_EXPIRY;
export const REFRESH_TOKEN_SECRET = process.env.REFRESSH_TOKEN_SECCRE;
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = parseInt(process.env.PORT, 10) || 8000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error(
    'ACCESS_TOKEN_SECRET must be defined in environment variables'
  );
}

if (!REFRESH_TOKEN_SECRET) {
  throw new Error(
    'REFRESH_TOKEN_SECRET must be defined in environment variables'
  );
}

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined in environment variables');
}


MONGODB_URI=mongodb+srv://Ak8417:Ak8417@authdb.g8srf.mongodb.net
CORS_ORIGIN=*
ACCESSS_TOKEN_SECRET=your_super_secret_jwt_key_here
REFRESSH_TOKEN_SECCRE=Adarsh_Kushwaha
REFRESH_TOKEN_EXPIRY=7d
ACCESSS_TOKEN_EXPIRY=1h
SALT_ROUNDS=12
PORT=8000
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=dxdyf51ip
CLOUDINARY_API_KEY=238348693474653
CLOUDINARY_API_SECRET=fY8xHnjuXDhXV0zfmux5V0VG40s