// test/temporaryGuideDetail.e2e.test.js
// 임시 대처 가이드 상세보기 API 전체 플로우 E2E 테스트

const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_EMAIL = 'back@test.com';
const TEST_PASSWORD = 'Password1!';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getToken() {
  const loginRes = await fetchJson(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });
  if (loginRes && loginRes.data && loginRes.data.accessToken) {
    return loginRes.data.accessToken;
  }
  throw new Error('로그인 실패: accessToken 없음');
}

async function getGuideIds(token) {
  const res = await fetchJson(`${BASE_URL}/temporary-guides/ids`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res && res.data && Array.isArray(res.data.guides)) {
    return res.data.guides.map(g => g.guideId);
  }
  throw new Error('가이드 ID 목록 조회 실패');
}

async function getGuideDetail(token, guideId) {
  const res = await fetchJson(`${BASE_URL}/temporary-guides/${guideId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res && res.data) {
    return res.data;
  }
  throw new Error('가이드 상세 조회 실패');
}

(async () => {
  try {
    const token = await getToken();
    console.log('access_token:', token);
    const guideIds = await getGuideIds(token);
    console.log('임시 대처 가이드 ID 목록:', guideIds);
    for (const guideId of guideIds) {
      const detail = await getGuideDetail(token, guideId);
      console.log(`\n[Guide ID: ${guideId}] 상세 응답:`);
      console.dir(detail, { depth: 10 });
    }
    console.log('\n✅ 모든 임시 대처 가이드 상세 응답 테스트 완료');
  } catch (e) {
    console.error('❌ 테스트 실패:', e);
  }
})();
