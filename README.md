# VeriDoc Server

증상 기반 건강 가이드 서비스의 백엔드 서버입니다.

**Tech Stack:** Express + MySQL + Prisma

## 디렉터리 구조

```
project-root/
├── .github/
│   └── workflows/
│       ├── ci.yaml
│       └── cd.yaml
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── admin.routes.js
│   │   ├── agreement.routes.js
│   │   ├── expertAnswer.routes.js
│   │   ├── homes.routes.js
│   │   ├── hospital.routes.js
│   │   ├── lifestyleGuide.routes.js
│   │   ├── painArea.routes.js
│   │   ├── symptomGuide.routes.js
│   │   ├── temporaryGuide.routes.js
│   │   ├── usageGuide.routes.js
│   │   └── user.routes.js
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── agreement.controller.js
│   │   ├── expertAnswer.controller.js
│   │   ├── home.controller.js
│   │   ├── hospital.controller.js
│   │   ├── lifestyleGuide.controller.js
│   │   ├── painArea.controller.js
│   │   ├── symptomGuide.controller.js
│   │   ├── symptomGuide_events.controller.js
│   │   ├── symptomGuide_reset.controller.js
│   │   ├── symptomGuide_validate.controller.js
│   │   ├── temporaryGuide.controller.js
│   │   ├── usageGuide.controller.js
│   │   └── user.controller.js
│   ├── services/
│   │   ├── agreement.service.js
│   │   ├── expertAnswer.service.js
│   │   ├── home.service.js
│   │   ├── hospital.service.js
│   │   ├── lifestyleGuide.service.js
│   │   ├── painArea.service.js
│   │   ├── symptomGuide.service.js
│   │   ├── symptomGuide_events.service.js
│   │   ├── symptomGuide_reset.service.js
│   │   ├── symptomGuide_validate.service.js
│   │   ├── temporaryGuide.service.js
│   │   ├── usageGuide.service.js
│   │   └── user.service.js
│   ├── repositories/
│   │   ├── agreement.repository.js
│   │   ├── home.repository.js
│   │   ├── hospital.repository.js
│   │   ├── lifestyleGuide.repository.js
│   │   ├── painArea.repository.js
│   │   ├── symptomGuide.repository.js
│   │   ├── temporaryGuide.repository.js
│   │   ├── usageGuide.repository.js
│   │   └── user.repository.js
│   ├── dtos/
│   │   ├── answer.dto.js
│   │   └── user.dto.js
│   ├── config/
│   │   ├── auth.config.js
│   │   ├── db.config.js
│   │   ├── email.config.js
│   │   └── swagger.config.js
│   ├── utils/
│   │   ├── email.util.js
│   │   ├── jwt.util.js
│   │   ├── response.util.js
│   │   └── s3.util.js
│   ├── errors/
│   │   ├── ApiError.js
│   │   └── errorCodes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── errorHandler.js
│   └── docs/
│       └── (Swagger YAML 문서)
├── test/
│   └── temporaryGuideDetail.e2e.test.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 시작하기

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성 후 아래 환경 변수 항목 참고)

# Prisma 마이그레이션
npx prisma migrate dev

# Prisma 클라이언트 생성
npx prisma generate

# Seed 데이터 삽입
npx prisma db seed

# 개발 서버 실행
npm run dev

# 프로덕션 실행
npm start
```

## 주요 기능

| 기능 | 엔드포인트 | 설명 |
|------|-----------|------|
| 회원가입/로그인 | `/api/v1/users` | JWT 기반 인증, 비밀번호 찾기 이메일 발송 |
| 홈 화면 | `/api/v1/homes` | 배너, 증상, 임시 대처 가이드 통합 조회 |
| 전문의 답변 | `/api/v1/expert-answers` | 전문의 답변 요약 및 상세 조회 |
| 증상 가이드 | `/api/v1/symptoms/:painAreaId/guide` | 4단계 증상 가이드 (조회, 검증, 이벤트, 초기화) |
| 임시 대처 가이드 | `/api/v1/temporary-guides` | 임시 대처 가이드 상세 조회 |
| 생활관리 영상 | `/api/v1/symptoms/:painAreaId/lifestyle-videos` | 통증 부위별 생활관리 영상 조회 |
| 범용 가이드 | `/api/v1/usage-guides` | 범용 가이드 원문 조회 |
| 병원 추천 | `/api/v1/hospitals/nearby` | 위치 기반 근처 병원 검색 |
| 이용약관 | `/api/v1/agreements` | 서비스 이용약관 동의 |
| 관리자 | `/api/v1/admin` | 마스터 토큰 발급 |



