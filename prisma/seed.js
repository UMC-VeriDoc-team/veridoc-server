import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.pain_area_specialties.deleteMany();

  const painAreas = [
    { pain_area_id: 1, name: '어깨' },
    { pain_area_id: 2, name: '허리' },
    { pain_area_id: 3, name: '무릎' },
    { pain_area_id: 4, name: '목' },
    { pain_area_id: 5, name: '두통' },
    { pain_area_id: 6, name: '복통' },
  ];

  for (const area of painAreas) {
    await prisma.pain_areas.upsert({
      where: { pain_area_id: BigInt(area.pain_area_id) },
      update: { name: area.name },
      create: {
        pain_area_id: BigInt(area.pain_area_id),
        name: area.name,
      },
    });
  }

  console.log('pain_areas 데이터 삽입 완료');

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
        pain_area_id: BigInt(data.pain_area_id),
        specialty_keyword: data.specialty_keyword,
      },
    });
  }

  console.log('pain_area_specialties 데이터 삽입 완료');
  console.log('Seed 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
