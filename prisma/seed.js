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

  const bannerTitles = {
    '어깨': '어깨 통증은 잘못된 자세,\n혹은 회전근개 염증이 주요 원인입니다',
    '허리': '허리 통증은 잘못된 자세로 인한 근육 부담,\n또는 디스크 주변 염증에서 시작되는 경우가 많습니다',
    '무릎': '무릎 통증은 관절 주변 조직의\n염증이나 손상으로 인해 발생할 수 있습니다',
    '목': '목 통증은 목을 지지하는 근육과 인대가 반복적으로 긴장되거나,\n움직임이 제한되면서 불편함이 쌓여 나타날 수 있습니다.',
    '두통': '두통은 근육 긴장, 혈관 변화, 수면 부족 등\n여러 요인이 복합적으로 작용해 나타나는 증상입니다',
    '복통': '복통은 위나 장이 예민해졌을 때, 소화가 원활하지 않을 때,\n또는 일시적인 염증이나 긴장 상태로 인해 발생할 수 있습니다',
  };

  const createdPainAreas = {};
  for (const areaName of Object.keys(symptomTemplates)) {
    const pa = await prisma.pain_areas.create({
      data: { name: areaName, banner_title: bannerTitles[areaName] || null },
    });
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
      youtube_url: 'https://youtu.be/I81IixZqFKY?si=PIDexzuFWH-RPpBJ',
      youtube_title: '어깨가 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: '새움병원',
      description: `이 스트레칭은 근육의 길이와 탄성을 회복시키고, 관절 주변의 움직임을 부드럽게 만들어 목과 어깨에 걸리는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 오랜 시간 고정된 자세로 일하거나 스마트기기를 자주 사용하는 사람에게는, 근육에 쌓인 미세한 긴장을 풀고 재발성 통증을 예방하는 데 의미가 있습니다. 다만 이 스트레칭은 염증이나 신경 손상, 디스크 질환을 직접 치료하는 것은 아니며, 통증이 심하거나 팔 저림, 감각 이상이 동반된다면 전문적인 진료가 필요합니다. 정상적인 근육 긴장과 자세 문제로 인한 목·어깨 불편감이라면, 이 루틴은 일상 속에서 통증을 관리하고 몸의 균형을 되찾는 데 유용한 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['허리'].pain_area_id,
      title: '허리 스트레칭',
      subtitle: '아래 영상은 허리 불편 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtu.be/jJJiR7nNeqQ?si=XipQUybKhDrv-Bnl',
      youtube_title: '허리가 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: '대찬병원',
      description: `이 스트레칭은 허리 주변 근육과 근막의 긴장을 풀고, 척추와 골반 주위 관절의 움직임을 부드럽게 만들어 허리에 가해지는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 오래 앉아 있거나, 서서 일하는 시간이 길거나, 구부정한 자세로 스마트기기를 자주 사용하는 사람에게는 굽어 있는 요추와 엉덩이 근육을 이완시키고 반복적으로 나타나는 허리 통증을 예방하는 데 의미가 있습니다. 다만 이 스트레칭은 허리 디스크, 신경 압박, 염증성 질환을 직접 치료하는 방법은 아니며, 다리로 뻗치는 통증, 저림, 힘 빠짐 같은 신경 증상이 동반된다면 전문적인 진료가 필요합니다. 자세 불균형이나 근육 긴장으로 인한 일반적인 허리 불편감이라면, 이 루틴은 일상 속에서 통증을 관리하고 허리와 골반의 균형을 회복하는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['무릎'].pain_area_id,
      title: '무릎 스트레칭',
      subtitle: '아래 영상은 무릎 불편 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtu.be/C7v5wvKd6Dk?si=TCSORIxacRUSYeMA',
      youtube_title: '무릎이 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: '서울예스병원',
      description: `이 스트레칭은 무릎 주변 근육(허벅지 앞·뒤, 종아리)의 긴장을 풀고 관절을 지지하는 조직의 유연성과 탄성을 회복시켜 무릎에 가해지는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 오래 서 있거나 많이 걷는 경우, 계단을 자주 오르내리는 생활을 하는 사람에게는 뻣뻣해진 근육과 힘줄을 이완시키고 반복적으로 나타나는 무릎 통증을 완화·예방하는 데 의미가 있습니다. 다만 이 스트레칭은 연골 손상, 인대 파열, 관절염 같은 구조적 문제를 직접 치료하는 것은 아니며, 부기나 열감, 무릎이 꺾이는 느낌, 체중을 실을 수 없을 정도의 통증이 있다면 전문적인 진료가 필요합니다. 근육 긴장이나 사용 과부하로 인한 일반적인 무릎 불편감이라면, 이 루틴은 일상 속에서 관절 부담을 줄이고 무릎의 움직임을 보다 안정적으로 유지하는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['목'].pain_area_id,
      title: '목 스트레칭',
      subtitle: '아래 영상은 목 불편 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtu.be/oxTwWYv5Iws?si=7iN5A8Nfiqoe9z8r',
      youtube_title: '목이 뻐근할 때 따라 해볼 수 있는 스트레칭 영상',
      source_name: 'CM병원',
      description: `이 스트레칭은 목 주변 근육과 근막의 긴장을 완화하고 경추 관절의 움직임을 부드럽게 만들어 머리와 목에 가해지는 부담을 줄이는 데 도움이 될 수 있습니다. 특히 장시간 컴퓨터나 스마트기기를 사용하는 경우, 고개를 앞으로 내민 자세가 반복되는 사람에게는 짧아지고 굳어진 근육을 이완시키고 반복적으로 나타나는 목 통증과 불편감을 줄이는 데 의미가 있습니다. 다만 이 스트레칭은 디스크나 신경 압박, 염증성 질환을 직접 치료하는 것은 아니며 팔 저림, 감각 이상, 힘 빠짐 같은 신경 증상이 동반된다면 전문적인 진료가 필요합니다. 자세 불균형과 근육 긴장으로 인한 일반적인 목 불편감이라면, 이 루틴은 일상 속에서 통증을 관리하고 목과 어깨의 균형을 회복하는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['두통'].pain_area_id,
      title: '두통 스트레칭',
      subtitle: '아래 영상은 두통 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtu.be/i4ReOKZJ6qI?si=NhrcQtUFSPmDmdWs',
      youtube_title: '두통으로 불편할 때 가볍게 따라 해볼 수 있는 스트레칭 영상',
      source_name: '국제성모TV',
      description: `이 스트레칭은 머리와 목, 어깨 주변 근육의 긴장을 완화하고 혈류 흐름을 부드럽게 만들어 두통에 기여하는 압박과 당김을 줄이는 데 도움이 될 수 있습니다. 특히 긴 시간 화면을 보거나 스트레스와 수면 부족으로 머리와 목이 굳어 있는 경우, 뭉친 근육을 이완시키고 긴장성 두통이 반복되는 것을 완화·예방하는 데 의미가 있습니다. 다만 이 스트레칭은 편두통이나 신경계 질환, 감각소실은 극심한 두통의 원인을 직접 치료하는 방법은 아니며 시야 이상, 마비, 구토를 동반한 두통이나 이전과 다른 양상의 심한 통증이 있다면 전문적인 진료가 필요합니다. 근육 긴장과 자세 문제로 인한 일반적인 두통이라면, 이 루틴은 일상 속에서 통증을 관리하고 머리와 목의 부담을 줄이는 데 도움이 되는 보조 수단이 될 수 있습니다.`,
    },
    {
      pain_area_id: createdPainAreas['복통'].pain_area_id,
      title: '복통 스트레칭',
      subtitle: '아래 영상은 복통 시 가볍게 참고할 수 있는 스트레칭 예시예요.',
      youtube_url: 'https://youtu.be/Wa_tj6OPB0I?si=KN04vKf8cLqLwOFt',
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
        content: '어깨 통증은 장시간 같은 자세를 유지하거나 근육이 긴장되면서 발생하는 경우가 많습니다. 통증이 심하지 않다면 무리하지 않는 범위에서 가벼운 스트레칭은 근육 긴장을 완화하는 데 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/shoulder/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['어깨'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '통증 부위 온찜질/냉찜질',
        content: '어깨 통증의 상태에 따라 온찜질과 냉찜질을 구분해 사용하는 것이 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/shoulder/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['어깨'].pain_area_id,
        guide_type: '생활 습관',
        title: '가벼운 일상 동작',
        content: '일상생활에서 어깨에 부담을 주는 행동을 줄이는 것만으로도 통증 완화에 도움이 될 수 있습니다. 작은 자세 변화가 어깨 통증 예방에 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/shoulder/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 허리
      {
        pain_area_id: createdPainAreas['허리'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '허리 스트레칭 방법',
        content: '허리 통증은 장시간 같은 자세를 유지하거나 근육이 긴장되면서 발생하는 경우가 많습니다. 통증이 심하지 않다면 무리하지 않는 범위에서 가벼운 스트레칭은 허리 주변 근육의 긴장을 완화하는 데 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/back/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['허리'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '통증 부위 온찜질/냉찜질',
        content: '허리 통증의 상태에 따라 온찜질과 냉찜질을 구분해 사용하는 것이 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/back/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['허리'].pain_area_id,
        guide_type: '생활 습관',
        title: '가벼운 일상 동작',
        content: '일상생활에서 허리에 부담을 주는 행동을 줄이는 것만으로도 통증 완화에 도움이 될 수 있습니다. 작은 자세 변화가 허리 통증 예방에 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/back/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 무릎
      {
        pain_area_id: createdPainAreas['무릎'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '무릎 스트레칭 방법',
        content: '무릎 통증은 장시간 같은 자세를 유지하거나 근육이 긴장되면서 발생하는 경우가 많습니다. 통증이 심하지 않다면 무리하지 않는 범위에서 가벼운 스트레칭은 무릎 주변 근육의 긴장을 완화하는 데 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/knee/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['무릎'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '통증 부위 온찜질/냉찜질',
        content: '무릎 통증의 상태에 따라 온찜질과 냉찜질을 구분해 사용하는 것이 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/knee/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['무릎'].pain_area_id,
        guide_type: '생활 습관',
        title: '가벼운 일상 동작',
        content: '일상생활에서 무릎에 부담을 주는 행동을 줄이는 것만으로도 통증 완화에 도움이 될 수 있습니다. 작은 자세 변화가 무릎 통증 예방에 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/knee/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 목
      {
        pain_area_id: createdPainAreas['목'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '목 스트레칭 방법',
        content: '목 통증은 장시간 스마트폰·컴퓨터 사용, 고개를 숙이는 자세, 긴장된 근육으로 인해 발생하는 경우가 많습니다. 통증이 심하지 않다면 무리하지 않는 범위에서 가벼운 스트레칭은 목과 어깨 주변 근육의 긴장을 완화하는 데 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/neck/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['목'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '통증 부위 온찜질/냉찜질',
        content: '목 통증의 상태에 따라 온찜질과 냉찜질을 구분해 사용하는 것이 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/neck/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['목'].pain_area_id,
        guide_type: '생활 습관',
        title: '가벼운 일상 동작',
        content: '일상생활에서 목에 가해지는 부담을 줄이는 것만으로도 통증 완화와 예방에 도움이 될 수 있습니다. 작은 자세 변화가 목 통증 예방에 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/neck/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 두통
      {
        pain_area_id: createdPainAreas['두통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '두통 스트레칭 방법',
        content: '두통은 장시간 긴장된 자세나 스트레스로 인해 발생하는 경우가 많습니다. 통증이 심하지 않다면 무리하지 않는 범위에서 가벼운 스트레칭은 목과 어깨 주변 근육의 긴장을 완화해 두통 완화에 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/headache/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['두통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '통증 부위 온찜질/냉찜질',
        content: '두통의 상태에 따라 온찜질과 냉찜질을 구분해 사용하는 것이 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/headache/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['두통'].pain_area_id,
        guide_type: '생활 습관',
        title: '가벼운 일상 동작',
        content: '일상생활에서 머리에 가해지는 긴장을 줄이는 것만으로도 두통 완화와 예방에 도움이 될 수 있습니다. 작은 자세 변화가 두통 예방에 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/headache/temporary-care/light-daily-activity.png`,
        display_order: 3,
      },
      // 복통
      {
        pain_area_id: createdPainAreas['복통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '복통 스트레칭 방법',
        content: '복통은 긴장된 복부 근육이나 소화기 불편으로 인해 발생하는 경우가 많습니다. 통증이 심하지 않다면 무리하지 않는 범위에서 가벼운 스트레칭은 복부 주변 근육의 긴장을 완화하는 데 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/stomachache/temporary-care/stretching.png`,
        display_order: 1,
      },
      {
        pain_area_id: createdPainAreas['복통'].pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '통증 부위 온찜질/냉찜질',
        content: '복통의 상태에 따라 온찜질과 냉찜질을 구분해 사용하는 것이 도움이 될 수 있습니다.',
        image_url: `${S3_BASE}/main-home/stomachache/temporary-care/hot-cold-compress.png`,
        display_order: 2,
      },
      {
        pain_area_id: createdPainAreas['복통'].pain_area_id,
        guide_type: '생활 습관',
        title: '가벼운 일상 동작',
        content: '일상생활에서 복부에 가해지는 부담을 줄이는 것만으로도 복통 완화와 예방에 도움이 될 수 있습니다. 작은 자세 변화가 복통 예방에 도움이 될 수 있습니다.',
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

    // display_order별 duration, subtitle, source, highlighter, keyword (피그마 기준)
    const guideMetaByOrder = {
      1: { // 스트레칭
        source_name: '서울아산병원 건강정보',
        duration: '평균 소요 시간 10분',
        keyword: `${painAreaName} · 스트레칭`,
        subtitle: {
          '어깨': '긴장된 어깨 근육을 풀어주는 가벼운 스트레칭',
          '허리': '허리 근육 긴장을 풀어주는 가벼운 스트레칭',
          '무릎': '긴장된 무릎 근육을 풀어주는 가벼운 스트레칭',
          '목': '긴장된 목 주변 근육을 완화하는 가벼운 스트레칭',
          '두통': '머리와 목 주변 긴장을 풀어주는 가벼운 스트레칭',
          '복통': '복부 주변 긴장을 풀어주는 가벼운 스트레칭',
        },
        highlighter: {
          '어깨': '무리하지 않는 선에서, 어깨를 부드럽게 풀어주세요',
          '허리': '무리하지 않는 선에서, 허리를 부드럽게 풀어주세요',
          '무릎': '무리하지 않는 선에서, 무릎을 부드럽게 풀어주세요',
          '목': '무리하지 않는 선에서, 목을 부드럽게 풀어주세요',
          '두통': '무리하지 않는 선에서, 머리와 목을 부드럽게 풀어주세요',
          '복통': '무리하지 않는 선에서, 복부를 부드럽게 풀어주세요',
        },
      },
      2: { // 온찜질/냉찜질
        source_name: '서울대학교병원 N의학정보',
        duration: '평균 소요 시간 15분',
        keyword: `${painAreaName} · 찜질`,
        subtitle: {
          '어깨': '어깨 통증에 맞는 찜질 방법 선택하기',
          '허리': '허리 통증 상태에 따른 찜질 선택',
          '무릎': '무릎 통증에 맞는 찜질 방법 선택하기',
          '목': '목 통증 상태에 따른 찜질 방법 선택하기',
          '두통': '두통 증상에 맞는 찜질 방법 선택하기',
          '복통': '복통 증상에 맞는 찜질 방법 선택하기',
        },
        highlighter: {
          '어깨': '어깨 통증에 맞게 온찜질과 냉찜질을 구분해 사용하세요',
          '허리': '허리 통증에 맞게 온찜질과 냉찜질을 구분해 사용하세요',
          '무릎': '무릎 통증에 맞게 온찜질과 냉찜질을 구분해 사용하세요',
          '목': '목 통증에 맞게 온찜질과 냉찜질을 구분해 사용하세요',
          '두통': '두통 증상에 맞게 온찜질과 냉찜질을 구분해 사용하세요',
          '복통': '복통 증상에 맞게 온찜질과 냉찜질을 구분해 사용하세요',
        },
      },
      3: { // 가벼운 일상 동작
        source_name: '국민건강보험공단 건강정보',
        duration: '평균 소요 시간 1분',
        keyword: '생활 습관',
        subtitle: {
          '어깨': '어깨 부담을 줄이는 일상 속 습관',
          '허리': '허리에 부담을 줄이는 일상 속 습관',
          '무릎': '무릎 부담을 줄이는 일상 속 습관',
          '목': '목에 부담을 줄이는 생활 속 습관',
          '두통': '두통 빈도를 줄이는 일상 속 습관',
          '복통': '복통 빈도를 줄이는 일상 속 습관',
        },
        highlighter: {
          '어깨': '작은 자세 변화로 어깨 부담을 덜어보세요',
          '허리': '작은 자세 변화로 허리 부담을 덜어보세요',
          '무릎': '작은 자세 변화로 무릎 부담을 덜어보세요',
          '목': '작은 자세 변화로 목 부담을 덜어보세요',
          '두통': '작은 생활 습관 변화로 두통을 줄여보세요',
          '복통': '작은 생활 습관 변화로 복통을 줄여보세요',
        },
      },
    };

    const meta = guideMetaByOrder[guide.display_order] || guideMetaByOrder[1];
    const sourceUrlByOrder = {
      1: 'https://www.amc.seoul.kr/asan/healthinfo/main/healthInfoMain.do',
      2: 'https://dept.snuh.org/dept/HPC/module/nList.do?searchWord=A&sortType=&menuId=003012',
      3: 'https://www.nhis.or.kr/nhis/index.do',
    };
    await prisma.temporary_care_guides.update({
      where: { guide_id: guide.guide_id },
      data: {
        subtitle: meta.subtitle[painAreaName] || `${painAreaName} 관련 가이드`,
        source_name: meta.source_name,
        source_url: sourceUrlByOrder[guide.display_order] || sourceUrlByOrder[1],
        highlighter: meta.highlighter[painAreaName] || `${painAreaName} 관련 가이드`,
        duration: meta.duration,
      },
    });

    // display_order별 배지 텍스트 (피그마 기준)
    const badgeMap = {
      1: ['#집·사무실', '#하루 1~2회'],
      2: ['#통증 직후', '#하루 1~2회'],
      3: (() => {
        const areaKeyword = {
          '어깨': '#어깨 압박 완화',
          '허리': '#허리 압박 완화',
          '무릎': '#무릎 압박 완화',
          '목': '#목 통증 완화',
          '두통': '#두통 증상 완화',
          '복통': '#복통 증상 완화',
        };
        return [areaKeyword[painAreaName] || `#${painAreaName} 완화`, '#작은 자세 변화'];
      })(),
    };
    const badgeTexts = badgeMap[guide.display_order] || ['#일상관리'];
    await prisma.badges.createMany({
      data: badgeTexts.map((text) => ({ guide_id: guide.guide_id, text })),
    });

    // 부위별 + 가이드유형별 notes 데이터 (피그마 기준)
    const notesByAreaAndType = {
      '어깨': {
        1: [ // 스트레칭 3개
          { bold: '어깨를 천천히 앞뒤로 돌려줍니다.', text: '처음에는 작은 범위로 시작해 점차 늘려보세요.' },
          { bold: '통증이 느껴지는 방향으로는 과도하게 당기지 않습니다.', text: '통증이 생기면 동작을 멈추고 휴식을 취하세요.' },
          { bold: '목과 어깨를 부드럽게 늘려주는 동작을 짧은 시간 반복합니다.', text: '반동을 주지 말고 천천히 유지하는 것이 중요합니다.' },
        ],
        2: [ // 온찜질/냉찜질 3개
          { bold: '냉찜질은 통증이 갑자기 발생했거나, 열감·부기가 느껴질 때 도움이 될 수 있습니다.', text: '차가운 자극이 혈관을 수축시켜 통증과 부기를 줄이는 데 도움이 됩니다.' },
          { bold: '온찜질은 어깨가 뻣뻣하고 뻐근할 때, 혈액 순환을 도와 근육 이완에 도움이 될 수 있습니다.', text: '혈액 순환을 촉진해 뻐근한 느낌을 완화하는 데 도움이 될 수 있습니다.' },
          { bold: '찜질은 한 번에 약 15~20분 이내로 하며, 피부에 직접 닿지 않도록 주의합니다.', text: '피부 자극이나 화상을 예방하기 위해 반드시 간접적으로 적용하세요.' },
        ],
        3: [ // 가벼운 일상 동작 4개
          { bold: '장시간 같은 자세를 피하고, 중간중간 자세를 바꿉니다.', text: '짧은 시간이라도 몸을 움직여 주는 것이 도움이 됩니다.' },
          { bold: '무거운 물건을 한쪽 어깨로만 들지 않습니다.', text: '양쪽으로 나누어 들거나 무게를 분산시키는 것이 좋습니다.' },
          { bold: '팔을 머리 위로 오래 올리는 동작은 피합니다.', text: '반복되면 통증이나 불편감이 심해질 수 있습니다.' },
          { bold: '디지털 기기 사용 시 어깨가 올라가지 않도록 주의합니다.', text: '어깨가 올라간 자세가 지속되면 어깨 근육에 긴장이 쌓일 수 있습니다.' },
        ],
      },
      '목': {
        1: [ // 스트레칭 3개
          { bold: '고개를 천천히 좌우로 돌리거나, 앞뒤로 부드럽게 움직입니다.', text: '반동 없이 고개를 좌우로 돌리고, 앞뒤로 부드럽게 움직입니다.' },
          { bold: '목을 으쓱했다가 내리는 동작을 반복합니다.', text: '목에 힘을 주지 않은 채 어깨를 으쓱 올렸다가 부드럽게 내려주세요.' },
          { bold: '통증이 느껴지는 방향으로 과도하게 꺾지 않습니다.', text: '스트레칭 중 통증이 증가하면 즉시 중단합니다.' },
        ],
        2: [ // 온찜질/냉찜질 3개
          { bold: '냉찜질은 통증이 갑자기 발생했거나, 열감·부기가 느껴질 때 도움이 될 수 있습니다.', text: '차가운 자극이 혈관을 수축시켜 통증과 부기를 줄이는 데 도움이 됩니다.' },
          { bold: '온찜질은 목이 뻣뻣하고 뻐근할 때, 혈액 순환을 도와 근육 이완에 도움이 될 수 있습니다.', text: '혈액 순환을 촉진해 뻐근한 느낌을 완화하는 데 도움이 될 수 있습니다.' },
          { bold: '찜질은 한 번에 약 15~20분 이내로 하며, 피부에 직접 닿지 않도록 주의합니다.', text: '피부 자극이나 화상을 예방하기 위해 반드시 간접적으로 적용하세요.' },
        ],
        3: [ // 가벼운 일상 동작 4개
          { bold: '장시간 같은 자세를 피하고, 중간중간 고개를 풀어줍니다.', text: '짧은 시간이라도 목을 가볍게 움직이는 것이 도움이 됩니다.' },
          { bold: '스마트폰·노트북 사용 시 화면을 눈높이에 맞춥니다.', text: '고개를 아래로 숙이는 자세를 줄이면 목에 부담을 줄일 수 있습니다.' },
          { bold: '베개는 목을 과도하게 꺾지 않는 높이를 선택합니다.', text: '수면 중 목에 가해지는 부담을 줄이는 데 도움이 됩니다.' },
          { bold: '통화 시 한쪽 어깨로 폰을 끼우는 자세를 피합니다.', text: '한쪽으로 기우는 자세가 지속되면 목 주변 근육에 긴장이 생길 수 있습니다.' },
        ],
      },
      '허리': {
        1: [ // 스트레칭 3개
          { bold: '허리를 천천히 비고 굽히는 동작을 부드럽게 반복합니다.', text: '매번 기준 범위를 넘지 않는 정도로만 하세요.' },
          { bold: '무릎을 가슴 쪽으로 당기는 스트레칭을 짧은 시간 유지합니다.', text: '허리 주변 근육을 이완해 긴장을 풀어주는 데 도움이 됩니다.' },
          { bold: '통증이 심해지는 방향의 동작은 피합니다.', text: '스트레칭 중 통증이 증가하면 즉시 중단하고 휴식을 취하세요.' },
        ],
        2: [ // 온찜질/냉찜질 3개
          { bold: '냉찜질은 통증이 갑자기 발생했거나, 열감·부기가 느껴질 때 도움이 될 수 있습니다.', text: '차가운 자극이 혈관을 수축시켜 통증과 부기를 줄이는 데 도움이 됩니다.' },
          { bold: '온찜질은 허리가 뻣뻣하고 뻐근할 때, 혈액 순환을 도와 근육 이완에 도움이 될 수 있습니다.', text: '혈액 순환을 촉진해 뻐근한 느낌을 완화하는 데 도움이 될 수 있습니다.' },
          { bold: '찜질은 한 번에 약 15~20분 이내로 하며, 피부에 직접 닿지 않도록 주의합니다.', text: '피부 자극이나 화상을 예방하기 위해 반드시 간접적으로 적용하세요.' },
        ],
        3: [ // 가벼운 일상 동작 4개
          { bold: '오래 앉아 있을 경우, 중간중간 일어나 가볍게 움직입니다.', text: '가만히 앉아만 있으면 허리 주변 근육이 경직될 수 있습니다.' },
          { bold: '물건을 들 때 허리만 굽히지 말고 무릎을 굽혀 사용합니다.', text: '무릎을 굽혀서 들면 허리에 가해지는 부담을 줄일 수 있습니다.' },
          { bold: '한쪽으로만 힘을 주는 자세를 피합니다.', text: '한쪽으로 골반이 틀어지면 허리에 부담이 생길 수 있습니다.' },
          { bold: '의자에 앉을 때 허리를 세우고 등받이에 기대어 앉습니다.', text: '오래 앉을 때도 허리 주변의 부담을 줄일 수 있습니다.' },
        ],
      },
      '무릎': {
        1: [ // 스트레칭 3개
          { bold: '무릎을 천천히 구부렸다 펴는 동작을 부드럽게 반복합니다.', text: '처음에는 작은 범위로 시작해 점차 늘려보세요.' },
          { bold: '다리를 곧게 편 상태에서 허벅지 앞쪽을 가볍게 당깁니다.', text: '허벅지 근육 이완이 무릎 부담 완화에 도움이 됩니다.' },
          { bold: '통증이 심해지는 방향의 동작은 피합니다.', text: '스트레칭 중 통증이 증가하면 즉시 중단합니다.' },
        ],
        2: [ // 온찜질/냉찜질 3개
          { bold: '냉찜질은 통증이 갑자기 발생했거나, 열감·부기가 느껴질 때 도움이 될 수 있습니다.', text: '차가운 자극이 혈관을 수축시켜 통증과 부기를 줄이는 데 도움이 됩니다.' },
          { bold: '온찜질은 무릎이 뻣뻣하고 뻐근할 때, 혈액 순환을 도와 근육 이완에 도움이 될 수 있습니다.', text: '혈액 순환을 촉진해 뻐근한 느낌을 완화하는 데 도움이 될 수 있습니다.' },
          { bold: '찜질은 한 번에 약 15~20분 이내로 하며, 피부에 직접 닿지 않도록 주의합니다.', text: '피부 자극이나 화상을 예방하기 위해 반드시 간접적으로 적용하세요.' },
        ],
        3: [ // 가벼운 일상 동작 4개
          { bold: '오래 같은 자세로 앉아 있을 때 중간중간 다리를 펴줍니다.', text: '짧은 시간이라도 무릎을 움직여 주는 것이 도움이 됩니다.' },
          { bold: '계단을 오를 때 난간을 잡고 천천히 올라갑니다.', text: '무릎에 가해지는 부담을 줄일 수 있습니다.' },
          { bold: '쪼그려 앉는 자세를 오래 유지하지 않습니다.', text: '무릎 관절에 과도한 부담이 가해질 수 있습니다.' },
          { bold: '무거운 물건을 들 때 무릎을 굽혀 들어 올립니다.', text: '무릎에 무리가 가지 않도록 올바른 자세를 유지하세요.' },
        ],
      },
      '두통': {
        1: [ // 스트레칭 3개
          { bold: '목과 어깨를 천천히 돌려 긴장을 풀어줍니다.', text: '처음에는 작은 범위로 시작해 점차 늘려보세요.' },
          { bold: '관자놀이와 눈 주변을 가볍게 눌러줍니다.', text: '지나치게 세게 누르지 않도록 주의하세요.' },
          { bold: '통증이 심해지는 방향의 동작은 피합니다.', text: '스트레칭 중 통증이 증가하면 즉시 중단합니다.' },
        ],
        2: [ // 온찜질/냉찜질 2개
          { bold: '냉찜질은 통증이 갑자기 발생했거나, 열감이 느껴질 때 도움이 될 수 있습니다.', text: '차가운 자극이 혈관을 수축시켜 통증을 줄이는 데 도움이 됩니다.' },
          { bold: '온찜질은 목과 어깨가 뻣뻣하고 뻐근할 때, 혈액 순환을 도와 근육 이완에 도움이 될 수 있습니다.', text: '혈액 순환을 촉진해 뻐근한 느낌을 완화하는 데 도움이 될 수 있습니다.' },
        ],
        3: [ // 가벼운 일상 동작 4개
          { bold: '장시간 같은 자세를 피하고, 중간중간 휴식을 취합니다.', text: '짧은 시간이라도 눈과 목을 쉬게 해주는 것이 도움이 됩니다.' },
          { bold: '스마트폰·컴퓨터 사용 시 화면 밝기와 거리를 조절합니다.', text: '눈의 피로를 줄이면 두통 예방에 도움이 될 수 있습니다.' },
          { bold: '수분을 충분히 섭취합니다.', text: '탈수는 두통의 원인이 될 수 있습니다.' },
          { bold: '규칙적인 수면 습관을 유지합니다.', text: '불규칙한 수면은 두통을 악화시킬 수 있습니다.' },
        ],
      },
      '복통': {
        1: [ // 스트레칭 2개
          { bold: '복부를 부드럽게 마사지하듯 원을 그려줍니다.', text: '시계 방향으로 부드럽게 문지르면 도움이 됩니다.' },
          { bold: '무릎을 가슴 쪽으로 당겨 복부 긴장을 풀어줍니다.', text: '무리하지 않는 범위에서 천천히 당기세요.' },
        ],
        2: [ // 온찜질/냉찜질 2개
          { bold: '온찜질은 복부가 긴장되거나 더부룩한 느낌이 들 때 도움이 될 수 있습니다.', text: '혈액 순환을 촉진해 복부 불편감을 완화하는 데 도움이 될 수 있습니다.' },
          { bold: '찜질은 한 번에 약 15~20분 이내로 하며, 피부에 직접 닿지 않도록 주의합니다.', text: '피부 자극이나 화상을 예방하기 위해 반드시 간접적으로 적용하세요.' },
        ],
        3: [ // 가벼운 일상 동작 4개
          { bold: '식후 바로 눕지 않고, 가볍게 걷습니다.', text: '소화를 돕고 복부 불편감을 줄이는 데 도움이 됩니다.' },
          { bold: '과식을 피하고, 천천히 식사합니다.', text: '급하게 먹으면 복부에 부담이 가중될 수 있습니다.' },
          { bold: '스트레스 관리를 위해 심호흡을 실천합니다.', text: '스트레스는 복통의 원인이 될 수 있습니다.' },
          { bold: '복부를 압박하는 옷이나 자세를 피합니다.', text: '편안한 옷과 자세가 복부 불편감 완화에 도움이 됩니다.' },
        ],
      },
    };

    const areaNotes = (notesByAreaAndType[painAreaName] || notesByAreaAndType['어깨'])[guide.display_order] || [];
    const notesData = areaNotes.map((note, idx) => ({
      guide_id: guide.guide_id,
      image_url: `${tcBase}/icons/${guideTypeFolder}/${idx + 1}.svg`,
      bold: note.bold,
      text: note.text,
    }));
    await prisma.notes.createMany({ data: notesData });

    // 증상별 caution 데이터 (피그마 기준)
    const cautionsByArea = {
      '어깨': [
        { icon_url: `${tcBase}/icons/1.svg`, bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있습니다.' },
        { icon_url: `${tcBase}/icons/2.svg`, bold: '팔을 들기 어렵거나 힘이 빠질 때', text: '어깨 관절이나 힘줄 기능 저하가 의심될 수 있습니다.' },
        { icon_url: `${tcBase}/icons/3.svg`, bold: '야간 통증으로 수면이 자주 깰 때', text: '염증이나 구조적 문제로 통증이 심해졌을 가능성이 있습니다.' },
      ],
      '허리': [
        { icon_url: `${tcBase}/icons/1.svg`, bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있습니다.' },
        { icon_url: `${tcBase}/icons/2.svg`, bold: '다리로 저림 · 통증이 퍼지거나 힘이 빠지는 증상이 동반될 때', text: '방치 시 증상이 악화될 수 있어 주의가 필요합니다.' },
        { icon_url: `${tcBase}/icons/3.svg`, bold: '일상생활이 어려울 정도의 통증이 나타날 때', text: '위험 신호일 수 있어 빠른 진료가 필요합니다.' },
      ],
      '무릎': [
        { icon_url: `${tcBase}/icons/1.svg`, bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있습니다.' },
        { icon_url: `${tcBase}/icons/2.svg`, bold: '붓기 · 열감 · 힘 빠짐이 동반될 때', text: '방치 시 증상이 악화될 수 있어 주의가 필요합니다.' },
        { icon_url: `${tcBase}/icons/3.svg`, bold: '걷기·계단 오르내리기 등 일상생활이 어려울 정도의 통증이 나타날 때', text: '위험 신호일 수 있어 빠른 진료가 필요합니다.' },
      ],
      '목': [
        { icon_url: `${tcBase}/icons/1.svg`, bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있습니다.' },
        { icon_url: `${tcBase}/icons/2.svg`, bold: '목을 돌리거나 숙이기 어려울 때', text: '생활 관리로 호전되지 않는다면 전문적인 진료가 필요합니다.' },
        { icon_url: `${tcBase}/icons/3.svg`, bold: '팔이나 손으로 저림 · 통증이 퍼지거나 힘이 빠지는 증상이 동반될 때', text: '염증이나 구조적 문제로 통증이 심해졌을 가능성이 있습니다.' },
      ],
      '두통': [
        { icon_url: `${tcBase}/icons/1.svg`, bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있습니다.' },
        { icon_url: `${tcBase}/icons/2.svg`, bold: '시야 변화 · 어지럼 · 구토가 동반될 때', text: '일반적인 긴장성 두통이 아닐 수 있으므로 의료진 상담을 권장합니다.' },
        { icon_url: `${tcBase}/icons/3.svg`, bold: '일상생활이 어려울 정도의 통증이 나타날 때', text: '위험 신호일 수 있어 빠른 진료가 필요합니다.' },
      ],
      '복통': [
        { icon_url: `${tcBase}/icons/1.svg`, bold: '통증이 지속되거나 심해질 때', text: '단순 근육 피로가 아닌 원인이 있을 수 있습니다.' },
        { icon_url: `${tcBase}/icons/2.svg`, bold: '발열 · 구토 · 설사 · 혈변 동반될 때', text: '일반적인 긴장성 복통이 아닐 수 있으므로 의료진 상담을 권장합니다.' },
        { icon_url: `${tcBase}/icons/3.svg`, bold: '일상생활이 어려울 정도의 통증이 나타날 때', text: '위험 신호일 수 있어 빠른 진료가 필요합니다.' },
      ],
    };
    const cautions = (cautionsByArea[painAreaName] || cautionsByArea['어깨']).map((c) => ({
      guide_id: guide.guide_id,
      ...c,
    }));
    await prisma.cautions.createMany({ data: cautions });

    // 부위별 + 가이드유형별 helps 데이터 (피그마 기준)
    const helpsByAreaAndType = {
      '어깨': {
        1: [ // 스트레칭
          '오래 같은 자세로 앉아 있어 어깨가 뻐근할 때',
          '긴장으로 어깨와 목 주변이 뻣뻣하게 느껴질 때',
          '통증은 심하지 않지만 어깨가 무겁고 답답할 때',
        ],
        2: [ // 온찜질/냉찜질
          '통증 완화를 위해 일시적인 대처가 필요할 때',
          '어깨가 뻣뻣하고 뻐근할 때',
          '근육이 긴장되어 불편함이 느껴질 때',
        ],
        3: [ // 가벼운 일상 동작
          '어깨와 목이 뻐근하게 느껴질 때',
          '어깨 사용을 잠시 조절할 필요가 있을 때',
          '작은 움직임으로 긴장을 풀어주고 싶을 때',
        ],
      },
      '허리': {
        1: [
          '오랜 시간 앉아 있거나 서 있었을 때',
          '허리 주변 근육에 긴장이 쌓였을 때',
          '허리의 가동 범위가 줄어든 것처럼 느껴질 때',
        ],
        2: [
          '통증 완화를 위해 일시적인 대처가 필요할 때',
          '허리가 뻣뻣하고 뻐근할 때',
          '근육이 긴장되어 불편함이 느껴질 때',
        ],
        3: [
          '무거운 물건을 자주 들어 허리가 자주 뻐근할 때',
          '한쪽으로만 힘을 사용하는 습관이 있을 때',
          '작은 자세 변화로 허리 부담을 줄이고 싶을 때',
        ],
      },
      '무릎': {
        1: [
          '오래 앉아 있다가 움직일 때 무릎이 뻣뻣할 때',
          '무릎 주변 근육에 긴장이 쌓였을 때',
          '가벼운 움직임으로 무릎 주변을 풀어주고 싶을 때',
        ],
        2: [
          '통증 완화를 위해 일시적인 대처가 필요할 때',
          '무릎이 뻣뻣하고 뻐근할 때',
          '근육이 긴장되어 불편함이 느껴질 때',
        ],
        3: [
          '무릎이 뻣뻣하고 뻐근하게 느껴질 때',
          '무릎 사용을 잠시 조절할 필요가 있을 때',
          '작은 움직임으로 무릎 주변 긴장을 풀어주고 싶을 때',
        ],
      },
      '목': {
        1: [
          '장시간 스마트폰이나 컴퓨터를 사용한 뒤 뻐근함을 느낄 때',
          '긴장으로 어깨와 목 주변이 뻣뻣하게 느껴질 때',
          '잠에서 깬 뒤 목 주변이 뻣뻣하게 느껴질 때',
        ],
        2: [
          '통증 완화를 위해 일시적인 대처가 필요할 때',
          '목이 뻣뻣하고 뻐근할 때',
          '근육이 긴장되어 불편함이 느껴질 때',
        ],
        3: [
          '장시간 스마트폰이나 컴퓨터를 사용한 뒤 뻐근함을 느낄 때',
          '긴장으로 어깨와 목 주변이 뻣뻣하게 느껴질 때',
          '잠에서 깬 뒤 목 주변이 뻣뻣하게 느껴질 때',
        ],
      },
      '두통': {
        1: [
          '목과 어깨의 긴장으로 두통이 시작된 느낌이 들 때',
          '고개를 오래 고정한 뒤 머리가 무겁게 느껴질 때',
          '어깨가 올라가 있고 목에 힘이 들어간 상태가 지속될 때',
        ],
        2: [
          '통증 완화를 위해 일시적인 대처가 필요할 때',
          '머리가 무겁고 뻐근할 때',
          '근육이 긴장되어 불편함이 느껴질 때',
        ],
        3: [
          '눈과 머리가 무겁게 느껴질 때',
          '두통이 자주 반복될 때',
          '스트레스와 피로로 인한 긴장이 지속될 때',
        ],
      },
      '복통': {
        1: [
          '복부에 심한 통증 없이 뻐근함이나 불편감이 느껴질 때',
          '가스가 차 있는 듯 더부룩한 느낌이 들 때',
          '장시간 앉아 있거나 누워 있다가 복부가 긴장된 느낌이 들 때',
        ],
        2: [
          '통증 완화를 위해 일시적인 대처가 필요할 때',
          '복부가 긴장되어 더부룩할 때',
          '근육이 긴장되어 불편함이 느껴질 때',
        ],
        3: [
          '식후 복부가 불편할 때',
          '소화가 잘 되지 않는 느낌이 들 때',
          '스트레스로 복부가 긴장될 때',
        ],
      },
    };
    const areaHelps = (helpsByAreaAndType[painAreaName] || helpsByAreaAndType['어깨'])[guide.display_order] || [];
    const helpsData = areaHelps.map((text) => ({
      guide_id: guide.guide_id,
      text,
    }));
    await prisma.helps.createMany({ data: helpsData });
  }
  console.log('badges / notes / cautions / helps 삽입 완료');

  // ============================
  // 10. Content Sections (배너)
  // ============================
  await prisma.content_sections.createMany({
    data: [
      { section_type: 'banner', title: '어깨 통증 관리법', content: '', image_url: `${S3_BASE}/main-home/shoulder/main-photo/stiffness.png`, display_order: 1 },
      { section_type: 'banner', title: '허리 건강 유지하기', content: '', image_url: `${S3_BASE}/main-home/back/main-photo/stiffness.png`, display_order: 2 },
      { section_type: 'banner', title: '목 통증 완화 방법', content: '', image_url: `${S3_BASE}/main-home/neck/main-photo/stiffness.png`, display_order: 3 },
      { section_type: 'banner', title: '무릎을 지키는 생활 습관', content: '', image_url: `${S3_BASE}/main-home/knee/main-photo/stiffness.png`, display_order: 4 },
      { section_type: 'banner', title: '두통 예방과 대처법', content: '', image_url: `${S3_BASE}/main-home/headache/main-photo/squeezing-headache.png`, display_order: 5 },
      { section_type: 'banner', title: '소화 건강 관리', content: '', image_url: `${S3_BASE}/main-home/stomachache/main-photo/squeezing-stomachache.png`, display_order: 6 },
    ],
  });

  // ============================
  // 11. Usage Guides
  // ============================
  const NHIS_URL = 'https://www.nhis.or.kr/nhis/index.do';
  await prisma.usage_guides.createMany({
    data: [
      { card_number: 1, title: '통증 부위 선택', modal_content: '먼저 통증이 있는 부위를 선택하세요. 어깨, 허리, 목, 무릎, 두통, 복통 중에서 선택할 수 있습니다.', image_url: `${S3_BASE}/main-home/shoulder/main-photo/stiffness.png`, source_url: NHIS_URL },
      { card_number: 2, title: '증상 확인', modal_content: '선택한 부위의 세부 증상을 확인할 수 있습니다. 자신의 증상과 가장 유사한 것을 선택해보세요.', image_url: `${S3_BASE}/main-home/back/main-photo/movement-pain.png`, source_url: NHIS_URL },
      { card_number: 3, title: '임시 대처법 확인', modal_content: '증상에 맞는 스트레칭, 찜질, 생활 습관 개선법 등의 임시 대처 방법을 확인할 수 있습니다.', image_url: `${S3_BASE}/main-home/knee/main-photo/tingling.png`, source_url: NHIS_URL },
    ],
  });
  console.log('content_sections, usage_guides 삽입 완료');

  // ============================
  // 12. Expert Answers (부위별 증상당 1개, 최대 3개/부위)
  // ============================
  // 피그마 디자인 기반 전문의 답변 데이터
  const expertAnswersByArea = {
    '어깨': [
      {
        summary: '말씀하신 목과 어깨의 뻐근함과 두통은 거북목증후군에서 흔히 나타나는 특징일 수 있습니다. 거북목증후군은 목이 정상적인 위치보다 앞으로 돌출되면서 척추 그자체와 해당부분과 이어지는 날개뼈 및 어깨에까지 영향을 끼칠 수 있는 만성적 질환입니다.',
        full_content: '말씀하신 목과 어깨의 뻐근함과 두통은 거북목증후군에서 흔히 나타나는 특징일 수 있습니다. 거북목증후군은 목이 정상적인 위치보다 앞으로 돌출되면서 척추 그자체와 해당부분과 이어지는 날개뼈 및 어깨에까지 영향을 끼칠 수 있는 만성적 질환입니다. 장시간 목을 숙인상태로 컴퓨터를 사용하거나, 스마트폰 시청처럼 고개를 숙인 자세가 지속되면 근육간의 균형이 깨지고 뭉쳐서, 주변 표피신경의 포착증상으로 진행되게 되면 목 주변 및 어깨죽지, 날개죽지의 만성적인 통증과 피로를 유발합니다. 시간이 지나면 어깨 결림이나 팔 저림 같은 디스크에 의한 신경근압박증상으로도 이어질 수 있습니다.\n\n비수술적 치료로도 충분히 회복을 기대할 수 있습니다. 우선 약물치료를 통해 목과 어깨의 긴장과 염증을 줄여 증상을 완화할 수 있으며, 물리치료는 혈류 개선과 근육 이완을 통해 회복을 촉진합니다. 도수치료는 전문적인 접근을 통해 척추와 관절의 불균형을 바로잡고, 약해진 근육의 기능을 회복시켜 자연스러운 자세를 되찾도록 돕습니다.\n\n또한 체외충격파 치료는 만성적으로 뭉친 근육과 인대 부위에 자극을 주어 세포 재생과 회복 과정을 촉진하는 데 효과적입니다. 주사치료를 활용하여 손상된 조직의 회복을 돕고 관절 주변의 부담을 줄여 기능 개선에 기여하기도 합니다.\n\n거북목증후군은 단순한 피로가 아니라 구조적 문제에서 비롯되기 때문에 방치하면 만성화될 수 있습니다. 증상이 반복된다면 전문의의 진료를 받아 현재 상태를 정확히 확인하고, 개인별 맞춤 치료 계획을 세우는 것이 필요합니다. 조기에 적절한 치료를 시작하면 통증 완화와 함께 목과 어깨의 기능을 회복해 일상생활을 훨씬 편안하게 유지하실 수 있습니다.',
      },
      {
        summary: '팔을 들어올릴 때 통증이 생기거나, 어깨가 걸리는 듯한 느낌이 든다면 어깨충돌증후군 가능성을 고려할 수 있습니다.',
        full_content: '팔을 들어올릴 때 통증이 생기거나, 어깨가 걸리는 듯한 느낌이 든다면 어깨충돌증후군 가능성을 고려할 수 있습니다.\n\n이 질환은 어깨를 감싸는 뼈와 힘줄 사이 공간이 좁아지면서 팔을 움직일 때 힘줄이 반복적으로 마찰되어 통증이 발생하는 상태입니다. 초기에는 단순한 근육통처럼 느껴지지만, 반복될수록 염증이 심해지고 어깨 움직임이 제한될 수 있습니다. 통증이 심할 때는 염증을 완화하고 신경 자극을 줄이기 위한 주사치료가 시행되기도 하며, 이후에는 도수치료나 물리치료를 통해 어깨 주변 근육의 긴장을 풀고 관절 움직임을 회복시키는 방식으로 진행됩니다. 이러한 치료를 병행하면 어깨의 움직임이 자연스러워지고, 통증도 점차 완화되는 경우가 많습니다.\n\n초기 단계에서 적절한 치료를 시작하면 회복이 빠르고, 재발 위험도 낮습니다. 통증이 지속되거나 심해질 경우 가까운 정형외과에 내원하셔서 전문의의 상담을 받아보시는 것을 권유드립니다.',
      },
      {
        summary: '어깨 통증은 단순한 근육 피로부터 어깨충돌증후군, 회전근개 질환, 오십견 등 다양한 원인으로 발생할 수 있습니다. 특히 팔을 들어올릴 때 통증이 심하고 걸리는 느낌이 든다면, 어깨 주변 힘줄이 좁은 공간 안에서 마찰되며 염증이 생긴 어깨충돌증후군일 가능성이 높습니다.',
        full_content: '어깨 통증은 단순한 근육 피로부터 어깨충돌증후군, 회전근개 질환, 오십견 등 다양한 원인으로 발생할 수 있습니다. 특히 팔을 들어올릴 때 통증이 심하고 걸리는 느낌이 든다면, 어깨 주변 힘줄이 좁은 공간 안에서 마찰되며 염증이 생긴 어깨충돌증후군일 가능성이 높습니다.\n\n어깨 통증을 완화하는 치료로는 우선 물리치료를 통해 긴장된 어깨 근육을 이완시키고, 염증으로 인한 통증을 완화하는 방법이 있습니다. 또한 도수치료를 병행하면 어깨 관절의 가동범위를 회복하고, 잘못된 어깨 정렬을 바로잡는 데 도움이 됩니다. 통증이 심한 경우에는 염증 부위에 주사치료를 시행하여 염증 반응을 줄이고, 회복 속도를 높일 수 있습니다.\n\n어깨 통증은 초기에 적절한 치료를 받으면 충분히 호전될 수 있으므로, 증상이 지속된다면 가까운 정형외과를 방문하셔서 전문의의 진단을 받아보시기를 권해드립니다.',
      },
    ],
    '허리': [
      {
        summary: '허리 뻐근함 증상의 원인은 잘못된 자세인 경우가 많고 외부 충격에 의해서도 생길 수 있습니다. 그러니 너무 오래 앉아 있거나 바르지 못한 자세인 경우라면 개선을 해서 관리를 해줘야 합니다. 만약 개선을 통해서도 증상이 지속된다면 척추 질환을 의심해 보고 병원에 검진을 해보는 것이 좋습니다.',
        full_content: '허리 뻐근함 증상의 원인은 잘못된 자세인 경우가 많고 외부 충격에 의해서도 생길 수 있습니다. 그러니 너무 오래 앉아 있거나 바르지 못한 자세인 경우라면 개선을 해서 관리를 해줘야 합니다. 만약 개선을 통해서도 증상이 지속된다면 척추 질환을 의심해 보고 병원에 검진을 해보는 것이 좋습니다.\n\n결과에 따라 치료는 달라지게 되는데, 경미한 경우라면 약물이나 주사, 물리치료 등의 보존적인 요법으로 관리할 수 있습니다. 하지만 상태가 좋지 않아서 보존적인 요법으로 회복이 어렵거나 일상생활이 어려울 정도라면 수술까지도 고려해 볼 수 있으니 참고해 주시기 바랍니다. 감사합니다.',
      },
      {
        summary: '말씀해주신 증상만으로 판단하자면, 디스크(추간판 탈출증)와 관련된 문제의 가능성이 있어 보입니다. 특히 다음과 같은 점들이 그런 의심을 강하게 합니다.',
        full_content: '말씀해주신 증상만으로 판단하자면, 디스크(추간판 탈출증)와 관련된 문제의 가능성이 있어 보입니다. 특히 다음과 같은 점들이 그런 의심을 강하게 합니다.\n\n기침할 때 통증이 심해진다는 것은 복압이 올라가면서 신경이 자극되고 있다는 신호일 수 있습니다. 이는 디스크가 신경을 누르고 있을 때 흔히 나타나는 양상입니다. 또한 움직일 때 통증이 느껴지는 것은 상당 부위에까지 통증이 퍼지고 있다는 것을 의미합니다. 자세 변화에 따라 디스크의 부하가 바뀌면서 통증이 달라질 수 있습니다.\n\n집에서 시도해볼 수 있는 대응 방법으로는\n· 재도한 움직임을 피하고 무리하지 않기\n· 허리를 굽히거나 비트는 동작은 가급적 피하기\n· 급성 통증 초기에는 냉찜질, 이후에는 온찜질\n· 필요 시 타이레놀이나 이부프로펜과 같은 진통제 복용\n등이 도움이 될 수 있습니다.\n\n다만 이러한 방법에도 증상이 호전되지 않거나, 점형외과나 신경의 방문을 권유드립니다. 병원에서는 MRI 촬영을 통해 디스크 탈출 여부나 신경 눌림 여부를 확인하게 될 수 있습니다. 특히 다리 배기거나 감각이 둔해지는 경우, 배뇨 배변에 조절이 잘 안 되는 경우, 이는 지체 없이 즉시 호전되지 않는다면 가급적 빠르게 병원을 방문해 검진을 받아보시기를 권해드립니다. 불편한 증상 하루빨리 호전되시기를 바랍니다.',
      },
      {
        summary: '우선 질문자님의 현재 상태를 직접 보고 진단한 것이 아니기에 구체적인 답변드리기 어려운 점 양해 바랍니다. 질문글을 보면 척추분리증, 후관절증후군 같은 척추 질환으로 인해 허리통증 증상이 생기는 것으로 보입니다.',
        full_content: '우선 질문자님의 현재 상태를 직접 보고 진단한 것이 아니기에 구체적인 답변드리기 어려운 점 양해 바랍니다. 질문글을 보면 척추분리증, 후관절증후군 같은 척추 질환으로 인해 허리통증 증상이 생기는 것으로 보입니다.\n\n운동으로 인해 근육이 과긴장 될 경우 근육통처럼 일시적으로 허리통증 증상이 생길 수 있습니다만 예전에도 요추 검사기 없고 골반이 안 좋다는 얘기를 들으셨다면 골반이 불균형하고 척추뼈의 정렬이 변형된 상태일 수 있습니다.\n\n참고로 근육통으로 생기는 허리통증 증상은 2-3일 정도 휴식을 취하면 자연스럽게 호전되지만 척추 질환으로 인해 통증이 생긴 경우 통증 외에도 가동 범위 제한(특정 방향으로 움직일 때 통증 악화), 근력 저하 등 다른 불편함이 동반되니 이럴 때 정확히 진단 받고 적절한 병원 치료와 자세교정 운동을 병행하는 것이 좋습니다.\n\n답변 내용이 도움이되었기를 바랍니다. 감사합니다.',
      },
    ],
    '무릎': [
      {
        summary: '왼쪽 다리의 구부릴 때의 뻑뻑한 느낌과 통증, 걸을 때의 시큰거리는 통증, 그리고 절뚝거리는 증상은 여러 가지 원인에 의해 발생할 수 있습니다. 나이가 30대 후반이라면, 급성 관절염이나 퇴행성 변화보다는 다른 원인일 가능성도 있을 수 있습니다.',
        full_content: '왼쪽 다리의 구부릴 때의 뻑뻑한 느낌과 통증, 걸을 때의 시큰거리는 통증, 그리고 절뚝거리는 증상은 여러 가지 원인에 의해 발생할 수 있습니다. 나이가 30대 후반이라면, 급성 관절염이나 퇴행성 변화보다는 다른 원인일 가능성도 있을 수 있습니다. 아래 몇 가지 가능한 원인을 설명드리겠습니다.\n\n1. 무릎 안대나 연골 문제\n조깅을 하면서 무릎에 부담이 갔을 수 있습니다. 너무 급격스럽게 무리한 운동을 하지는 않았는지, 이런 문제들의 관절막이나 미세한 손상이 있을 수 있고, 일찍 때 시큰거리는 느낌을 볼 수 있습니다.\n\n2. 슬개골 주위 문제 (슬개대퇴 증후군)\n슬개골 주변에 발생할 수 있는 통증입니다. 주로 운동 중에 과도한 사용으로 발생하거나 나, 종종 근 육통이 들어 오른쪽으로만 불편함을 느낄 수 있습니다.\n\n3. 건염이나 힘줄 문제\n무릎 주변의 건염의 있을 수 있습니다. 구부리거나 다시 자세가 조정될 때 통증이 나타날 수 있으며, 움직임에 따라 통증이 변할 수 있습니다.\n\n4. 관절염\n활동 관절염도 가능성 중 하나일 수 있습니다. 반복적 운동 후 통증이 발생하기도 하며, 특히 운동 후 통증이 더 심해진다면 관절염의 초기 증상일 수 있습니다.\n\n5. 근육이나 인대의 과도한 긴장\n조깅 후 무릎 주위의 근육이나 인대가 과도하게 긴장하거나 피로해서 뻣뻣해지는 현상이 일어날 수 있습니다.\n\n· 증상에 대한 대처 방법\n- 휴식과 얼음 찜질 : 운동 후 무릎을 충분히 쉬어 주고, 얼음찜질을 통해 염증과 통증을 줄일 수 있습니다.\n- 전문가 방문 : 통증이 2주 이상 지속되거나 악화된다면, 물리치료사나 정형외과의 진찰과 필요시 X-ray나 MRI로 검사를 시도해보세요. 무릎 근육이 무릎에 부담을 줄 수 있으니,\n- 스트레칭과 근력 운동 : 무릎 주위의 근육을 강화하고 유연성을 높이는 운동을 시도해보세요. 무릎 근육이 무릎에 부담을 줄 수 있기 때문입니다.\n\n무엇보다, 무릎 통증이 일상적인 활동에 영향을 미치기 시작했다면 자기 치료보다는 전문가의 진단을 받는 것이 좋습니다.',
      },
      {
        summary: '직접 질문자님의 상태를 살펴보지 못했기 때문에 자세한 안내를 도와드리기 어렵습니다. 무릎 통증의 원인은 다양한데 아무래도 오래 서 있으면 무릎에 많은 하중이 집중되기 때문에 무리가 갈 수밖에 없습니다.',
        full_content: '직접 질문자님의 상태를 살펴보지 못했기 때문에 자세한 안내를 도와드리기 어렵습니다.\n\n무릎 통증의 원인은 다양한데 아무래도 오래 서 있으면 무릎에 많은 하중이 집중되기 때문에 무리가 갈 수밖에 없습니다. 그래서 일시적으로 통증이 있거나 불편함을 느낄 수도 있습니다. 찜질이나 마사지, 스트레칭으로 관리를 해보시고 그럼에도 통증이 지속되면 병원을 방문해 검진을 받아 보는 것이 좋겠습니다.\n\n감사합니다.',
      },
      {
        summary: '움직일 때 무릎 통증으로 고생이 많으시네요. 오래 서있다가 움직일때 초기에 무릎 통증이 있는 것은 무릎연골손상 또는 파열의 가능성이 있어 보입니다.',
        full_content: '움직일 때 무릎 통증으로 고생이 많으시네요.\n오래 서있다가 움직일때 초기에 무릎 통증이 있는 것은 무릎연골손상 또는 파열의 가능성이 있어 보입니다. 무릎연골손상 및 파열이 심하지 않을 때는 초기 보행시에만 무릎 통증이 있다가 어느정도 움직이면 통증이 덜해져서 아픔을 못 느낄수 있습니다. 향후 시간이 지나면서 무릎연골이 더 안좋아지게 되면 무릎 통증이 좀더 심하게 나타날 가능성이 높습니다.\n\n반월상연골파열 또는 뼈에 붙어 있는 무릎연골손상의 가능성이 있으므로 병원에서 정밀검사를 해보시기 바랍니다. 감사합니다.',
      },
    ],
    '목': [
      {
        summary: '목 뻐근함으로 인해 질문 주셨습니다. 베개를 베고 자지 않은 시기부터 목 뻐근함 증상이 나타났다면 경추 균형의 이상으로 인한 불편일 확률이 높아 보입니다만, 정확한 원인은 전문의의 진단이 선행되어야만 파악할 수 있겠습니다.',
        full_content: '목 뻐근함으로 인해 질문 주셨습니다.\n베개를 베고 자지 않은 시기부터 목 뻐근함 증상이 나타났다면 경추 균형의 이상으로 인한 불편일 확률이 높아 보입니다만, 정확한 원인은 전문의의 진단이 선행되어야만 파악할 수 있겠습니다.\n\n원인에 따라 약물치료, 물리치료, 도수치료, 운동치료 등의 치료가 고려될 수 있습니다. 다만 불편감의 원인이 경추 균형의 이상이 원인이 맞다면 물리치료, 도수치료 등을 시행한다고 하더라도 1-2회 만에 큰 호전을 기대하기는 어려우며 꾸준한 치료와 생활습관 개선 등 개인의 노력이 수반되어야 합니다.\n\n경추 균형의 이상은 치료 없이 방치하는 경우, 목디스크, 경추관협착증 등의 질환으로 이어질 수 있기에 조속히 정형외과에 내원하여 진료를 받아보시기 바랍니다.',
      },
      {
        summary: '아침에 스트레칭을 하던 중 목을 왼쪽으로 당기는 과정에서 오른쪽 목 부근에서 찌릿하면서 통증이 발생했고, 이후에도 고개를 오른쪽으로 돌리거나 숙일 때 통증이 심해지고 있다고 하셨습니다. 지인의 말로는 외부적으로 목에는 이상이 없어 보인다고 하셨습니다.',
        full_content: '아침에 스트레칭을 하던 중 목을 왼쪽으로 당기는 과정에서 오른쪽 목 부근에서 찌릿하면서 통증이 발생했고, 이후에도 고개를 오른쪽으로 돌리거나 숙일 때 통증이 심해지고 있다고 하셨습니다. 지인의 말로는 외부적으로 목에는 이상이 없어 보인다고 하셨습니다.\n\n· 휴식 및 안정 : 목에 부담을 주는 행동 즉 스트레칭을 당분간 금지하고, 안정을 잠시에 휴식을 취해주세요. 목 베개를 적절히 사용하여 자는 동안 목의 부담을 줄여주세요. 특히 높은 심부름 줄이는 것이 좋아요. 목에 긴장이 됩니다.\n· 냉찜질과 온찜질 : 통증이 시작된 후 24시간 이내이므면 냉찜질을 통해 염증과 통증을 줄이는 것이 좋습니다. 그 이후에는 온찜질을 통해 근육의 긴장을 풀어주세요.\n· 점진적인 운동 : 조금씩 목 범위를 넓혀주는 운동을 합니다. 무리가 가지 않는 범위 내에서 목 스트레칭을 서서히 재개하세요.\n· 복용 : 통증이 심한 경우 약국에서 구입 가능한 일반 비스테로이드성 항염진통제(NSAID)를 복용하면 도움이 될 수 있습니다.\n· 병원 진료 : 만약 통증이 지속되거나 악화되면 병원을 방문해 정확한 진단을 받아보시기를 권합니다.\n\n만약 위의 관리에도 통증이 지속되거나 다른 증상이 동반된다면, 정확한 진단을 위해 전문의를 방문하는 것을 추천드립니다.',
      },
      {
        summary: '목을 움직일 때 통증이 있으시군요. 근육긴장으로 인한 통증으로 생각이 듭니다. 집에서 할 수 있는 방법으로는 따뜻한 찜질 및 스트레칭 등이 도움이 되며 가까운 정형외과나 재활의학과 등에 방문하셔서 물리치료를 받아보시면 도움이 되리라 생각이 듭니다.',
        full_content: '목을 움직일 때 통증이 있으시군요. 근육긴장으로 인한 통증으로 생각이 듭니다.\n집에서 할 수 있는 방법으로는 따뜻한 찜질 및 스트레칭 등이 도움이 되며 가까운 정형외과나 재활의학과 등에 방문하셔서 물리치료를 받아보시면 도움이 되리라 생각이 듭니다. 컴퓨터나 독서등 목을 일정 시간 고정하여 숙이는 행동을 하게 되면 근육긴장이 유발될 수 있으므로 중간중간 스트레칭은 필요합니다.\n\n감사합니다.',
      },
    ],
    '두통': [
      {
        summary: '이마와 눈 위쪽이 조이는 듯한 두통이 있지만 통증이 심하지 않고 신경이 쓰이는 정도라면, 주로 긴장성 두통이나 안구 피로로 인해 발생하는 경우가 많습니다. 긴장성 두통은 스트레스, 나쁜 자세, 목과 어깨 근육의 긴장으로 인해 머리를 띠처럼 조이는 느낌이 드는 것이 특징입니다.',
        full_content: '이마와 눈 위쪽이 조이는 듯한 두통이 있지만 통증이 심하지 않고 신경이 쓰이는 정도라면, 주로 긴장성 두통이나 안구 피로로 인해 발생하는 경우가 많습니다.\n\n긴장성 두통은 스트레스, 나쁜 자세, 목과 어깨 근육의 긴장으로 인해 머리를 띠처럼 조이는 느낌이 드는 것이 특징입니다. 또한, 안구 피로가 심해지면 눈을 감고 싶을 때도 무겁고 압박되는 듯한 느낌이 들 수 있습니다. 장시간 화면을 보거나 눈을 과도하게 사용한 후, 눈 주위 근육이 피로해지면서 조이는 듯한 느낌이 나타날 수 있습니다. 눈부위에도 이마로 올라가는 신경이 나오므로 근막에 의해서 포착이 되어서 신경증이 발생하기도 합니다.\n\n이러한 증상을 완화하기 위해서는 목과 어깨 스트레칭을 자주 해주고, 온찜질을 통해 근육 이완시키는 것이 도움이 될 수 있습니다. 또한, 스마트폰과 컴퓨터 사용을 줄이면서 눈의 긴장을 풀어주는 것도 좋습니다.\n\n장소 카페나 실내 같은 곳에 다닐 때는 창가를 조절하는 것이 중요하며 스트레칭은 필요합니다.\n\n만약 이러한 생활 습관 조절에도 불구하고 증상이 2주 이상 지속되거나 점점 심해진다면, 신경외과에서 검사를 받아보시는 것을 좋습니다. 간혹 부비동염(축농증), 혈압 문제, 또는 신경학적 원인이 있을 수 있으므로, 증상이 지속되면 경우 정확한 진단을 받아보는 것이 필요합니다.',
      },
      {
        summary: '갑자기 욱신거리는 두통이 5분 정도 지속되었다가 저절로 사라졌다면, 대부분의 경우 큰 이상은 아닐 가능성이 높습니다. 특히 두통이 일시적이고, 구토나 시야 변화, 팔다리 힘 빠짐, 말 어눌함 같은 신경학적 증상이 전혀 동반되지 않았다면 긴장성 두통이나 환경 변화에 따른 일시적인 두통일 수 있습니다.',
        full_content: '갑자기 욱신거리는 두통이 5분 정도 지속되었다가 저절로 사라졌다면, 대부분의 경우 큰 이상은 아닐 가능성이 높습니다. 특히 두통이 일시적이고, 구토나 시야 변화, 팔다리 힘 빠짐, 말 어눌함 같은 신경학적 증상이 전혀 동반되지 않았다면 긴장성 두통이나 환경 변화에 따른 일시적인 두통일 수 있습니다.\n\n장시간 컴퓨터를 사용하면서 목을 숙인 자세를 유지하거나 화면을 응시하는 시간이 길어지면, 뒷목이나 머리 쪽 근육이 긴장하게 되어 머리가 욱신거리는 느낌이 나타날 수 있습니다. 또한 피시방처럼 환기가 잘 안 되는 공간에서는 산소 부족이나 실내 공기 질의 영향으로 두통이 발생하기도 합니다. 이 외에도 과도한 카페인 섭취, 수분 부족, 당분 과다 섭취 등도 원인이 될 수 있습니다.\n\n하지만 두통이 자주 반복되거나 점점 강도가 심해진다면 주의가 필요합니다. 아침에 눈 뜨자마자 머리가 아프거나, 두통과 함께 구역, 구토, 시야 흐림, 팔다리 감각 이상 등의 증상이 동반된다면 반드시 병원 진료를 받아야 합니다. 특히 최근 머리를 부딪힌 적이 있다면 경미한 외상성 뇌손상의 가능성도 고려해야 하므로 확인이 필요합니다.\n\n이번 두통이 단발성으로 끝나고, 이후 별다른 증상이 없다면 크게 걱정하지 않으셔도 되지만, 피로, 수면 부족, 나쁜 자세 등이 반복된다면 다시 두통이 발생할 수 있으니 평소 생활습관을 점검해보는 것이 좋습니다. 만약 이후에도 유사한 두통이 반복된다면 신경외과나 신경과를 방문해 정확한 진단을 받아보시길 권합니다.',
      },
      {
        summary: '말씀해주신 내용을 보면, 예전에 뇌 MRI에서 경동맥 협착 의심 소견이 있었지만 검사 오류(아티팩트)일 가능성이 높다고 하여 큰 이상은 없다고 들으셨고, 이후 경추 4-5번에서 디스크 의심으로 목에 주사치료를 받으신 적이 있으시군요. 최근에는 특별한 문제 없이 지내시다가, 왼쪽 머리에 파짐파짐 하는 두통이 반복적으로 생겨면서 불안해하고 계십니다.',
        full_content: '말씀해주신 내용을 보면, 예전에 뇌 MRI에서 경동맥 협착 의심 소견이 있었지만 검사 오류(아티팩트)일 가능성이 높다고 하여 큰 이상은 없다고 들으셨고, 이후 경추 4-5번에서 디스크 의심으로 목에 주사치료를 받으신 적이 있으시군요. 최근에는 특별한 문제 없이 지내시다가, 왼쪽 머리에 파짐파짐 하는 두통이 반복적으로 생겨면서 불안해하고 계십니다.\n\n20대의 젊은 연령에서 심각한 뇌혈관 질환이 갑자기 진행될 가능성은 낮지만, 새로운 양상의 두통이 잦아졌다는 점은 반드시 확인이 필요합니다. 필수적인 경추성 두통을 실제로 한쪽 머리만 아프게 만들 수 있고, 뇌이어 퍼지는 듯 아픈 양상을 보입니다. 때로는 메스꺼움이나 피로감이가 동반되기도 합니다.\n\n정리하면, 현재의 두통은 경추 문제로 인해 나타나는 경추성 두통일 수도 있고, 나이와 증상을 고려했을 때 편두통의 가능성도 낮지않다. 뇌혈관 자체에 심각한 이상의 생겼을 가능성은 낮지만, 새로운 양상의 두통이 반복되는 시점이므로 사가정해둔다면 가급적 빠르게 병원을 방문해 정확한 진단을 받아보시기를 권합니다.\n\n결론적으로, 지금 상태는 당장 응급 상황으로 보이지는 않지만 원인을 확실히 감별하기 위해 다시 병원을 방문하시는 것이 좋습니다. 그렇게 해야 뇌혈관 문제, 편두통, 경추성 두통 중 주된 원인이 정확히 확인하고 안심할 수 있을 것입니다.',
      },
    ],
    '복통': [
      {
        summary: '질문자님의 증상은 정확한 진료가 필요하지만 과민성대장증후군의 증상으로 생각됩니다. 과민성대장증후군은 기능성 장질환의 하나인데 특별한 이유 없이 장이 예민하게 반응해 복통과 복부팽만, 설사, 변비 등이 나타나는 질환입니다.',
        full_content: '질문자님의 증상은 정확한 진료가 필요하지만 과민성대장증후군의 증상으로 생각됩니다.\n\n과민성대장증후군은 기능성 장질환의 하나인데 특별한 이유 없이 장이 예민하게 반응해 복통과 복부팽만, 설사, 변비 등이 나타나는 질환입니다. 또 먼데서 별 생각 가능하지만 남자보다는 여자에서 더 많이 나타나며 심각한 질환은 아니지만 화장실을 자주 찾게 되어 일상생활에 지장을 많이 줍니다.\n\n발병원인은 명확하지 않지만 장관과, 음흥두이에 심리적, 정신적인 변화를 표시합니다. 또 보존적 조절이나 소화 기관의 큰 변화를 줄 수 있어요. 그중 스트레스는 큰 영향을 줄 수 있습니다. 과도한 스트레스는 자율신경계 기능에 불균형을 초래하면서 장운동을 비정상적으로 변경합니다. 그리고 긴장으로 내장의 과민성 반응을 유발하기도 합니다.\n\n치료로는 음식과 운동관에서 잘 포함된 관계를 호전시킬 수 있고, 카페인이나 과도한 음식물 등을 피하며서는 등도 도움이 됩니다. 규칙적인 식사와 적당한 휴식, 스트레스 관리, 과식을 피하고 식이섬유가 풍부한 음식 섭취, 저 FODMAP 식이, 유산균을 꾸준히 복용하는 등의 생활습관 변화가 꼭 동반되야 합니다. 저 FODMAP 식이가 사전 첨부합니다. 답변이 도움이 되었으면 좋겠습니다.',
      },
      {
        summary: '오른쪽 배에서 느껴지는 콕콕 찌르는 듯한 통증은 여러 가지 원인으로 발생할 수 있습니다. 복통보다는 근육통에 가깝다고 느끼시는 점, 잠으면서 숨을 쉘 때마다 통증이 있다는 점은 근육이나 인대의 문제일 가능성을 시사합니다.',
        full_content: '오른쪽 배에서 느껴지는 콕콕 찌르는 듯한 통증은 여러 가지 원인으로 발생할 수 있습니다.\n\n복통보다는 근육통에 가깝다고 느끼시는 점, 잠으면서 숨을 쉘 때마다 통증이 있다는 점은 근육이나 인대의 문제일 가능성을 시사해요. 하지만 내장통 가능성도 배제할 수는 없어요. 근육통과 내장통을 구분하는 것은 중요합니다. 근육통을 주로 당기거나 수시는 느낌이며, 움직임에 따라 통증이 변할 수 있어요.\n\n반면 내장통은 둔탁하거나 콕콕 찌르는 느낌으로 나타나며, 움직임과 크게 관련이 없을 수 있습니다. 귀하의 경우 잠을 때마다 숨을 쉴 때 통증이 있다는 점에서 근육통일 가능성이 높아 보이지만, 정확한 진단을 위해서는 전문의의 진찰이 필요해요.\n\n하지만 통증이 심해지거나 다른 증상이 동반된다면 정확한 진단을 위해 전문가의 도움을 받아야 합니다. 간염이나 간 질환, 담석, 구토, 통증 등의 증상이 나타나다면, 정확한 진단을 위한 전문의의 진찰을 받아야 합니다. 현재로서는 우리가 할 수 있는 것은 고열이 동반되거나 통증이 급격히 악화되면 즉시 병원을 방문하는 것이 좋아요. 또한, 통증이 있는 부위에 온찜질을 하는 것이 근육이완에 도움이 될 수 있습니다.\n\n답변이 도움이되셨길 바라며, 건강 잘 챙기시기 바랍니다.',
      },
      {
        summary: '안녕하세요. 과민성 대장 증후군 가능성이 있어 보입니다. 주요 증상은 배변 양상의 변화와 함께 발생하는 복부 통증 또는 복부 불편감입니다. 배변 양상이 변하는 경우도 있습니다.',
        full_content: '안녕하세요. 과민성 대장 증후군 가능성이 있어 보입니다.\n\n주요 증상은 배변 양상의 변화와 함께 발생하는 복부 통증 또는 복부 불편감입니다. 배변 양상이 변하는 경우도 있습니다. 대장이 과민해서 대장의 운동이 지나치게 빨라져서 설사가 유발되거나 움직임이 급격히 감소한 경우 변비가 발생해서, 설사와 변비가 반복되기도 합니다.\n\n또한 내장 민감도가 증가하여 장 내 가스에 의한 복부팽만을 쉽게 느낄 수 있고, 이외에도 복부왼쪽에 더 큰 통증이 있는 경우가 많고 각종 근통 등도 나타납니다. 다른 질환과, 대장 내시경, 혈액검사 등을 통해 다른 질환의 여부를 확인하여 배별은 이후에야 비로소 과민성 대장 증후군의 진단이 대두됩니다.\n\n규칙적인 식사와 적당한 휴식, 스트레스 관리, 과식을 피하고 식이섬유가 풍부한 음식 섭취, 저 FODMAP 식이, 유산균을 꾸준히 복용하는 등의 생활습관 변화가 꼭 동반되야 합니다. 저 FODMAP 식이가 사전 첨부합니다. 답변이 도움이 되었으면 좋겠습니다.',
      },
    ],
  };

  const painAreaNames = ['어깨', '허리', '목', '무릎', '두통', '복통'];

  // 부위별 증상 순서에 맞는 expert-opinion-modal 이미지 파일명
  const expertImagesByArea = {
    '어깨': ['stiffness.png', 'tingling.png', 'movement-pain.jpg'],
    '허리': ['stiffness.png', 'tingling.png', 'movement-pain.png'],
    '무릎': ['stiffness.png', 'tingling.png', 'knee-movement-pain.png'],
    '목': ['stiffness.png', 'tingling.png', 'movement-pain.png'],
    '두통': ['squeezing-headache.png', 'throbbing-headache.png', 'one-sided-headache.png'],
    '복통': ['squeezing-stomachache.png', 'stabbing-stomachache.png', 'bloating-stomachache.png'],
  };

  // 부위별 증상 순서에 맞는 원문 출처 링크 (네이버 지식인 전문의 답변)
  const expertSourceUrlsByArea = {
    '어깨': [
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=489055916&enc=utf8&kinsrch_src=pc_tab_kin&qb=7Ja06rmoIOu7kOq3vO2VqA%3D%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=489891938&enc=utf8&kinsrch_src=pc_tab_kin&qb=7Ja06rmoIOywjOumv+2VqA%3D%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=490463122&enc=utf8&kinsrch_src=pc_tab_kin&qb=7Ja06rmoIOybgOyngeydvCDrlYwg7Ya17Kad',
    ],
    '허리': [
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70107&docId=481196821&qb=7ZeI66asIOu7kOq3vO2VqCDshKzsnKDrpZw=&enc=utf8',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=484405578&enc=utf8&kinsrch_src=pc_tab_kin&qb=7ZeI66asIOywjOumv+2VnCDthrXspp0%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=465076659&qb=7ZeI66asIOybgOyngeydvCDrlYwg7Ya17Kad&enc=utf8',
    ],
    '목': [
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70108&docId=486454260&qb=6rK97LaUIOyjvOuzgOydmCDqt7zquLTsnqXsnLzroZwg7J247ZWcIOyLoOqyve2GtSDslpHsg4HsnZgg65GQ7Ya17J20IOyVhOuLkOq5jO2VqeuLiOuLpC4g6rCA6rmM7Jq0IOqzs+ydmCDsi6Dqsr3thrXspp3qtIDroKgg67OR7JuQ7J2EIOuwqeusuO2VtA==&enc=utf8',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70107&docId=470953476&qb=7Iug6rK97Ya17J2064KYIOq3vOycoe2GteqzvCDqtIDroKjsnbQg7J6I7J2EIOyImCDsnojsirXri4jri6QuIOuYkO2VnCDrlJTsiqTtgazsnZgg7Kad7IOB64+EIOydmOyLrO2VtCDrtJDslbwg7ZWgIOqygyDqsJnquLDrj4Qg7ZWp64uI64ukLiDsp4jrrLg=&enc=utf8',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70107&docId=160993508&qb=66qpIOybgOyngeydvCDrlYwg7Ya17Kad&enc=utf8',
    ],
    '무릎': [
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=478271024&enc=utf8&kinsrch_src=pc_tab_kin&qb=66y066aOIOu7kOq3vO2VqCDthrXspp0%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=473732371&qb=7KeB7KCRIOyniOusuOyekOuLmOydmCDsg4Htg5zrpbwg7IK07Y6067O07KeAIOuqu+2WiOq4sCDrlYzrrLjsl5Ag7J6Q7IS47ZWcIOyViOuCtOulvCDrj4TsmYDrk5zrpqzquLAg7Ja066C17Iq164uI64ukLiDigIsg66y066aOIO2GteymneydmCDsm5DsnbjsnYA=&enc=utf8',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70106&docId=490385032&qb=4oCLIOqzhOuLqOydhCDrgrTroKTqsIgg65WMIOustOumjiDslZ3sqr0g7Ya17Kad7J20IOyLrO2VtOyngOuKlCDqsr3smrDripQg66y066aOIOq0gOygiCDsl7Dqs6jsnZgg66eI7LCwIOymneqwgCDrmJDripQg66y066aOIOyjvOuzgCDtnpjspITCt+yXsOu2gOyhsOyngeydmA==&enc=utf8',
    ],
    '두통': [
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70107&docId=481533435&enc=utf8&kinsrch_src=pc_tab_kin&qb=7KGw7J2064qUIOuTr+2VnCDrkZDthrU%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70107&docId=485983259&enc=utf8&kinsrch_src=pc_tab_kin&qb=7Jqx7Iug6rGw66as64qUIOuRkO2GtQ%3D%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70107&docId=488104820&enc=utf8&kinsrch_src=pc_tab_kin&qb=7ZWc7Kq97Jy866GcIOyLrO2VnCDrkZDthrU%3D',
    ],
    '복통': [
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70104&docId=319519225&enc=utf8&kinsrch_src=pc_tab_kin&qb=7KWQ7Ja07Kec64qU65Ov7ZWcIOuzte2GtQ%3D%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=70101&docId=483300704&enc=utf8&kinsrch_src=pc_tab_kin&qb=7L2V7L2VIOywjOultOuKlCDrs7XthrU%3D',
      'https://kin.naver.com/qna/detail.naver?d1id=7&dirId=7010102&docId=430481754&enc=utf8&kinsrch_src=pc_tab_kin&qb=642U67aA66Op7ZWcIOuzte2GtQ%3D%3D',
    ],
  };

  const answerData = [];
  for (const areaName of painAreaNames) {
    const symptoms = allSymptomsList2.filter(
      (s) => Number(s.pain_area_id) === Number(createdPainAreas[areaName].pain_area_id)
    );
    const areaAnswers = expertAnswersByArea[areaName];
    const areaFolder = painAreaFolderMap[areaName];
    const areaImages = expertImagesByArea[areaName];
    const areaSourceUrls = expertSourceUrlsByArea[areaName];
    for (let i = 0; i < Math.min(3, symptoms.length); i++) {
      const symptom = symptoms[i];
      answerData.push({
        symptom_id: symptom.symptom_id,
        summary: areaAnswers[i].summary,
        full_content: areaAnswers[i].full_content,
        source_url: areaSourceUrls[i],
        image_url: `${S3_BASE}/main-home/${areaFolder}/expert-opinion-modal/${areaImages[i]}`,
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