// test/all.e2e.test.js
// Comprehensive test for all main APIs
// No extra npm install required; uses built-in Node.js and supertest-like fetch


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
  // seed.js 기준 더미 유저
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

async function runTests() {
  let passed = 0, failed = 0;
  const results = [];

  let token;
  try {
    token = await getToken();
  } catch (e) {
    console.error('토큰 획득 실패:', e);
    return;
  }
  const authHeader = { Authorization: `Bearer ${token}` };

  // Home API
  try {
    const home = await fetchJson(`${BASE_URL}/homes`, { headers: authHeader });
    if (home && home.data && home.data.symptoms && Array.isArray(home.data.symptoms)) {
      results.push('Home API: PASS');
      passed++;
    } else {
      results.push('Home API: FAIL');
      failed++;
    }
  } catch (e) {
    results.push('Home API: FAIL');
    failed++;
  }

  // 홈 API에서 실제 증상별 answerId를 추출
  let answerId = null;
  try {
    const home = await fetchJson(`${BASE_URL}/homes`, { headers: authHeader });
    if (home && home.data && Array.isArray(home.data.symptoms)) {
      // 첫 번째 증상의 answerId 사용
      answerId = home.data.symptoms[0]?.answerId;
      // answerId가 null이거나 undefined면 expert_answers에서 존재하는 값으로 대체
      if (!answerId) {
        const answerIdsRes = await fetchJson(`${BASE_URL}/homes/answers/ids`, { headers: authHeader });
        if (answerIdsRes && answerIdsRes.data && Array.isArray(answerIdsRes.data.answers) && answerIdsRes.data.answers.length > 0) {
          answerId = answerIdsRes.data.answers[0].answerId;
        }
      }
    }
  } catch (e) {
    console.log('홈 API 또는 Expert Answer IDs 조회 실패:', e);
  }

  // Expert Answer Detail
  try {
    if (!answerId) throw new Error('answerId 없음');
    const answer = await fetchJson(`${BASE_URL}/homes/answers/${answerId}`, { headers: authHeader });
    if (answer && answer.data && answer.data.answerId === answerId) {
      results.push('Expert Answer Detail: PASS');
      passed++;
    } else {
      results.push('Expert Answer Detail: FAIL');
      failed++;
      console.log('Expert Answer Detail 응답:', answer);
    }
  } catch (e) {
    results.push('Expert Answer Detail: FAIL');
    failed++;
    console.log('Expert Answer Detail 에러:', e);
  }

  // Expert Answer Summary
  try {
    if (!answerId) throw new Error('answerId 없음');
    const summary = await fetchJson(`${BASE_URL}/homes/answers/${answerId}/summary`, { headers: authHeader });
    if (summary && summary.data && summary.data.answerId === answerId) {
      results.push('Expert Answer Summary: PASS');
      passed++;
    } else {
      results.push('Expert Answer Summary: FAIL');
      failed++;
      console.log('Expert Answer Summary 응답:', summary);
    }
  } catch (e) {
    results.push('Expert Answer Summary: FAIL');
    failed++;
    console.log('Expert Answer Summary 에러:', e);
  }

  // Agreement API (내 약관 동의 현황)
  try {
    const agreement = await fetchJson(`${BASE_URL}/agreements/me`, { headers: authHeader });
    if (agreement && agreement.agreements) {
      results.push('Agreement API: PASS');
      passed++;
    } else {
      results.push('Agreement API: FAIL');
      failed++;
      console.log('Agreement API 응답:', agreement);
    }
  } catch (e) {
    results.push('Agreement API: FAIL');
    failed++;
    console.log('Agreement API 에러:', e);
  }

  // Hospital API (가까운 병원, lat/lng 쿼리 추가)
  try {
    const hospital = await fetchJson(`${BASE_URL}/hospital/nearby?lat=37.5665&lng=126.9780`, { headers: authHeader });
    if (hospital && hospital.data && Array.isArray(hospital.data)) {
      results.push('Hospital API: PASS');
      passed++;
    } else {
      results.push('Hospital API: FAIL');
      failed++;
      console.log('Hospital API 응답:', hospital);
    }
  } catch (e) {
    results.push('Hospital API: FAIL');
    failed++;
    console.log('Hospital API 에러:', e);
  }

  // Lifestyle Guide API (painAreaId=1 예시)
  try {
    const guide = await fetchJson(`${BASE_URL}/lifestyle-videos/1`, { headers: authHeader });
    if (guide && guide.data) {
      results.push('Lifestyle Guide API: PASS');
      passed++;
    } else {
      results.push('Lifestyle Guide API: FAIL');
      failed++;
      console.log('Lifestyle Guide API 응답:', guide);
    }
  } catch (e) {
    results.push('Lifestyle Guide API: FAIL');
    failed++;
    console.log('Lifestyle Guide API 에러:', e);
  }

  // Pain Area API (리스트)
  try {
    const painArea = await fetchJson(`${BASE_URL}/pain-areas`, { headers: authHeader });
    if (painArea && painArea.data && Array.isArray(painArea.data.painAreas)) {
      results.push('Pain Area API: PASS');
      passed++;
    } else {
      results.push('Pain Area API: FAIL');
      failed++;
      console.log('Pain Area API 응답:', painArea);
    }
  } catch (e) {
    results.push('Pain Area API: FAIL');
    failed++;
    console.log('Pain Area API 에러:', e);
  }

  // Temporary Guide API (ids)
  try {
    const tempGuide = await fetchJson(`${BASE_URL}/temporary-guides/ids`, { headers: authHeader });
    if (tempGuide && tempGuide.data && Array.isArray(tempGuide.data.guides)) {
      results.push('Temporary Guide API: PASS');
      passed++;
    } else {
      results.push('Temporary Guide API: FAIL');
      failed++;
      console.log('Temporary Guide API 응답:', tempGuide);
    }
  } catch (e) {
    results.push('Temporary Guide API: FAIL');
    failed++;
    console.log('Temporary Guide API 에러:', e);
  }

  // User API
  try {
    const user = await fetchJson(`${BASE_URL}/users`, { headers: authHeader });
    if (user && user.data && Array.isArray(user.data.users)) {
      results.push('User API: PASS');
      passed++;
    } else {
      results.push('User API: FAIL');
      failed++;
    }
  } catch (e) {
    results.push('User API: FAIL');
    failed++;
  }

  // Print results
  console.log('Test Results:');
  results.forEach(r => console.log(r));
  console.log(`Passed: ${passed}, Failed: ${failed}`);
}

runTests();
