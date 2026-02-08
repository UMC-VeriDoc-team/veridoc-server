# S3 구축 작업

- 리전: ap-northeast-2 (서울)
- 버킷 이름: veridoc_storage

## 1. AWS S3 버킷 생성
- AWS 콘솔에서 S3 서비스 이동
- 버킷 이름: veridoc_storage
- 리전: ap-northeast-2 (서울)
- 퍼블릭 액세스 차단(기본값)
- 버전 관리, 암호화 등 필요시 활성화

## 2. .env 환경 변수 추가 예시
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=veridoc_storage
```

## 3. Node.js 연동 예시
- aws-sdk 또는 @aws-sdk/client-s3 사용
- 예시 코드 및 업로드/다운로드 기능 구현 예정

---

버킷 생성 후 환경 변수와 연동 코드 작업을 이어가겠습니다.