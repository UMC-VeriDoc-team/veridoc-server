import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const S3_BASE = "https://veridoc-storage.s3.ap-northeast-2.amazonaws.com/Veridoc_pic";

async function main() {
  // ============================
  // 1. Full DB truncate (FK 순서 고려)
  // ============================
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE symptom_guide_events`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE symptom_guide_progress`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE user_agreements`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE user_symptoms`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE user_pain_areas`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE helps`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE cautions`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE notes`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE badges`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE temporary_care_guides`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE usage_guides`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE symptom_steps`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE pain_area_specialties`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE hospital_symptoms`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE lifestyle_videos`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE expert_answers`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE content_sections`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE symptoms`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE pain_areas`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE users`);
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);

  // Auto increment 초기화
  await prisma.$executeRaw`ALTER TABLE pain_areas AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE users AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE symptoms AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE expert_answers AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE pain_area_specialties AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE temporary_care_guides AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE content_sections AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE usage_guides AUTO_INCREMENT = 1`;

  // ============================
  // 2. Pain Areas + Symptoms 생성
  // ============================
  const symptomTemplates = {
    '어깨': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '허리': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '무릎': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '목': ['뻐근함', '찌릿함', '움직일 때 통증'],
    '두통': ['조이는 듯한 두통', '욱신거리는 두통', '한쪽으로 심한 두통'],
    '복통': ['쥐어짜는 듯한 복통', '콕콕 찌르는 복통', '더부룩한 복통'],
  };

  const createdPainAreas = {};
  for (const areaName of Object.keys(symptomTemplates)) {
    const pa = await prisma.pain_areas.create({ data: { name: areaName } });
    createdPainAreas[areaName] = pa;
    for (const symptomName of symptomTemplates[areaName]) {
      await prisma.symptoms.create({ data: { pain_area_id: pa.pain_area_id, name: symptomName } });
    }
  }

  // 미선택 pain_area (ID = 8)
  await prisma.$executeRaw`ALTER TABLE pain_areas AUTO_INCREMENT = 8`;
  createdPainAreas['미선택'] = await prisma.pain_areas.create({ data: { name: '미선택' } });

  // ============================
  // 3. DB에서 참조 데이터 조회
  // ============================
  const painAreasDb = await prisma.pain_areas.findMany({ orderBy: { pain_area_id: 'asc' } });
  const allSymptomsList2 = await prisma.symptoms.findMany({
    select: { symptom_id: true, name: true, pain_area_id: true },
    orderBy: { symptom_id: 'asc' },
  });
  const painAreaMap = {};
  for (const pa of painAreasDb) {
    painAreaMap[Number(pa.pain_area_id)] = pa.name;
  }

  console.log(`pain_areas ${painAreasDb.length}건, symptoms ${allSymptomsList2.length}건 생성 완료`);

  // ============================
  // 4. Seed User 생성
  // ============================
  const hashedPassword = await bcrypt.hash('Password1!', 10);
  const seedUser = await prisma.users.create({
    data: {
      name: 'Seed User',
      email: 'seed.user@example.com',
      password: hashedPassword,
      birth: new Date('1990-01-01'),
      gender: 'OTHER',
    },
  });

  // ============================
  // 5. Lifestyle Videos (부위별 1개)
  // ============================
  const lifestyleVideoSeed = [
    {
      pain_area_id: createdPainAreas['어깨'].pain_area_id,
      title: '어깨 스트레칭',
      subtitle: '아래 영상은 어깨 불편 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtube.com/lifestyle/shoulder',
      youtube_title: '어깨가 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: '새움병원',
      description: `이 스트레칭은 근육의 길이와 탄성을 회복시키고, 관절 주변의 움직임을 부드럽게 만들어 목과 어깨에 걸리는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 오랜 시간 고정된 자세로 일하거나 스마트기기를 자주 사용하는 사람에게는, 근육에 쌓인 미세한 긴장을 풀고 재발성 통증을 예방하는 데 의미가 있습니다. 다만 이 스트레칭은 염증이나 신경 손상, 디스크 질환을 직접 치료하는 것은 아니며, 통증이 심하거나 팔 저림, 감각 이상이 동반된다면 전문적인 진료가 필요합니다. 정상적인 근육 긴장과 자세 문제로 인한 목·어깨 불편감이라면, 이 루틴은 일상 속에서 통증을 관리하고 몸의 균형을 되찾는 데 유용한 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['허리'].pain_area_id,
      title: '허리 스트레칭',
      subtitle: '아래 영상은 허리 불편 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtube.com/lifestyle/back',
      youtube_title: '허리가 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: '대찬병원',
      description: `이 스트레칭은 허리 주변 근육과 근막의 긴장을 풀고, 척추와 골반 주위 관절의 움직임을 부드럽게 만들어 허리에 가해지는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 오래 앉아 있거나, 서서 일하는 시간이 길거나, 구부정한 자세로 스마트기기를 자주 사용하는 사람에게는 굽어 있는 요추와 엉덩이 근육을 이완시키고 반복적으로 나타나는 허리 통증을 예방하는 데 의미가 있습니다. 다만 이 스트레칭은 허리 디스크, 신경 압박, 염증성 질환을 직접 치료하는 방법은 아니며, 다리로 뻗치는 통증, 저림, 힘 빠짐 같은 신경 증상이 동반된다면 전문적인 진료가 필요합니다. 자세 불균형이나 근육 긴장으로 인한 일반적인 허리 불편감이라면, 이 루틴은 일상 속에서 통증을 관리하고 허리와 골반의 균형을 회복하는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['무릎'].pain_area_id,
      title: '무릎 스트레칭',
      subtitle: '아래 영상은 무릎 불편 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtube.com/lifestyle/knee',
      youtube_title: '무릎이 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: '서울예스병원',
      description: `이 스트레칭은 무릎 주변 근육(허벅지 앞·뒤, 종아리)의 긴장을 풀고 관절을 지지하는 조직의 유연성과 탄성을 회복시켜 무릎에 가해지는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 오래 서 있거나 많이 걷는 경우, 계단을 자주 오르내리는 생활을 하는 사람에게는 뻣뻣해진 근육과 힘줄을 이완시키고 반복적으로 나타나는 무릎 통증을 완화·예방하는 데 의미가 있습니다. 다만 이 스트레칭은 연골 손상, 인대 파열, 관절염 같은 구조적 문제를 직접 치료하는 것은 아니며, 부기나 열감, 무릎이 꺾이는 느낌, 체중을 실을 수 없을 정도의 통증이 있다면 전문적인 진료가 필요합니다. 근육 긴장이나 사용 과부하로 인한 일반적인 무릎 불편감이라면, 이 루틴은 일상 속에서 관절 부담을 줄이고 무릎의 움직임을 보다 안정적으로 유지하는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['목'].pain_area_id,
      title: '목 스트레칭',
      subtitle: '아래 영상은 목 불편 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtube.com/lifestyle/neck',
      youtube_title: '목이 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: 'CM병원',
      description: `이 스트레칭은 목 주변 근육과 근막의 긴장을 완화하고 경추 관절의 움직임을 부드럽게 만들어 머리와 목에 가해지는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 장시간 컴퓨터나 스마트기기를 사용하는 경우, 고개를 앞으로 내민 자세가 반복되는 사람에게는 짧아지고 굳어진 근육을 이완시키고 반복적으로 나타나는 목 통증과 불편감을 줄이는 데 의미가 있습니다. 다만 이 스트레칭은 디스크나 신경 압박, 염증성 질환을 직접 치료하는 것은 아니며 팔 저림, 감각 이상, 힘 빠짐 같은 신경 증상이 동반된다면 전문적인 진료가 필요합니다. 자세 불균형과 근육 긴장으로 인한 일반적인 목 불편감이라면, 이 루틴은 일상 속에서 통증을 관리하고 목과 어깨의 균형을 회복하는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['두통'].pain_area_id,
      title: '두통 스트레칭',
      subtitle: '아래 영상은 두통 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtube.com/lifestyle/headache',
      youtube_title: '두통으로 불편할 때 가볍게 따라 해볼 수 있는 스트레칭 영상',
      source_name: '국제성모TV',
      description: `이 스트레칭은 머리와 목, 어깨 주변 근육의 긴장을 완화하고 혈류 흐름을 부드럽게 만들어 두통에 기여하는 압박과 당김을 줄이는 데 도움이 될 수 있습니다. 특히 긴 시간 화면을 보거나 스트레스와 수면 부족으로 머리와 목이 굳어 있는 경우, 뭉친 근육을 이완시키고 긴장성 두통이 반복되는 것을 완화·예방하는 데 의미가 있습니다. 다만 이 스트레칭은 편두통이나 신경계 질환, 감각소실은 극심한 두통의 원인을 직접 치료하는 방법은 아니며 시야 이상, 마비, 구토를 동반한 두통이나 이전과 다른 양상의 심한 통증이 있다면 전문적인 진료가 필요합니다. 근육 긴장과 자세 문제로 인한 일반적인 두통이라면, 이 루틴은 일상 속에서 통증을 관리하고 머리와 목의 부담을 줄이는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['복통'].pain_area_id,
      title: '복통 스트레칭',
      subtitle: '아래 영상은 복통 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtube.com/lifestyle/abdomen',
      youtube_title: '복통으로 불편할 때 참고할 수 있는 원인 영상',
      source_name: '건강채널 민트TV',
      description: `이 스트레칭은 복부와 허리, 골반 주변 근육의 긴장을 완화하고 장과 복부 장기의 움직임을 방해하는 압박을 줄여 복부 불편감과 복통을 완화하는 데 도움이 될 수 있습니다. 특히 오래 앉아 있거나 자세가 굽어 있는 상태에서 소화가 더디고 더부룩함이 동반되는 경우, 굳은 복부와 골반 근육을 이완시키고 긴장성 복통이나 가스 정체로 인한 통증들을 줄이는 데 의미가 있습니다. 다만 이 스트레칭은 위장관 질환, 염증, 장폐색, 충수염과 같은 급성 복통의 원인을 직접 치료하는 방법은 아니며 심한 통증, 발열, 구토, 피 섞인 변, 통증이 점점 악화되는 경우에는 전문적인 진료가 필요합니다. 근육 긴장이나 일시적인 소화 불균형으로 인한 일반적인 복부 불편감이라면, 이 루틴은 일상 속에서 복부 긴장을 낮추고 통증을 관리하는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
  ];
  await prisma.lifestyle_videos.createMany({ data: lifestyleVideoSeed });
  console.log(`lifestyle_videos ${lifestyleVideoSeed.length}건 삽입 완료`);

  // ============================
  // 6. Symptom Guide Steps (부위별 4단계)
  // ============================
  const stepData = [];
  const stepKeySet = new Set();

  const painAreaFolderMap = {
    '어깨': 'shoulder',
    '허리': 'back',
    '무릎': 'knee',
    '목': 'neck',
    '두통': 'headache',
    '복통': 'stomachache',
  };

  // pain_areas 기준으로 loop (기존 symptom loop 제거)
  for (const painArea of painAreasDb) {
    if (!painArea.pain_area_id) continue;

    const folder = painAreaFolderMap[painArea.name];
    const stepImg = (n) => `${S3_BASE}/symptom-guide/${folder}/${n}.png`;

    const steps = [
      {
        pain_area_id: painArea.pain_area_id,
        step_number: 1,
        title: '불편함을 느낌',
        subtitle: `${painArea.name} 통증을 인식함`,
        caption: `이 단계는 ${painArea.name}에 불편함이나 통증이 있다는 것을 스스로 인식하는 단계예요.`,
        description: `이 단계는 ${painArea.name}에 불편함이나 통증이 있다는 것을 스스로 인식하는 단계예요.
        많은 사람들이 이 시점에서 왜 이런 증상이 생겼는지 궁금해해요.`,
        image_url: stepImg(1),
      },
      {
        pain_area_id: painArea.pain_area_id,
        step_number: 2,
        title: '정보를 찾는 단계',
        subtitle: '증상 원인을 이해함',
        caption: '증상을 이해하는 것이 불안을 줄이는 데 도움이 될 수 있어요.',
        description: `이 단계에서는 ${painArea.name} 통증이 어떤 이유로 생길 수 있는지 전문의 설명을 통해 알아볼 수 있어요. 증상을 이해하는 것이 불안을 줄이는 데 도움이 될 수 있어요.`,
        image_url: stepImg(2),
      },
      {
        pain_area_id: painArea.pain_area_id,
        step_number: 3,
        title: '대처 방법을 참고하는 단계',
        subtitle: '생활 관리/병원 고려',
        caption: '일상에서 참고할 수 있는 관리 방법이나, 병원 방문을 고려해볼 수 있어요.',
        description: `이 단계에서는 일상에서 참고할 수 있는 관리 방법이나, 병원 방문을 고려해볼 수 있어요.`,
        image_url: stepImg(3),
      },
      {
        pain_area_id: painArea.pain_area_id,
        step_number: 4,
        title: '상태를 안정적으로 인지',
        subtitle: '증상 변화를 스스로 느끼고 판단',
        caption: '증상에 대해 알고 있어 이전보다 덜 불안하게 느껴질 수 있어요.',
        description: `증상에 대해 알고 있어 이전보다 덜 불안하게 느껴질 수 있어요. 현재 상태를 지켜보면서, 필요한 경우 병원을 고려할 수 있어요.`,
        image_url: stepImg(4),
      },
    ];

    for (const step of steps) {
      const key = `${step.pain_area_id}_${step.step_number}`;
      if (!stepKeySet.has(key)) {
        stepData.push(step);
        stepKeySet.add(key);
      }
    }
  }
  
  if (stepData.length > 0) {
    await prisma.symptom_steps.createMany({ data: stepData });
    console.log(`symptom_steps ${stepData.length}건 삽입 완료`);
  }

  // ============================
  // 7. Pain Area Specialties
  // ============================
  const painAreaIdMap = {
    1: createdPainAreas['어깨'].pain_area_id,
    2: createdPainAreas['허리'].pain_area_id,
    3: createdPainAreas['무릎'].pain_area_id,
    4: createdPainAreas['목'].pain_area_id,
    5: createdPainAreas['두통'].pain_area_id,
    6: createdPainAreas['복통'].pain_area_id,
  };

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

  for (const data of painAreaSpecialties) {
    await prisma.pain_area_specialties.create({
      data: {
        pain_area_id: painAreaIdMap[data.pain_area_id],
        specialty_keyword: data.specialty_keyword,
      },
    });
  }
  console.log('pain_area_specialties 데이터 삽입 완료');

  // ============================
  // 8. Temporary Care Guides (부위별 3개)
  // ============================
  await prisma.temporary_care_guides.createMany({
    data: [
      // 어깨
      {
        pain_area_id: createdPainAreas['어깨'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '어깨 스트레칭 방법',
        content: '목과 어깨를 부드럽게 스트레칭하여 근육의 긴장을 완화하세요.',
        image_url: `${S3_BASE}/main-home/shoulder/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['어깨'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '어깨 온찜질/냉찜질',
        content: '급성 통증에는 냉찜질을, 만성 통증에는 온찜질을 시도해보세요.',
        image_url: `${S3_BASE}/main-home/shoulder/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['어깨'].pain_area_id,
        guide_type: '생활 습관',
        title: '올바른 자세 유지',
        content: '책상에 앉을 때 어깨를 펴고 목을 세워 자세를 유지하세요.',
        image_url: `${S3_BASE}/main-home/shoulder/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 허리
      {
        pain_area_id: createdPainAreas['허리'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '허리 스트레칭 방법',
        content: '누워서 무릎을 가슴으로 당겨 허리 근육을 스트레칭하세요.',
        image_url: `${S3_BASE}/main-home/back/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['허리'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '허리 온찜질',
        content: '온열 패드를 사용하여 허리 근육의 긴장을 풀어보세요.',
        image_url: `${S3_BASE}/main-home/back/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['허리'].pain_area_id,
        guide_type: '생활 습관',
        title: '코어 강화 운동',
        content: '복부와 등 근육을 강화하는 가벼운 운동을 꾸준히 하세요.',
        image_url: `${S3_BASE}/main-home/back/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 무릎
      {
        pain_area_id: createdPainAreas['무릎'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '무릎 스트레칭',
        content: '다리를 쭉 펴고 종아리를 마사지하며 무릎 주변 근육을 풀어주세요.',
        image_url: `${S3_BASE}/main-home/knee/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['무릎'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '무릎 냉찜질',
        content: '급성 부종이 있을 때는 냉찜질을 15-20분 정도 시행하세요.',
        image_url: `${S3_BASE}/main-home/knee/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['무릎'].pain_area_id,
        guide_type: '생활 습관',
        title: '무릎 부하 줄이기',
        content: '계단보다는 엘리베이터를 이용하고, 무리한 운동을 피하세요.',
        image_url: `${S3_BASE}/main-home/knee/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 목
      {
        pain_area_id: createdPainAreas['목'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '목 스트레칭',
        content: '목을 천천히 돌리고 옆으로 숙여 목 근육을 이완하세요.',
        image_url: `${S3_BASE}/main-home/neck/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['목'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '목 온찜질',
        content: '온타올을 목에 대어 근육의 긴장을 완화하세요.',
        image_url: `${S3_BASE}/main-home/neck/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['목'].pain_area_id,
        guide_type: '생활 습관',
        title: '거북목 자세 교정',
        content: '모니터 높이를 눈높이에 맞추고 정기적으로 휴식을 취하세요.',
        image_url: `${S3_BASE}/main-home/neck/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 두통
      {
        pain_area_id: createdPainAreas['두통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '두피 마사지',
        content: '머리와 목 부분을 부드럽게 마사지하여 혈액 순환을 개선하세요.',
        image_url: `${S3_BASE}/main-home/headache/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['두통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '목 근육 이완',
        content: '목과 어깨 근육이 경직되면 두통이 악화될 수 있습니다. 스트레칭을 시도하세요.',
        image_url: `${S3_BASE}/main-home/headache/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['두통'].pain_area_id,
        guide_type: '생활 습관',
        title: '스트레스 관리',
        content: '충분한 수분을 섭취하고 명상으로 스트레스를 관리하세요.',
        image_url: `${S3_BASE}/main-home/headache/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 복통
      {
        pain_area_id: createdPainAreas['복통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '복부 온찜질',
        content: '온찜질 팩을 복부에 대어 장의 운동을 촉진하세요.',
        image_url: `${S3_BASE}/main-home/stomachache/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['복통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '복부 마사지',
        content: '시계 방향으로 복부를 부드럽게 원형 마사지하세요.',
        image_url: `${S3_BASE}/main-home/stomachache/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['복통'].pain_area_id,
        guide_type: '생활 습관',
        title: '식이 조절',
        content: '소화가 잘 되는 음식을 섭취하고 규칙적으로 운동하세요.',
        image_url: `${S3_BASE}/main-home/stomachache/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
    ],
  });
  console.log('temporary_care_guides 삽입 완료');

  // ============================
  // 9. 각 가이드별 badges / notes / cautions / helps
  // ============================
  const allGuides = await prisma.temporary_care_guides.findMany({
    select: { guide_id: true, pain_area_id: true, title: true, display_order: true },
    orderBy: [{ pain_area_id: 'asc' }, { display_order: 'asc' }],
  });

  // display_order → 가이드 유형 폴더 매핑
  const guideTypeFolders = { 1: 'stretching', 2: 'hot-cold-compress', 3: 'light-daily-activity' };

  for (const guide of allGuides) {
    const painAreaName = painAreaMap[Number(guide.pain_area_id)] || '통증 부위';
    const folder = painAreaFolderMap[painAreaName];
    const guideTypeFolder = guideTypeFolders[guide.display_order] || 'stretching';
    const tcBase = `${S3_BASE}/main-home/${folder}/temporary-care`;

    // duration, subtitle, source 등 업데이트
    let duration = null;
    if (guide.title.includes('스트레칭') || guide.title.includes('찜질') || guide.title.includes('마사지')) {
      duration = '평균 소요 시간 10분';
    } else if (guide.title.includes('생활') || guide.title.includes('자세') || guide.title.includes('코어') || guide.title.includes('스트레스') || guide.title.includes('식이') || guide.title.includes('부하')) {
      duration = '상시';
    } else {
      duration = '약 10분 소요';
    }

    await prisma.temporary_care_guides.update({
      where: { guide_id: guide.guide_id },
      data: {
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
    });

    const notesData = [
      { guide_id: guide.guide_id, image_url: `${tcBase}/icons/${guideTypeFolder}/1.svg`, bold: `${painAreaName}를 천천히`, text: `${painAreaName} 부위를 천천히 움직이며 작은 범위로 시작해 점차 넓혀보세요.` },
      { guide_id: guide.guide_id, image_url: `${tcBase}/icons/${guideTypeFolder}/2.svg`, bold: '무리하지 않기', text: '통증이 심해지면 즉시 중단하세요.' },
    ];
    // 복통의 stretching/hot-cold-compress는 아이콘 2개만 존재
    if (!(folder === 'stomachache' && (guideTypeFolder === 'stretching' || guideTypeFolder === 'hot-cold-compress'))) {
      notesData.push({ guide_id: guide.guide_id, image_url: `${tcBase}/icons/${guideTypeFolder}/3.svg`, bold: '호흡 유지', text: '스트레칭 중에는 천천히 호흡을 유지하세요.' });
    }
    await prisma.notes.createMany({ data: notesData });

    await prisma.cautions.createMany({
      data: [
        { guide_id: guide.guide_id, icon_url: `${tcBase}/icons/warning.svg`, bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있으니 전문가 상담을 권장합니다.' },
        { guide_id: guide.guide_id, icon_url: `${tcBase}/icons/warning.svg`, bold: '관절 움직임 제한', text: '팔을 들기 어렵거나 움직임이 제한된다면 병원 진료가 필요합니다.' },
        { guide_id: guide.guide_id, icon_url: `${tcBase}/icons/warning.svg`, bold: '야간 통증', text: '수면 중 통증이 심하다면 염증이나 구조적 문제일 수 있습니다.' },
      ],
    });

    await prisma.helps.createMany({
      data: [
        { guide_id: guide.guide_id, text: '오랜 시간 앉아 있거나 같은 자세를 유지할 때' },
        { guide_id: guide.guide_id, text: `${painAreaName} 주변 근육에 긴장이 쌓였을 때` },
        { guide_id: guide.guide_id, text: `${painAreaName}의 가동 범위가 줄어든 것처럼 느껴질 때` },
      ],
    });
  }
  console.log('badges / notes / cautions / helps 삽입 완료');

  // ============================
  // 10. Content Sections (배너)
  // ============================
  await prisma.content_sections.createMany({
    data: [
      { section_type: 'banner', title: '어깨 통증 관리법', content: '', image_url: 'https://example.com/banners/shoulder.webp', display_order: 1 },
      { section_type: 'banner', title: '허리 건강 유지하기', content: '', image_url: 'https://example.com/banners/back.webp', display_order: 2 },
      { section_type: 'banner', title: '목 통증 완화 방법', content: '', image_url: 'https://example.com/banners/neck.webp', display_order: 3 },
      { section_type: 'banner', title: '무릎을 지키는 생활 습관', content: '', image_url: 'https://example.com/banners/knee.webp', display_order: 4 },
      { section_type: 'banner', title: '두통 예방과 대처법', content: '', image_url: 'https://example.com/banners/headache.webp', display_order: 5 },
      { section_type: 'banner', title: '소화 건강 관리', content: '', image_url: 'https://example.com/banners/abdomen.webp', display_order: 6 },
    ],
  });

  // ============================
  // 11. Usage Guides
  // ============================
  await prisma.usage_guides.createMany({
    data: [
      { card_number: 1, title: '통증 부위 선택', modal_content: '먼저 통증이 있는 부위를 선택하세요. 어깨, 허리, 목, 무릎, 두통, 복통 중에서 선택할 수 있습니다.', image_url: `${S3_BASE}/main-home/shoulder/main-photo/stiffness.png` },
      { card_number: 2, title: '증상 확인', modal_content: '선택한 부위의 세부 증상을 확인할 수 있습니다. 자신의 증상과 가장 유사한 것을 선택해보세요.', image_url: `${S3_BASE}/main-home/back/main-photo/movement-pain.png` },
      { card_number: 3, title: '임시 대처법 확인', modal_content: '증상에 맞는 스트레칭, 찜질, 생활 습관 개선법 등의 임시 대처 방법을 확인할 수 있습니다.', image_url: `${S3_BASE}/main-home/knee/main-photo/tingling.png` },
    ],
  });
  console.log('content_sections, usage_guides 삽입 완료');

  // ============================
  // 12. Expert Answers (부위별 증상당 1개, 최대 3개/부위)
  // ============================
  const painAreaNames = ['어깨', '허리', '목', '무릎', '두통', '복통'];
  const answerData = [];
  let answerIdx = 1;
  for (const areaName of painAreaNames) {
    const symptoms = allSymptomsList2.filter(
      (s) => Number(s.pain_area_id) === Number(createdPainAreas[areaName].pain_area_id)
    );
    for (let i = 0; i < Math.min(3, symptoms.length); i++) {
      const symptom = symptoms[i];
      answerData.push({
        symptom_id: symptom.symptom_id,
        summary: `${symptom.name} 증상은 다양한 원인으로 인해 발생할 수 있습니다. 적절한 휴식과 스트레칭으로 개선할 수 있습니다.`,
        full_content: `${symptom.name} 증상에 대한 전문의 진료 기록입니다.\n\n원인:\n- 잘못된 자세 유지\n- 근육 피로\n- 염증성 질환\n\n치료 방법:\n1. 물리 치료\n2. 스트레칭 운동\n3. 약물 치료\n4. 생활 습관 개선\n\n예방:\n- 정기적인 운동\n- 올바른 자세 유지\n- 스트레스 관리\n- 충분한 휴식`,
        source_url: `https://example.com/treatments/${answerIdx++}`,
      });
    }
  }
  await prisma.expert_answers.createMany({ data: answerData });
  console.log(`expert_answers ${answerData.length}건 삽입 완료`);

  // ============================
  // 13. Seed User 매핑 (어깨 부위 + 증상 + 약관)
  // ============================
  await prisma.user_pain_areas.create({
    data: {
      user_id: seedUser.user_id,
      pain_area_id: createdPainAreas['어깨'].pain_area_id,
    },
  });

  const shoulderSymptoms = allSymptomsList2.filter(
    (s) => Number(s.pain_area_id) === Number(createdPainAreas['어깨'].pain_area_id)
  );
  if (shoulderSymptoms.length > 0) {
    await prisma.user_symptoms.createMany({
      data: shoulderSymptoms.map((s) => ({
        user_id: seedUser.user_id,
        symptom_id: s.symptom_id,
      })),
      skipDuplicates: true,
    });
  }

  const now = new Date();
  for (const type of ['TOS', 'PRIVACY', 'LOCATION']) {
    await prisma.user_agreements.create({
      data: { user_id: seedUser.user_id, agreement_type: type, agreed_at: now },
    });
  }
  console.log(`Seed User(${seedUser.email}): 어깨 매핑 + 약관동의 완료`);

  // ============================
  // 14. 부위별 테스트 유저 생성 + 매핑
  // ============================
  const testUsers = [
    { name: '허리유저', email: 'back@test.com', painArea: '허리' },
    { name: '무릎유저', email: 'knee@test.com', painArea: '무릎' },
    { name: '목유저', email: 'neck@test.com', painArea: '목' },
    { name: '두통유저', email: 'headache@test.com', painArea: '두통' },
    { name: '복통유저', email: 'abdomen@test.com', painArea: '복통' },
  ];

  for (const tu of testUsers) {
    const testUser = await prisma.users.create({
      data: {
        name: tu.name,
        email: tu.email,
        password: hashedPassword,
        birth: new Date('1995-06-15'),
        gender: 'MALE',
      },
    });

    const painArea = createdPainAreas[tu.painArea];
    if (!painArea) {
      console.warn(`[seed.js] ${tu.painArea} painArea 없음, ${tu.email} 매핑 건너뜀`);
      continue;
    }

    // user_pain_areas 매핑
    await prisma.user_pain_areas.create({
      data: {
        user_id: testUser.user_id,
        pain_area_id: painArea.pain_area_id,
      },
    });

    // 해당 부위의 모든 증상 매핑
    const areaSymptoms = allSymptomsList2.filter(
      (s) => Number(s.pain_area_id) === Number(painArea.pain_area_id)
    );
    if (areaSymptoms.length > 0) {
      await prisma.user_symptoms.createMany({
        data: areaSymptoms.map((s) => ({
          user_id: testUser.user_id,
          symptom_id: s.symptom_id,
        })),
        skipDuplicates: true,
      });
    }

    // 약관 동의
    const agreementNow = new Date();
    await prisma.user_agreements.createMany({
      data: [
        { user_id: testUser.user_id, agreement_type: 'TOS', agreed_at: agreementNow },
        { user_id: testUser.user_id, agreement_type: 'PRIVACY', agreed_at: agreementNow },
        { user_id: testUser.user_id, agreement_type: 'LOCATION', agreed_at: agreementNow },
      ],
    });

    console.log(`${tu.email} 처리 완료 (${tu.painArea}, 증상 ${areaSymptoms.length}개, 약관동의)`);
  }

  // ============================
  // 15. 최종 현황 출력
  // ============================
  const totalSymptoms = await prisma.symptoms.count();
  const totalExpertAnswers = await prisma.expert_answers.count();
  const totalUsers = await prisma.users.count();
  const totalUPA = await prisma.user_pain_areas.count();
  const totalUS = await prisma.user_symptoms.count();
  const totalUA = await prisma.user_agreements.count();
  const totalVideos = await prisma.lifestyle_videos.count();
  const totalSteps = await prisma.symptom_steps.count();
  const totalGuides = await prisma.temporary_care_guides.count();

  console.log('\n=== 최종 현황 ===');
  console.log(`users: ${totalUsers}`);
  console.log(`user_pain_areas: ${totalUPA}`);
  console.log(`user_symptoms: ${totalUS}`);
  console.log(`user_agreements: ${totalUA}`);
  console.log(`lifestyle_videos: ${totalVideos}`);
  console.log(`symptom_steps: ${totalSteps}`);
  console.log(`symptoms: ${totalSymptoms}`);
  console.log(`expert_answers: ${totalExpertAnswers}`);
  console.log(`temporary_care_guides: ${totalGuides}`);

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