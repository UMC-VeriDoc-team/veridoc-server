import dotenv from 'dotenv';
dotenv.config();
import { uploadToS3, downloadFromS3 } from './s3.util.js';
import fs from 'fs';

async function testS3() {
  try {
    // 1. 업로드 테스트
    const fileData = fs.readFileSync('sample.png'); // 테스트용 파일 준비
    const key = 'test/sample.png';
    const contentType = 'image/png';
    const url = await uploadToS3(fileData, key, contentType);
    console.log('업로드 성공:', url);

    // 2. 다운로드 테스트
    const downloaded = await downloadFromS3(key);
    fs.writeFileSync('downloaded_sample.png', downloaded);
    console.log('다운로드 성공: downloaded_sample.png');
  } catch (err) {
    console.error('S3 테스트 실패:', err);
  }
}

testS3();
