import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

// 기본 정보 추가
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'VeriDoc API',
    version: '1.0.0',
    description: 'VeriDoc 서버 API 문서',
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: '로컬 개발 서버',
    },
  ],
  ...swaggerDocument,
};

export default swaggerSpec;
