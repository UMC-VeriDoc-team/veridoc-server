import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // symptom_steps 테이블 전체 삭제 (중복 방지)
    await prisma.symptom_steps.deleteMany();
  // ── 기존 seed.js 실행 후 보충 데이터를 삽입하는 스크립트 ──
  // 사용법: node prisma/seed-extra.js

  const painAreas = await prisma.pain_areas.findMany({ orderBy: { pain_area_id: 'asc' } });
  const symptoms = await prisma.symptoms.findMany({
    select: { symptom_id: true, name: true, pain_area_id: true },
    orderBy: { symptom_id: 'asc' },
  });

  if (painAreas.length === 0 || symptoms.length === 0) {
    console.log('pain_areas 또는 symptoms 데이터가 없습니다. 먼저 npx prisma db seed 를 실행하세요.');
    return;
  }

  const painAreaMap = Object.fromEntries(
    painAreas.map((pa) => [Number(pa.pain_area_id), pa.name])
  );

  const buildGuideContent = (title, painAreaName) => (
    `${title}에 대한 임시 대처 가이드입니다. ` +
    `${painAreaName}에 무리가 가지 않도록 천천히 진행하세요.`
  );

  // pain_area_id별 증상 그룹핑
  const symptomsByPainArea = {};
  for (const s of symptoms) {
    const key = Number(s.pain_area_id);
    if (!symptomsByPainArea[key]) symptomsByPainArea[key] = [];
    symptomsByPainArea[key].push(s);
  }

  // ============================
  // 1) lifestyle_videos
  // ============================
  const existingVideos = await prisma.lifestyle_videos.count();
  if (existingVideos === 0) {
    const videoData = [];
    let displayOrder = 1;

    for (const symptom of symptoms) {
      const areaName = painAreaMap[Number(symptom.pain_area_id)] || '통증 부위';

      videoData.push(
        {
          symptom_id: symptom.symptom_id,
          title: `${areaName} ${symptom.name} 스트레칭`,
          description: `${symptom.name} 증상 완화를 위한 기본 스트레칭 영상입니다. 하루 1~2회 따라해보세요.`,
          youtube_url: `https://www.youtube.com/watch?v=dummy_${Number(symptom.symptom_id)}_1`,
          thumbnail_url: `https://img.youtube.com/vi/dummy_${Number(symptom.symptom_id)}_1/hqdefault.jpg`,
          display_order: displayOrder++,
          is_active: true,
        },
        {
          symptom_id: symptom.symptom_id,
          title: `${areaName} ${symptom.name} 셀프 마사지`,
          description: `${symptom.name} 증상에 도움이 되는 셀프 마사지 방법을 알려드립니다.`,
          youtube_url: `https://www.youtube.com/watch?v=dummy_${Number(symptom.symptom_id)}_2`,
          thumbnail_url: `https://img.youtube.com/vi/dummy_${Number(symptom.symptom_id)}_2/hqdefault.jpg`,
          display_order: displayOrder++,
          is_active: true,
        }
      );
    }

    await prisma.lifestyle_videos.createMany({ data: videoData });
    console.log(`lifestyle_videos ${videoData.length}건 삽입 완료`);
  } else {
    console.log(`lifestyle_videos 이미 ${existingVideos}건 존재, 건너뜀`);
  }

  // ============================
  // 2) symptom_steps
  // ============================
  const existingSteps = await prisma.symptom_steps.count();
  if (existingSteps === 0) {
    await prisma.symptom_steps.deleteMany();
    const stepData = [];
    for (const symptom of symptoms) {
      if (!symptom.symptom_id || !symptom.pain_area_id) {
        console.warn('[seed-extra.js] 증상 데이터에 symptom_id 또는 pain_area_id가 없습니다:', symptom);
        continue;
      }
      stepData.push(
        {
          pain_area_id: symptom.pain_area_id,
          step_number: 1,
          title: '증상 확인',
          description: `${symptom.name} 증상이 나타나면 우선 통증 정도와 빈도를 확인하세요.`,
          image_url: 'https://example.com/steps/step1.png',
        },
        {
          pain_area_id: symptom.pain_area_id,
          step_number: 2,
          title: '임시 대처',
          description: `가벼운 스트레칭이나 찜질로 ${symptom.name} 증상을 완화해보세요.`,
          image_url: 'https://example.com/steps/step2.png',
        },
        {
          pain_area_id: symptom.pain_area_id,
          step_number: 3,
          title: '병원 방문',
          description: '증상이 지속되면 가까운 병원에 방문하여 전문의 진료를 받으세요.',
          image_url: 'https://example.com/steps/step3.png',
        }
      );
    }

    // pain_area_id + step_number 조합 중복 제거
    const uniqueStepData = [];
    const stepKeySet = new Set();
    for (const step of stepData) {
      const key = `${step.pain_area_id}_${step.step_number}`;
      if (!stepKeySet.has(key)) {
        uniqueStepData.push(step);
        stepKeySet.add(key);
      }
    }
    if (uniqueStepData.length === 0) {
      console.error('[seed-extra.js] symptom_steps에 삽입할 데이터가 없습니다. 증상 데이터 확인 필요.');
    } else {
      await prisma.symptom_steps.createMany({ data: uniqueStepData });
      console.log(`symptom_steps ${uniqueStepData.length}건 삽입 완료`);
    }
  } else {
    console.log(`symptom_steps 이미 ${existingSteps}건 존재, 건너뜀`);
  }

  // ============================
  // 2-1) temporary_care_guides 보강
  // ============================
  const existingGuides = await prisma.temporary_care_guides.findMany({
    select: { pain_area_id: true, title: true, display_order: true },
  });

  const guideCounts = new Map();
  const guideTitles = new Map();
  const guideMaxOrder = new Map();

  for (const guide of existingGuides) {
    const key = Number(guide.pain_area_id);
    guideCounts.set(key, (guideCounts.get(key) || 0) + 1);

    const titles = guideTitles.get(key) || new Set();
    titles.add(guide.title);
    guideTitles.set(key, titles);

    const currentMax = guideMaxOrder.get(key) || 0;
    const nextMax = Math.max(currentMax, Number(guide.display_order || 0));
    guideMaxOrder.set(key, nextMax);
  }

  const guideTemplates = [
    {
      guide_type: '스트레칭/찜질',
      title: (name) => `${name} 간단 스트레칭`,
      content: (name) => `${name} 주변 근육을 부드럽게 풀어주는 가벼운 스트레칭을 권장합니다.\n통증이 심하면 즉시 중단하세요.`,
      image_url: 'https://example.com/guides/extra-stretch.png',
    },
    {
      guide_type: '스트레칭/찜질',
      title: (name) => `${name} 온찜질/냉찜질`,
      content: () => '급성 통증에는 냉찜질을, 만성 통증에는 온찜질을 시도해보세요.',
      image_url: 'https://example.com/guides/extra-heat.png',
    },
    {
      guide_type: '생활 습관',
      title: (name) => `${name} 생활 습관 점검`,
      content: (name) => `장시간 같은 자세를 피하고, ${name}에 무리가 가는 동작을 줄여주세요.\n규칙적인 휴식이 도움이 됩니다.`,
      image_url: 'https://example.com/guides/extra-habit.png',
    },
  ];

  const extraGuides = [];

  for (const painArea of painAreas) {
    const painAreaKey = Number(painArea.pain_area_id);
    let existingCount = guideCounts.get(painAreaKey) || 0;
    let nextOrder = (guideMaxOrder.get(painAreaKey) || 0) + 1;
    const titles = guideTitles.get(painAreaKey) || new Set();

    for (const template of guideTemplates) {
      if (existingCount >= 3) break;

      const title = template.title(painArea.name);
      if (titles.has(title)) continue;

      // duration 값은 guide_type에 따라 다르게 설정
      let duration = null;
      if (template.guide_type === '스트레칭/찜질') duration = '평균 소요 시간 10분';
      else if (template.guide_type === '생활 습관') duration = '상시';

      extraGuides.push({
        pain_area_id: painArea.pain_area_id,
        guide_type: template.guide_type,
        title,
        content: template.content(painArea.name),
        image_url: template.image_url,
        display_order: nextOrder++,
        duration,
      });

      titles.add(title);
      existingCount += 1;
    }
  }

  if (extraGuides.length > 0) {
    await prisma.temporary_care_guides.createMany({ data: extraGuides });
    console.log(`temporary_care_guides 추가 ${extraGuides.length}건 삽입 완료`);
  } else {
    console.log('temporary_care_guides 충분히 존재, 보강 건너뜀');
  }

  // 각 임시 가이드별 badge/note/caution/help 더미 데이터 생성
  const allGuides = await prisma.temporary_care_guides.findMany({
    select: { guide_id: true, pain_area_id: true, title: true },
  });

  for (const guide of allGuides) {
    const painAreaName = painAreaMap[Number(guide.pain_area_id)] || '통증 부위';
    // 각 필드에 더미 데이터 입력
    // duration도 업데이트 (guide_type에 따라)
    let duration = null;
    if (guide.title.includes('스트레칭') || guide.title.includes('찜질')) duration = '평균 소요 시간 10분';
    else if (guide.title.includes('생활 습관')) duration = '상시';
    else duration = '약 10분 소요';

    await prisma.temporary_care_guides.update({
      where: { guide_id: guide.guide_id },
      data: {
        content: `${painAreaName}에 대한 임시 대처 가이드입니다.`,
        subtitle: `${painAreaName} 근육을 풀어주는 방법`,
        source_name: `${painAreaName} 건강정보`,
        source_url: `https://example.com/${encodeURIComponent(painAreaName)}`,
        highlighter: `${painAreaName}는 무리하지 않는 선에서!`,
        duration,
      },
    });

    // badge
    await prisma.badges.createMany({
      data: [
        { guide_id: guide.guide_id, text: `${painAreaName} · 스트레칭/찜질` },
        { guide_id: guide.guide_id, text: '평균 소요 시간 10분' },
      ],
      skipDuplicates: true,
    });
    // note
    await prisma.notes.createMany({
      data: [
        { guide_id: guide.guide_id, image_url: 'http://image1.png', bold: `${painAreaName}를 천천히`, text: `${painAreaName} 부위를 천천히 움직이며 작은 범위로 시작해 점차 넓혀보세요.` },
        { guide_id: guide.guide_id, image_url: 'http://image2.png', bold: '무리하지 않기', text: '통증이 심해지면 즉시 중단하세요.' },
        { guide_id: guide.guide_id, image_url: 'http://image3.png', bold: '호흡 유지', text: '스트레칭 중에는 천천히 호흡을 유지하세요.' },
      ],
      skipDuplicates: true,
    });
    // caution
    await prisma.cautions.createMany({
      data: [
        { guide_id: guide.guide_id, icon_url: 'http://icon1.png', bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있으니 전문가 상담을 권장합니다.' },
        { guide_id: guide.guide_id, icon_url: 'http://icon2.png', bold: '관절 움직임 제한', text: '팔을 들기 어렵거나 움직임이 제한된다면 병원 진료가 필요합니다.' },
        { guide_id: guide.guide_id, icon_url: 'http://icon3.png', bold: '야간 통증', text: '수면 중 통증이 심하다면 염증이나 구조적 문제일 수 있습니다.' },
      ],
      skipDuplicates: true,
    });
    // help
    await prisma.helps.createMany({
      data: [
        { guide_id: guide.guide_id, text: '오랜 시간 앉아 있거나 같은 자세를 유지할 때' },
        { guide_id: guide.guide_id, text: `${painAreaName} 주변 근육에 긴장이 쌓였을 때` },
        { guide_id: guide.guide_id, text: `${painAreaName}의 가동 범위가 줄어든 것처럼 느껴질 때` },
      ],
      skipDuplicates: true,
    });
  }

  // ============================
  // 2-2) expert_answers 보강 (morePosts용 2개 보장)
  // ============================
  const existingAnswers = await prisma.expert_answers.findMany({
    select: {
      answer_id: true,
      symptom_id: true,
      symptoms: { select: { pain_area_id: true } },
    },
  });

  const answersBySymptom = new Map();
  const answersByPainArea = new Map();

  for (const answer of existingAnswers) {
    const symptomKey = Number(answer.symptom_id);
    answersBySymptom.set(symptomKey, (answersBySymptom.get(symptomKey) || 0) + 1);

    const painAreaKey = Number(answer.symptoms?.pain_area_id);
    if (!Number.isNaN(painAreaKey)) {
      answersByPainArea.set(painAreaKey, (answersByPainArea.get(painAreaKey) || 0) + 1);
    }
  }

  const plannedPainAreaCounts = new Map(answersByPainArea);
  const extraAnswers = [];
  let extraIndex = 1;

  for (const symptom of symptoms) {
    const symptomKey = Number(symptom.symptom_id);
    if ((answersBySymptom.get(symptomKey) || 0) > 0) continue;

    const painAreaKey = Number(symptom.pain_area_id);
    const areaName = painAreaMap[painAreaKey] || '통증 부위';

    extraAnswers.push({
      symptom_id: symptom.symptom_id,
      summary: `${areaName} ${symptom.name} 증상은 다양한 원인으로 인해 발생할 수 있습니다.`,
      full_content: `${areaName} ${symptom.name} 증상에 대한 전문의 진료 기록입니다.\n\n원인:\n- 잘못된 자세 유지\n- 근육 피로\n- 염증성 질환\n\n치료 방법:\n1. 물리 치료\n2. 스트레칭 운동\n3. 약물 치료\n4. 생활 습관 개선\n\n예방:\n- 정기적인 운동\n- 올바른 자세 유지\n- 스트레스 관리\n- 충분한 휴식`,
      source_url: `https://example.com/treatments/extra-${extraIndex++}`,
    });

    plannedPainAreaCounts.set(
      painAreaKey,
      (plannedPainAreaCounts.get(painAreaKey) || 0) + 1
    );
  }

  for (const painArea of painAreas) {
    const painAreaKey = Number(painArea.pain_area_id);
    let currentCount = plannedPainAreaCounts.get(painAreaKey) || 0;
    const pool = symptomsByPainArea[painAreaKey] || [];

    let poolIndex = 0;
    while (currentCount < 3 && pool.length > 0) {
      const symptom = pool[poolIndex % pool.length];
      extraAnswers.push({
        symptom_id: symptom.symptom_id,
        summary: `${painArea.name} ${symptom.name} 증상은 다양한 원인으로 인해 발생할 수 있습니다.`,
        full_content: `${painArea.name} ${symptom.name} 증상에 대한 전문의 진료 기록입니다.\n\n원인:\n- 잘못된 자세 유지\n- 근육 피로\n- 염증성 질환\n\n치료 방법:\n1. 물리 치료\n2. 스트레칭 운동\n3. 약물 치료\n4. 생활 습관 개선\n\n예방:\n- 정기적인 운동\n- 올바른 자세 유지\n- 스트레스 관리\n- 충분한 휴식`,
        source_url: `https://example.com/treatments/extra-${extraIndex++}`,
      });
      currentCount += 1;
      poolIndex += 1;
    }

    plannedPainAreaCounts.set(painAreaKey, currentCount);
  }

  if (extraAnswers.length > 0) {
    await prisma.expert_answers.createMany({ data: extraAnswers });
    console.log(`expert_answers 추가 ${extraAnswers.length}건 삽입 완료`);
  } else {
    console.log('expert_answers 충분히 존재, 보강 건너뜀');
  }

  // ============================
  // 3) Seed User 증상 보강 (어깨 3개 모두)
  // ============================
  const seedUser = await prisma.users.findFirst({ orderBy: { user_id: 'asc' } });
  if (seedUser) {
    const shoulderPainArea = painAreas.find((pa) => pa.name === '어깨');
    if (shoulderPainArea) {
      const shoulderSymptoms = symptomsByPainArea[Number(shoulderPainArea.pain_area_id)] || [];

      for (const symptom of shoulderSymptoms) {
        await prisma.user_symptoms.upsert({
          where: {
            user_id_symptom_id: {
              user_id: seedUser.user_id,
              symptom_id: symptom.symptom_id,
            },
          },
          update: {},
          create: {
            user_id: seedUser.user_id,
            symptom_id: symptom.symptom_id,
          },
        });
      }
      console.log(`Seed User(${seedUser.email}): 어깨 증상 ${shoulderSymptoms.length}개 매핑 완료`);
    }

    // Seed User 약관 동의
    const now = new Date();
    for (const type of ['TOS', 'PRIVACY', 'LOCATION']) {
      await prisma.user_agreements.upsert({
        where: {
          user_id_agreement_type: {
            user_id: seedUser.user_id,
            agreement_type: type,
          },
        },
        update: { agreed_at: now },
        create: {
          user_id: seedUser.user_id,
          agreement_type: type,
          agreed_at: now,
        },
      });
    }
    console.log(`Seed User(${seedUser.email}): 약관동의 완료`);
  }

  // ============================
  // 4) 부위별 테스트 유저 생성
  // ============================
  const hashedPassword = await bcrypt.hash('Password1!', 10);

  const testUsers = [
    { name: '허리유저', email: 'back@test.com', painArea: '허리' },
    { name: '무릎유저', email: 'knee@test.com', painArea: '무릎' },
    { name: '목유저', email: 'neck@test.com', painArea: '목' },
    { name: '두통유저', email: 'headache@test.com', painArea: '두통' },
    { name: '복통유저', email: 'abdomen@test.com', painArea: '복통' },
  ];

  for (const tu of testUsers) {
    // 이미 존재하는 유저면 user_id를 가져오고, 없으면 새로 생성
    let user = await prisma.users.findUnique({ where: { email: tu.email } });
    if (!user) {
      user = await prisma.users.create({
        data: {
          name: tu.name,
          email: tu.email,
          password: hashedPassword,
          birth: new Date('1995-06-15'),
          gender: 'MALE',
        },
      });
      console.log(`${tu.email} 새로 생성됨`);
    } else {
      console.log(`${tu.email} 이미 존재, user_id=${user.user_id}`);
    }

    // painArea가 존재하는지 확인
    const painArea = painAreas.find((pa) => pa.name === tu.painArea);
    if (!painArea) {
      console.warn(`[seed-extra.js] ${tu.painArea} painArea 없음, ${tu.email} 매핑 건너뜀`);
      continue;
    }

    // user_pain_areas 매핑: users 테이블에 존재하는 user_id만 사용
    try {
      await prisma.user_pain_areas.create({
        data: {
          user_id: user.user_id,
          pain_area_id: painArea.pain_area_id,
        },
      });
    } catch (e) {
      console.warn(`[seed-extra.js] user_pain_areas 매핑 실패: user_id=${user.user_id}, pain_area_id=${painArea.pain_area_id} (${tu.email})`, e.code || e.message);
    }

    // 해당 부위의 모든 증상 매핑
    const areaSymptoms = symptomsByPainArea[Number(painArea.pain_area_id)] || [];
    for (const symptom of areaSymptoms) {
      try {
        await prisma.user_symptoms.create({
          data: {
            user_id: user.user_id,
            symptom_id: symptom.symptom_id,
          },
        });
      } catch (e) {
        console.warn(`[seed-extra.js] user_symptoms 매핑 실패: user_id=${user.user_id}, symptom_id=${symptom.symptom_id} (${tu.email})`, e.code || e.message);
      }
    }

    // 약관 동의
    const now = new Date();
    try {
      await prisma.user_agreements.createMany({
        data: [
          { user_id: user.user_id, agreement_type: 'TOS', agreed_at: now },
          { user_id: user.user_id, agreement_type: 'PRIVACY', agreed_at: now },
          { user_id: user.user_id, agreement_type: 'LOCATION', agreed_at: now },
        ],
        skipDuplicates: true,
      });
    } catch (e) {
      console.warn(`[seed-extra.js] user_agreements 매핑 실패: user_id=${user.user_id} (${tu.email})`, e.code || e.message);
    }

    console.log(`${tu.email} 처리 완료 (${tu.painArea}, 증상 ${areaSymptoms.length}개, 약관동의)`);
  }

  // ============================
  // 결과 요약
  // ============================
  const totalUsers = await prisma.users.count();
  const totalUPA = await prisma.user_pain_areas.count();
  const totalUS = await prisma.user_symptoms.count();
  const totalUA = await prisma.user_agreements.count();
  const totalVideos = await prisma.lifestyle_videos.count();
  const totalSteps = await prisma.symptom_steps.count();

  console.log('\n=== 최종 현황 ===');
  console.log(`users: ${totalUsers}`);
  console.log(`user_pain_areas: ${totalUPA}`);
  console.log(`user_symptoms: ${totalUS}`);
  console.log(`user_agreements: ${totalUA}`);
  console.log(`lifestyle_videos: ${totalVideos}`);
  console.log(`symptom_steps: ${totalSteps}`);

  console.log('\n=== 테스트 계정 로그인 정보 ===');
  console.log('비밀번호: Password1! (모든 테스트 계정 동일)');
  console.log('- seed.user@example.com (어깨)');
  console.log('- back@test.com (허리)');
  console.log('- knee@test.com (무릎)');
  console.log('- neck@test.com (목)');
  console.log('- headache@test.com (두통)');
  console.log('- abdomen@test.com (복통)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