## GitHub 협업

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 항상 안정 상태 유지, 최종 배포용 |
| `dev` | 개발 통합 브랜치 |
| `feature/...` | 각 기능별 브랜치 (예: `feature/user-auth`, `feat/home-screen`) |
| `fix/...` | 버그 수정 브랜치 |
| `chore/...` | 설정, CI/CD 등 기능 외 작업 |

### 작업 흐름

```bash
# 1. dev 브랜치에서 최신 코드 pull
git checkout dev
git pull origin dev

# 2. feature 브랜치 생성
git checkout -b feature/api-...

# 3. 코드 작성 후 커밋 & 푸시
git push -u origin feature/api-...

# 4. GitHub에서 feature/... → dev로 Pull Request 생성
```

- 팀원이 코드 리뷰하고 승인되면 팀장이 머지
- 일정 주기로 `dev` → `main` PR로 배포 버전 갱신
- PR에는 "어떤 기능을 구현하기 위해 무엇을 변경했는지" 작성

> **반드시 `feature/...` 브랜치를 파서 작업 후 PR 요청. `dev`에 직접 push/merge 금지!**

## REST API 설계 규칙

1. 리소스 중심으로 **명사만** 쓰기
2. **동사** 피하기
3. 팀원들이 **직관적으로 이해**할 수 있게 쓰기
4. 모든 URL은 `/api/v1/{리소스}`부터 시작

```
GET     /api/v1/users        # 목록 조회
GET     /api/v1/users/1      # 단일 조회
POST    /api/v1/users        # 생성
PUT     /api/v1/users/1      # 전체 수정
PATCH   /api/v1/users/1      # 부분 수정
DELETE  /api/v1/users/1      # 삭제
```

## 응답 포맷 통일

성공/에러 모두 동일한 JSON 구조:

**성공 응답:**
```json
{
  "success": true,
  "message": "요청 성공",
  "data": {},
  "code": "OK"
}
```

**에러 응답:**
```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null,
  "code": "USERS_NOT_FOUND",
  "errors": [
    {
      "field": "id",
      "message": "ID 999에 해당하는 유저가 없습니다.",
      "received": "999"
    }
  ]
}
```

**에러 코드 예시:**

```js
export default {
  // 공통 에러 (000~099)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // 유저 관련 (100~199)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
};
```

**컨트롤러에서 사용:**

```js
if (!user) {
  throw new ApiError(404, errorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
}
```

## .env 환경 변수

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `PORT` | 서버 포트 | 기본값: 3000 |
| `DATABASE_URL` | MySQL 데이터베이스 연결 URL | |
| `JWT_SECRET` | 일반 사용자 로그인용 JWT 시크릿 | |
| `ADMIN_API_KEY` | 마스터 토큰 발급 API 호출 시 비밀 키 | PM/팀원에게 이 값만 전달 |
| `AWS_ACCESS_KEY_ID` | AWS IAM 사용자 ACCESS 키 | |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM 사용자 시크릿 ACCESS 키 | |
| `AWS_REGION` | AWS 리전 | ap-northeast-2 |
| `AWS_S3_BUCKET` | S3 버킷 이름 | veridoc-storage |
| `SMTP_HOST` | SMTP 메일 서버 호스트 | smtp.gmail.com |
| `SMTP_PORT` | SMTP 포트 | 587 |
| `SMTP_USER` | SMTP 발신 이메일 계정 | |
| `SMTP_PASS` | SMTP 앱 비밀번호 | Gmail 앱 비밀번호 사용 |
| `EMAIL_FROM` | 발신자 이메일 주소 | |
| `PASSWORD_RESET_URL` | 비밀번호 재설정 프론트엔드 URL | |
| `OPEN_API_SERVICE_KEY` | 공공데이터 API 서비스 키 | 병원 조회 등에 사용 |