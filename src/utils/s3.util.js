
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * S3 파일 업로드
 * @param {Buffer|Stream|string} fileData 업로드할 파일 데이터
 * @param {string} key S3에 저장될 파일명/경로
 * @param {string} contentType 파일 MIME 타입 (예: 'image/png')
 * @returns {Promise<string>} 업로드된 파일의 S3 URL
 */
export async function uploadToS3(fileData, key, contentType = 'application/octet-stream') {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileData,
    ContentType: contentType,
  };
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      resolve(data.Location);
    });
  });
}

/**
 * S3 파일 다운로드
 * @param {string} key S3에 저장된 파일명/경로
 * @returns {Promise<Buffer>} 파일 데이터
 */
export async function downloadFromS3(key) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  };
  return new Promise((resolve, reject) => {
    s3.getObject(params, (err, data) => {
      if (err) return reject(err);
      resolve(data.Body);
    });
  });
}
