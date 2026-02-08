import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Clean up existing seed data (order matters due to FK constraints)
  await prisma.user_symptoms.deleteMany();
  await prisma.user_pain_areas.deleteMany();
  await prisma.temporary_care_guides.deleteMany();
  await prisma.usage_guides.deleteMany();
  await prisma.symptom_steps.deleteMany();
  await prisma.pain_area_specialties.deleteMany();
  await prisma.hospital_symptoms.deleteMany();
  await prisma.lifestyle_videos.deleteMany();
  await prisma.expert_answers.deleteMany();
  await prisma.content_sections.deleteMany();
  await prisma.symptoms.deleteMany();
  await prisma.pain_areas.deleteMany();
  await prisma.users.deleteMany();

  // Auto increment 초기화
  await prisma.$executeRaw`ALTER TABLE pain_areas AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE users AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE symptoms AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE expert_answers AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE pain_area_specialties AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE temporary_care_guides AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE content_sections AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE usage_guides AUTO_INCREMENT = 1`;

  // 2. 기본 유저 및 pain_areas 생성
  const hashedPassword = await bcrypt.hash('Password1!', 10);
  const user = await prisma.users.create({
    data: {
      name: 'Seed User',
      email: 'seed.user@example.com',
      password: hashedPassword,
      birth: new Date('1990-01-01'),
      gender: 'OTHER'
    }
  });

  // Pain areas (중복 생성 방지, 한 번만 생성)
  const painAreas = [
    { name: '어깨' },
    { name: '허리' },
    { name: '무릎' },
    { name: '목' },
    { name: '두통' },
    { name: '복통' },
  ];
  const createdPainAreas = {};
  for (const area of painAreas) {
    const pa = await prisma.pain_areas.create({ data: { name: area.name } });
    createdPainAreas[area.name] = pa;
  }
  // 미선택 pain_area (ID = 8)
  await prisma.$executeRaw`ALTER TABLE pain_areas AUTO_INCREMENT = 8`;
  const noPainArea = await prisma.pain_areas.create({ data: { name: '미선택' } });
  createdPainAreas['미선택'] = noPainArea;


  // 3. Pain area specialties mapping
  // ...existing code for pain_area_specialties...

  // 4. 증상 데이터 생성 (pain_areas별 기본 증상)
  // 각 pain_area별로 3개 증상 생성
  const symptomTemplates = {
    '어깨': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '허리': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '무릎': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '목': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '두통': ['조이는 듯한 두통', '욱신거리는 두통', '한쪽으로 심한 두통'],
    '복통': ['쥐어짜는 듯한 복통', '콕콕 찌르는 복통', '더부룩한 복통'],
  };
  for (const [area, symptomNames] of Object.entries(symptomTemplates)) {
    const pa = createdPainAreas[area];
    if (!pa) continue;
    for (const name of symptomNames) {
      await prisma.symptoms.create({ data: { pain_area_id: pa.pain_area_id, name } });
    }
  }

  // 5. lifestyle_videos (증상별 2개, 중복 방지)
  // (증상 생성 이후에 반드시 실행)
  const allSymptomsList2 = await prisma.symptoms.findMany({ select: { symptom_id: true, name: true, pain_area_id: true }, orderBy: { symptom_id: 'asc' } });
  const painAreasDb = await prisma.pain_areas.findMany({ orderBy: { pain_area_id: 'asc' } });
  const painAreaMap = Object.fromEntries(painAreasDb.map((pa) => [Number(pa.pain_area_id), pa.name]));
  const existingVideos = await prisma.lifestyle_videos.count();
  if (existingVideos === 0) {
    const videoData = [];
    let displayOrder = 1;
    for (const symptom of allSymptomsList2) {
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

  // 6. symptom_steps (증상별 3단계, 중복 방지)
  const existingSteps = await prisma.symptom_steps.count();
  if (existingSteps === 0) {
    await prisma.symptom_steps.deleteMany();
    const stepData = [];
    for (const symptom of allSymptomsList2) {
      if (!symptom.symptom_id || !symptom.pain_area_id) continue;
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
    if (uniqueStepData.length > 0) {
      await prisma.symptom_steps.createMany({ data: uniqueStepData });
      console.log(`symptom_steps ${uniqueStepData.length}건 삽입 완료`);
    } else {
      console.error('[seed.js] symptom_steps에 삽입할 데이터가 없습니다. 증상 데이터 확인 필요.');
    }
  } else {
    console.log(`symptom_steps 이미 ${existingSteps}건 존재, 건너뜀`);
  }

  // 7. temporary_care_guides (pain_area별 3개 미만이면 추가)
  // ...기존 temporary_care_guides 생성 코드...

  // 8. content_sections, usage_guides, expert_answers 등 기타 생성
  // ...기존 코드...

  // 9. Seed User/테스트 유저 생성 및 매핑
  // ...기존 코드...

  // 10. badges, notes, cautions, helps 등 기타 보조 데이터 생성
  // ...기존 코드...



  // 3) temporary_care_guides 보강 (pain_area별 3개 미만이면 추가)
  const existingGuides = await prisma.temporary_care_guides.findMany({ select: { pain_area_id: true, title: true, display_order: true } });
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
  for (const painArea of painAreasDb) {
    const painAreaKey = Number(painArea.pain_area_id);
    let existingCount = guideCounts.get(painAreaKey) || 0;
    let nextOrder = (guideMaxOrder.get(painAreaKey) || 0) + 1;
    const titles = guideTitles.get(painAreaKey) || new Set();
    for (const template of guideTemplates) {
      if (existingCount >= 3) break;
      const title = template.title(painArea.name);
      if (titles.has(title)) continue;
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

  // 4) 각 임시 가이드별 badge/note/caution/help 더미 데이터 생성
  const allGuides = await prisma.temporary_care_guides.findMany({ select: { guide_id: true, pain_area_id: true, title: true } });
  for (const guide of allGuides) {
    const painAreaName = painAreaMap[Number(guide.pain_area_id)] || '통증 부위';
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
    await prisma.badges.createMany({
      data: [
        { guide_id: guide.guide_id, text: `${painAreaName} · 스트레칭/찜질` },
        { guide_id: guide.guide_id, text: '평균 소요 시간 10분' },
      ],
      skipDuplicates: true,
    });
    await prisma.notes.createMany({
      data: [
        { guide_id: guide.guide_id, image_url: 'http://image1.png', bold: `${painAreaName}를 천천히`, text: `${painAreaName} 부위를 천천히 움직이며 작은 범위로 시작해 점차 넓혀보세요.` },
        { guide_id: guide.guide_id, image_url: 'http://image2.png', bold: '무리하지 않기', text: '통증이 심해지면 즉시 중단하세요.' },
        { guide_id: guide.guide_id, image_url: 'http://image3.png', bold: '호흡 유지', text: '스트레칭 중에는 천천히 호흡을 유지하세요.' },
      ],
      skipDuplicates: true,
    });
    await prisma.cautions.createMany({
      data: [
        { guide_id: guide.guide_id, icon_url: 'http://icon1.png', bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있으니 전문가 상담을 권장합니다.' },
        { guide_id: guide.guide_id, icon_url: 'http://icon2.png', bold: '관절 움직임 제한', text: '팔을 들기 어렵거나 움직임이 제한된다면 병원 진료가 필요합니다.' },
        { guide_id: guide.guide_id, icon_url: 'http://icon3.png', bold: '야간 통증', text: '수면 중 통증이 심하다면 염증이나 구조적 문제일 수 있습니다.' },
      ],
      skipDuplicates: true,
    });
    await prisma.helps.createMany({
      data: [
        { guide_id: guide.guide_id, text: '오랜 시간 앉아 있거나 같은 자세를 유지할 때' },
        { guide_id: guide.guide_id, text: `${painAreaName} 주변 근육에 긴장이 쌓였을 때` },
        { guide_id: guide.guide_id, text: `${painAreaName}의 가동 범위가 줄어든 것처럼 느껴질 때` },
      ],
      skipDuplicates: true,
    });
  }

  // 5) expert_answers 보강 (증상별 최소 1개, pain_area별 최소 3개)
  const existingAnswers = await prisma.expert_answers.findMany({ select: { answer_id: true, symptom_id: true, symptoms: { select: { pain_area_id: true } } } });
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
  for (const symptom of allSymptomsList2) {
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
    plannedPainAreaCounts.set(painAreaKey, (plannedPainAreaCounts.get(painAreaKey) || 0) + 1);
  }
  for (const painArea of painAreasDb) {
    const painAreaKey = Number(painArea.pain_area_id);
    let currentCount = plannedPainAreaCounts.get(painAreaKey) || 0;
    const pool = allSymptomsList2.filter((s) => Number(s.pain_area_id) === painAreaKey);
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

  // 6) Seed User 증상/약관 보강 (upsert)
  const seedUser = await prisma.users.findFirst({ orderBy: { user_id: 'asc' } });
  if (seedUser) {
    const shoulderPainArea = painAreasDb.find((pa) => pa.name === '어깨');
    if (shoulderPainArea) {
      const shoulderSymptoms = allSymptomsList2.filter((s) => s.pain_area_id === shoulderPainArea.pain_area_id);
      for (const symptom of shoulderSymptoms) {
        await prisma.user_symptoms.upsert({
          where: { user_id_symptom_id: { user_id: seedUser.user_id, symptom_id: symptom.symptom_id } },
          update: {},
          create: { user_id: seedUser.user_id, symptom_id: symptom.symptom_id },
        });
      }
      console.log(`Seed User(${seedUser.email}): 어깨 증상 ${shoulderSymptoms.length}개 매핑 완료`);
    }
    const now = new Date();
    for (const type of ['TOS', 'PRIVACY', 'LOCATION']) {
      await prisma.user_agreements.upsert({
        where: { user_id_agreement_type: { user_id: seedUser.user_id, agreement_type: type } },
        update: { agreed_at: now },
        create: { user_id: seedUser.user_id, agreement_type: type, agreed_at: now },
      });
    }
    console.log(`Seed User(${seedUser.email}): 약관동의 완료`);
  }

  // 7) 테스트 유저 증상/약관 보강 (upsert)
  for (const tu of [
    { name: '허리유저', email: 'back@test.com', painArea: '허리' },
    { name: '무릎유저', email: 'knee@test.com', painArea: '무릎' },
    { name: '목유저', email: 'neck@test.com', painArea: '목' },
    { name: '두통유저', email: 'headache@test.com', painArea: '두통' },
    { name: '복통유저', email: 'abdomen@test.com', painArea: '복통' },
  ]) {
    let user = await prisma.users.findUnique({ where: { email: tu.email } });
    if (!user) continue;
    const painArea = painAreasDb.find((pa) => pa.name === tu.painArea);
    if (!painArea) continue;
    const areaSymptoms = allSymptomsList2.filter((s) => s.pain_area_id === painArea.pain_area_id);
    for (const symptom of areaSymptoms) {
      await prisma.user_symptoms.upsert({
        where: { user_id_symptom_id: { user_id: user.user_id, symptom_id: symptom.symptom_id } },
        update: {},
        create: { user_id: user.user_id, symptom_id: symptom.symptom_id },
      });
    }
    const now = new Date();
    for (const type of ['TOS', 'PRIVACY', 'LOCATION']) {
      await prisma.user_agreements.upsert({
        where: { user_id_agreement_type: { user_id: user.user_id, agreement_type: type } },
        update: { agreed_at: now },
        create: { user_id: user.user_id, agreement_type: type, agreed_at: now },
      });
    }
    console.log(`${tu.email} 증상/약관 보강 완료`);
  }

    // Pain area specialties mapping
    
  const painAreaSpecialties = [
    // 어깨 (1)
    { pain_area_id: 1, specialty_keyword: '정형외과' },
    { pain_area_id: 1, specialty_keyword: '재활의학과' },
    { pain_area_id: 1, specialty_keyword: '통증의학과' },
    { pain_area_id: 1, specialty_keyword: '마취통증' },
    { pain_area_id: 1, specialty_keyword: '통증' },
    { pain_area_id: 1, specialty_keyword: '어깨' },
    { pain_area_id: 1, specialty_keyword: '관절' },
    { pain_area_id: 1, specialty_keyword: '정형' },

    // 허리 (2)
    { pain_area_id: 2, specialty_keyword: '정형외과' },
    { pain_area_id: 2, specialty_keyword: '재활의학과' },
    { pain_area_id: 2, specialty_keyword: '신경외과' },
    { pain_area_id: 2, specialty_keyword: '통증의학과' },
    { pain_area_id: 2, specialty_keyword: '마취통증' },
    { pain_area_id: 2, specialty_keyword: '척추' },
    { pain_area_id: 2, specialty_keyword: '통증' },
    { pain_area_id: 2, specialty_keyword: '정형' },
    { pain_area_id: 2, specialty_keyword: '허리' },

    // 무릎 (3)
    { pain_area_id: 3, specialty_keyword: '정형외과' },
    { pain_area_id: 3, specialty_keyword: '재활의학과' },
    { pain_area_id: 3, specialty_keyword: '통증의학과' },
    { pain_area_id: 3, specialty_keyword: '관절' },
    { pain_area_id: 3, specialty_keyword: '류마티스' },
    { pain_area_id: 3, specialty_keyword: '통증' },
    { pain_area_id: 3, specialty_keyword: '정형' },
    { pain_area_id: 3, specialty_keyword: '무릎' },

    // 목 (4)
    { pain_area_id: 4, specialty_keyword: '정형외과' },
    { pain_area_id: 4, specialty_keyword: '재활의학과' },
    { pain_area_id: 4, specialty_keyword: '신경외과' },
    { pain_area_id: 4, specialty_keyword: '통증의학과' },
    { pain_area_id: 4, specialty_keyword: '마취통증' },
    { pain_area_id: 4, specialty_keyword: '척추' },
    { pain_area_id: 4, specialty_keyword: '통증' },
    { pain_area_id: 4, specialty_keyword: '정형' },

    // 두통 (5)
    { pain_area_id: 5, specialty_keyword: '신경과' },
    { pain_area_id: 5, specialty_keyword: '신경외과' },
    { pain_area_id: 5, specialty_keyword: '내과' },
    { pain_area_id: 5, specialty_keyword: '통증의학과' },
    { pain_area_id: 5, specialty_keyword: '두통' },
    { pain_area_id: 5, specialty_keyword: '뇌' },
    { pain_area_id: 5, specialty_keyword: '신경' },
    { pain_area_id: 5, specialty_keyword: '통증' },

    // 복통 (6)
    { pain_area_id: 6, specialty_keyword: '내과' },
    { pain_area_id: 6, specialty_keyword: '소화기내과' },
    { pain_area_id: 6, specialty_keyword: '소화기' },
    { pain_area_id: 6, specialty_keyword: '외과' },
    { pain_area_id: 6, specialty_keyword: '가정의학과' },
    { pain_area_id: 6, specialty_keyword: '위장' },
    { pain_area_id: 6, specialty_keyword: '대장' },
    { pain_area_id: 6, specialty_keyword: '항문' },
  ];

  // pain_areas 이름으로 ID 매핑
  const painAreaIdMap = {
    1: createdPainAreas['어깨'].pain_area_id,
    2: createdPainAreas['허리'].pain_area_id,
    3: createdPainAreas['무릎'].pain_area_id,
    4: createdPainAreas['목'].pain_area_id,
    5: createdPainAreas['두통'].pain_area_id,
    6: createdPainAreas['복통'].pain_area_id,
  };

// pain_area_specialties 삽입
  for (const data of painAreaSpecialties) {
    await prisma.pain_area_specialties.create({
      data: {
        pain_area_id: painAreaIdMap[data.pain_area_id],  // ✅ 실제 ID 사용
        specialty_keyword: data.specialty_keyword,
      },
    });
  }
  console.log('pain_area_specialties 데이터 삽입 완료');

  // Use shoulder for symptom examples
  const shoulder = createdPainAreas['어깨'];
  const back = createdPainAreas['허리'];
  const neck = createdPainAreas['목'];
  const knee = createdPainAreas['무릎'];
  const headache = createdPainAreas['두통'];
  const abdomen = createdPainAreas['복통'];

  // Create symptoms for each pain area
  const shoulderSymptoms = [
    await prisma.symptoms.create({ data: { pain_area_id: shoulder.pain_area_id, name: '뻐근함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: shoulder.pain_area_id, name: '찌릿함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: shoulder.pain_area_id, name: '움직일 때 통증' } }),
  ];

  const backSymptoms = [
    await prisma.symptoms.create({ data: { pain_area_id: back.pain_area_id, name: '뻐근함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: back.pain_area_id, name: '찌릿함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: back.pain_area_id, name: '움직일 때 통증' } }),
  ];

  const neckSymptoms = [
    await prisma.symptoms.create({ data: { pain_area_id: neck.pain_area_id, name: '뻐근함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: neck.pain_area_id, name: '찌릿함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: neck.pain_area_id, name: '움직일 때 통증' } }),
  ];

  const kneeSymptoms = [
    await prisma.symptoms.create({ data: { pain_area_id: knee.pain_area_id, name: '뻐근함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: knee.pain_area_id, name: '찌릿함' } }),
    await prisma.symptoms.create({ data: { pain_area_id: knee.pain_area_id, name: '움직일 때 통증' } }),
  ];

  const headacheSymptoms = [
    await prisma.symptoms.create({ data: { pain_area_id: headache.pain_area_id, name: '조이는 듯한 두통' } }),
    await prisma.symptoms.create({ data: { pain_area_id: headache.pain_area_id, name: '욱신거리는 두통' } }),
    await prisma.symptoms.create({ data: { pain_area_id: headache.pain_area_id, name: '한쪽으로 심한 두통' } }),
  ];

  const abdomenSymptoms = [
    await prisma.symptoms.create({ data: { pain_area_id: abdomen.pain_area_id, name: '쥐어짜는 듯한 복통' } }),
    await prisma.symptoms.create({ data: { pain_area_id: abdomen.pain_area_id, name: '콕콕 찌르는 복통' } }),
    await prisma.symptoms.create({ data: { pain_area_id: abdomen.pain_area_id, name: '더부룩한 복통' } }),
  ];

  // User-Pain Areas 매핑 (사용자가 선택한 통증 부위)
  await prisma.user_pain_areas.createMany({
    data: [
      { user_id: user.user_id, pain_area_id: shoulder.pain_area_id },
    ]
  });

  // User-Symptoms 매핑 (사용자가 선택한 증상)
  await prisma.user_symptoms.createMany({
    data: [
      { user_id: user.user_id, symptom_id: shoulderSymptoms[0].symptom_id },  // 어깨 뻐근함
    ]
  });

  // Temporary care guides
  await prisma.temporary_care_guides.createMany({
    data: [
      // 어깨
      {
        pain_area_id: shoulder.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '어깨 스트레칭 방법',
        content: '목과 어깨를 부드럽게 스트레칭하여 근육의 긴장을 완화하세요.',
        image_url: 'https://example.com/guides/shoulder-01.jpg'
      },
      {
        pain_area_id: shoulder.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '어깨 온찜질/냉찜질',
        content: '급성 통증에는 냉찜질을, 만성 통증에는 온찜질을 시도해보세요.',
        image_url: 'https://example.com/guides/shoulder-02.jpg'
      },
      {
        pain_area_id: shoulder.pain_area_id,
        guide_type: '생활 습관',
        title: '올바른 자세 유지',
        content: '책상에 앉을 때 어깨를 펴고 목을 세워 자세를 유지하세요.',
        image_url: 'https://example.com/guides/shoulder-03.jpg'
      },
      // 허리
      {
        pain_area_id: back.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '허리 스트레칭 방법',
        content: '누워서 무릎을 가슴으로 당겨 허리 근육을 스트레칭하세요.',
        image_url: 'https://example.com/guides/back-01.jpg'
      },
      {
        pain_area_id: back.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '허리 온찜질',
        content: '온열 패드를 사용하여 허리 근육의 긴장을 풀어보세요.',
        image_url: 'https://example.com/guides/back-02.jpg'
      },
      {
        pain_area_id: back.pain_area_id,
        guide_type: '생활 습관',
        title: '코어 강화 운동',
        content: '복부와 등 근육을 강화하는 가벼운 운동을 꾸준히 하세요.',
        image_url: 'https://example.com/guides/back-03.jpg'
      },
      // 목
      {
        pain_area_id: neck.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '목 스트레칭',
        content: '목을 천천히 돌리고 옆으로 숙여 목 근육을 이완하세요.',
        image_url: 'https://example.com/guides/neck-01.jpg'
      },
      {
        pain_area_id: neck.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '목 온찜질',
        content: '온타올을 목에 대어 근육의 긴장을 완화하세요.',
        image_url: 'https://example.com/guides/neck-02.jpg'
      },
      {
        pain_area_id: neck.pain_area_id,
        guide_type: '생활 습관',
        title: '거북목 자세 교정',
        content: '모니터 높이를 눈높이에 맞추고 정기적으로 휴식을 취하세요.',
        image_url: 'https://example.com/guides/neck-03.jpg'
      },
      // 무릎
      {
        pain_area_id: knee.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '무릎 스트레칭',
        content: '다리를 쭉 펴고 종아리를 마사지하며 무릎 주변 근육을 풀어주세요.',
        image_url: 'https://example.com/guides/knee-01.jpg'
      },
      {
        pain_area_id: knee.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '무릎 냉찜질',
        content: '급성 부종이 있을 때는 냉찜질을 15-20분 정도 시행하세요.',
        image_url: 'https://example.com/guides/knee-02.jpg'
      },
      {
        pain_area_id: knee.pain_area_id,
        guide_type: '생활 습관',
        title: '무릎 부하 줄이기',
        content: '계단보다는 엘리베이터를 이용하고, 무리한 운동을 피하세요.',
        image_url: 'https://example.com/guides/knee-03.jpg'
      },
      // 두통
      {
        pain_area_id: headache.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '두피 마사지',
        content: '머리와 목 부분을 부드럽게 마사지하여 혈액 순환을 개선하세요.',
        image_url: 'https://example.com/guides/headache-01.jpg'
      },
      {
        pain_area_id: headache.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '목 근육 이완',
        content: '목과 어깨 근육이 경직되면 두통이 악화될 수 있습니다. 스트레칭을 시도하세요.',
        image_url: 'https://example.com/guides/headache-02.jpg'
      },
      {
        pain_area_id: headache.pain_area_id,
        guide_type: '생활 습관',
        title: '스트레스 관리',
        content: '충분한 수분을 섭취하고 명상으로 스트레스를 관리하세요.',
        image_url: 'https://example.com/guides/headache-03.jpg'
      },
      // 복통
      {
        pain_area_id: abdomen.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '복부 온찜질',
        content: '온찜질 팩을 복부에 대어 장의 운동을 촉진하세요.',
        image_url: 'https://example.com/guides/abdomen-01.jpg'
      },
      {
        pain_area_id: abdomen.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '복부 마사지',
        content: '시계 방향으로 복부를 부드럽게 원형 마사지하세요.',
        image_url: 'https://example.com/guides/abdomen-02.jpg'
      },
      {
        pain_area_id: abdomen.pain_area_id,
        guide_type: '생활 습관',
        title: '식이 조절',
        content: '소화가 잘 되는 음식을 섭취하고 규칙적으로 운동하세요.',
        image_url: 'https://example.com/guides/abdomen-03.jpg'
      },
    ]
  });

  // Content sections (banners)
  await prisma.content_sections.createMany({
    data: [
      { section_type: 'banner', title: '어깨 통증 관리법', content: '', image_url: 'https://example.com/banners/shoulder.webp', display_order: 1 },
      { section_type: 'banner', title: '허리 건강 유지하기', content: '', image_url: 'https://example.com/banners/back.webp', display_order: 2 },
      { section_type: 'banner', title: '목 통증 완화 방법', content: '', image_url: 'https://example.com/banners/neck.webp', display_order: 3 },
      { section_type: 'banner', title: '무릎을 지키는 생활 습관', content: '', image_url: 'https://example.com/banners/knee.webp', display_order: 4 },
      { section_type: 'banner', title: '두통 예방과 대처법', content: '', image_url: 'https://example.com/banners/headache.webp', display_order: 5 },
      { section_type: 'banner', title: '소화 건강 관리', content: '', image_url: 'https://example.com/banners/abdomen.webp', display_order: 6 }
    ]
  });

  // Usage guides
  await prisma.usage_guides.createMany({
    data: [
      { card_number: 1, title: '통증 부위 선택', modal_content: '먼저 통증이 있는 부위를 선택하세요. 어깨, 허리, 목, 무릎, 두통, 복통 중에서 선택할 수 있습니다.', image_url: 'https://example.com/banners/01.webp' },
      { card_number: 2, title: '증상 확인', modal_content: '선택한 부위의 세부 증상을 확인할 수 있습니다. 자신의 증상과 가장 유사한 것을 선택해보세요.', image_url: 'https://example.com/banners/02.webp' },
      { card_number: 3, title: '임시 대처법 확인', modal_content: '증상에 맞는 스트레칭, 찜질, 생활 습관 개선법 등의 임시 대처 방법을 확인할 수 있습니다.', image_url: 'https://example.com/banners/03.webp' }
    ]
  });

  // Doctor answers (expert_answers) - 모든 증상을 위한 답변
  const allSymptoms = [
    ...shoulderSymptoms,
    ...backSymptoms,
    ...neckSymptoms,
    ...kneeSymptoms,
    ...headacheSymptoms,
    ...abdomenSymptoms
  ];

  const answerData = allSymptoms.map((symptom, index) => ({
    symptom_id: symptom.symptom_id,
    summary: `${symptom.name} 증상은 다양한 원인으로 인해 발생할 수 있습니다. 적절한 휴식과 스트레칭으로 개선할 수 있습니다.`,
    full_content: `${symptom.name} 증상에 대한 전문의 진료 기록입니다.\n\n원인:\n- 잘못된 자세 유지\n- 근육 피로\n- 염증성 질환\n\n치료 방법:\n1. 물리 치료\n2. 스트레칭 운동\n3. 약물 치료\n4. 생활 습관 개선\n\n예방:\n- 정기적인 운동\n- 올바른 자세 유지\n- 스트레스 관리\n- 충분한 휴식`,
    source_url: `https://example.com/treatments/${index + 1}`
  }));

  await prisma.expert_answers.createMany({
    data: answerData
  });

  console.log('Doctor answers seeded.');

  // ============================
  // 부위별 테스트 유저 생성 (seed-extra.js 통합)
  // ============================
  const testUsers = [
    { name: '허리유저', email: 'back@test.com', painArea: '허리' },
    { name: '무릎유저', email: 'knee@test.com', painArea: '무릎' },
    { name: '목유저', email: 'neck@test.com', painArea: '목' },
    { name: '두통유저', email: 'headache@test.com', painArea: '두통' },
    { name: '복통유저', email: 'abdomen@test.com', painArea: '복통' },
  ];

  // painAreas, symptoms, symptomsByPainArea, hashedPassword는 이미 위에서 생성됨
  // symptomsByPainArea 생성
  const allSymptomsList = await prisma.symptoms.findMany({ select: { symptom_id: true, name: true, pain_area_id: true }, orderBy: { symptom_id: 'asc' } });
  const symptomsByPainArea = {};
  for (const s of allSymptomsList) {
    const key = Number(s.pain_area_id);
    if (!symptomsByPainArea[key]) symptomsByPainArea[key] = [];
    symptomsByPainArea[key].push(s);
  }

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
    const painArea = Object.values(createdPainAreas).find((pa) => pa.name === tu.painArea);
    if (!painArea) {
      console.warn(`[seed.js] ${tu.painArea} painArea 없음, ${tu.email} 매핑 건너뜀`);
      continue;
    }

    // user_pain_areas 매핑
    try {
      await prisma.user_pain_areas.create({
        data: {
          user_id: user.user_id,
          pain_area_id: painArea.pain_area_id,
        },
      });
    } catch (e) {
      console.warn(`[seed.js] user_pain_areas 매핑 실패: user_id=${user.user_id}, pain_area_id=${painArea.pain_area_id} (${tu.email})`, e.code || e.message);
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
        console.warn(`[seed.js] user_symptoms 매핑 실패: user_id=${user.user_id}, symptom_id=${symptom.symptom_id} (${tu.email})`, e.code || e.message);
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
      console.warn(`[seed.js] user_agreements 매핑 실패: user_id=${user.user_id} (${tu.email})`, e.code || e.message);
    }

    console.log(`${tu.email} 처리 완료 (${tu.painArea}, 증상 ${areaSymptoms.length}개, 약관동의)`);
  }

  console.log('Seed data created.');

  // ...existing code...
  
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
