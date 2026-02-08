// test/showHomeResponse.js
// 홈 API 실제 응답 출력

const BASE_URL = 'http://localhost:3000/api/v1';

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
      email: 'back@test.com',
      password: 'Password1!'
    })
  });
  if (loginRes && loginRes.data && loginRes.data.accessToken) {
    return loginRes.data.accessToken;
  }
  throw new Error('로그인 실패: accessToken 없음');
}

async function main() {
  let token;
  try {
    token = await getToken();
  } catch (e) {
    console.error('토큰 획득 실패:', e);
    return;
  }
  const authHeader = { Authorization: `Bearer ${token}` };
  const home = await fetchJson(`${BASE_URL}/homes`, { headers: authHeader });
  console.log('홈 API 실제 응답:', JSON.stringify(home, null, 2));
}

main();
