// backend/src/debug-env.ts
import dotenv from 'dotenv';
import path from 'path';

console.log('🔍 Debugging environment variables...');

// Cargar manualmente
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('📁 .env path:', path.resolve(__dirname, '../.env'));
  console.log('🔑 NODE_ENV:', process.env.NODE_ENV);
  console.log('🚪 PORT:', process.env.PORT);
}

// Verificar si el archivo existe
import fs from 'fs';
const envPath = path.resolve(__dirname, '../.env');
console.log('📄 .env exists:', fs.existsSync(envPath));