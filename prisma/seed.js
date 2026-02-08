import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing seed data (order matters due to FK constraints)
  await prisma.user_symptoms.deleteMany();
  await prisma.user_pain_areas.deleteMany();
  await prisma.temporary_care_guides.deleteMany();
  await prisma.usage_guides.deleteMany();
  await prisma.expert_answers.deleteMany();
  await prisma.symptom_steps.deleteMany();
  await prisma.pain_area_specialties.deleteMany();
  await prisma.hospital_symptoms.deleteMany();
  await prisma.lifestyle_videos.deleteMany();
  await prisma.symptoms.deleteMany();
  await prisma.content_sections.deleteMany();
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

  // Users
  const hashedPassword = await bcrypt.hash('password', 10);
  const user = await prisma.users.create({
    data: {
      name: 'Seed User',
      email: 'seed.user@example.com',
      password: hashedPassword,
      birth: new Date('1990-01-01'),
      gender: 'OTHER'
    }
  });

  // Pain areas with specialties
  const painAreas = [
    { pain_area_id: 1, name: '어깨' },
    { pain_area_id: 2, name: '허리' },
    { pain_area_id: 3, name: '무릎' },
    { pain_area_id: 4, name: '목' },
    { pain_area_id: 5, name: '두통' },
    { pain_area_id: 6, name: '복통' },
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

  console.log('Seed data created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
