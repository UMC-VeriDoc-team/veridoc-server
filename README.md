
# 디렉터리 구조

스터디할 때와 유사하게 가져갑니다!

(EXPRESS + MySQL + Prisma)

</br>

```project-root/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/
│   │   ├── index.js
│   │   └── user.routes.js
│   ├── controllers/
│   │   └── user.controller.js
│   ├── dtos/
│   │   └── user.dto.js
│   ├── services/
│   │   └── user.service.js
│   ├── repositories/
│   │   └── user.repository.js
│   ├── config/
│   │   ├── db.config.js
│   │   └── auth.config.js
│   ├── utils/
│   │   └── logger.js
│   ├── errors/
│   │   ├── ApiError.js
│   │   └── errorCodes.js
│   └── middleware/
│       └── errorHandler.js
├── tests/
├── .env
├── .gitignore
├── package.json
└── README.md
```
</br></br>

# GitHub 협업


`main`:  항상 안정 상태 유지, 최종 배포용

`dev`: 개발 통합 브랜치 (뻑날 경우를 대비)

`feature/…`: 각 기능별 브랜치 (예: feature/user-auth, feature/post-crud).
</br></br>

**새로운 코드를 작성할 때**

```
git checkout dev

git pull

git checkout -b feature/api-...
```

코드 작성한 후 커밋 후 푸시</br>
```git push -u origin feature/api-...```</br>
GitHub에서 feature/... → dev로 Pull Request 생성.

팀원이 코드 리뷰하고 승인되면 팀장이 머지하기.

일정 주기로 dev → main PR로 배포 버전 갱신.

PR에는 “어떤 기능을 구현하기 위해 무엇을 변경했는지" 적어주시면 됩니다! </br></br>

**반드시!! feature/... 브랜치 파서 본인 코드 작성 후 PR 요청**
**dev에 푸시XX 머지도 XXX**
</br></br>

# REST API 설계 규칙


**1. 리소스 중심으로 명사만 쓰기** <br>
**2. 동사 피하기** <br>
**3. 팀원들이 직관적으로 이해할 수 있게 쓰기**<br>
**4. 모든 URL은 /api/v1/{리소스}부터 시작**<br>

- **예시**
> `GET`     `/api/v1/users`      #목록 조회<br>
`GET`     `/api/v1/users/1`      #단일 조회<br>
`POST`    `/api/v1/users`          # 생성<br>
`PUT`     `/api/v1/users/1`        # 전체 수정 <br>
`PATCH`  `/api/v1/users/1`        # 부분 수정<br>
`DELETE`  `/api/v1/users/1`        # 삭제

</br>

# 응답 포맷 통일
성공/에러 모두 동일한 JSON 구조

```json
// 성공
{
"success": true,
"message": "요청 성공",
"data": {},
"code": "OK"
}

// 에러
{
"success": false,
"message": "에러 메시지",
"data": null,
"code": "USERS_NOT_FOUND",
"errors": [        // 상세 에러 정보
    {
      "field": "id",
      "message": "ID 999에 해당하는 유저가 없습니다.",
      "received": "999"
    }
  ]
}
```
<br>

**에러 코드도 마찬가지**

다음 예시처럼 만들어서 에러 핸들링 통해서 에러 메세지 제대로 날려주셔야 합니다!

```js

module.exports = {
  // 공통 에러 (000~099)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // 유저 관련 (100~199)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // 게시글 관련 (200~299)
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  NO_PERMISSION: 'NO_PERMISSION'
};
```
```js
// 컨트롤러에서
if (!user) {
  throw new ApiError(404, errorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
}

// 에러 핸들러에서
{
  "success": false,
  "message": "유저를 찾을 수 없습니다.",
  "code": "USER_NOT_FOUND",
  "status": 404
}
```
