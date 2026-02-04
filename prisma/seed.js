
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing seed data (order matters due to FK constraints)
  await prisma.temporary_care_guides.deleteMany();
  await prisma.usage_guides.deleteMany();
  await prisma.content_sections.deleteMany();
  await prisma.symptom_steps.deleteMany();
  await prisma.symptoms.deleteMany();
  await prisma.pain_areas.deleteMany();
  await prisma.user_symptoms.deleteMany();
  await prisma.user_pain_areas.deleteMany();
  await prisma.users.deleteMany();

  // Users
  const user = await prisma.users.create({
    data: {
      name: 'Seed User',
      email: 'seed.user@example.com',
      password: 'password',
      birth: new Date('1990-01-01'),
      gender: 'OTHER'
    }
  });

  // Pain area + symptoms
  const shoulder = await prisma.pain_areas.create({ data: { name: '어깨' } });

  const s1 = await prisma.symptoms.create({ data: { pain_area_id: shoulder.pain_area_id, name: '뻐근함' } });
  const s2 = await prisma.symptoms.create({ data: { pain_area_id: shoulder.pain_area_id, name: '찌릿함' } });
  const s3 = await prisma.symptoms.create({ data: { pain_area_id: shoulder.pain_area_id, name: '움직일 때 통증' } });

  // Temporary care guides
  await prisma.temporary_care_guides.createMany({
    data: [
      {
        pain_area_id: shoulder.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '허리 스트레칭 방법',
        content: '간단한 스트레칭으로 통증을 완화하세요.',
        image_url: 'https://example.com/guides/shoulder-01.jpg'
      },
      {
        pain_area_id: shoulder.pain_area_id,
        guide_type: '스트레칭/찜질',
        title: '통증 부위 온찜질/냉찜질',
        content: '갑작스러운 통증에는 냉찜질을 시도해보세요.',
        image_url: 'https://example.com/guides/shoulder-02.jpg'
      },
      {
        pain_area_id: shoulder.pain_area_id,
        guide_type: '생활 습관',
        title: '작은 자세 변화',
        content: '작은 자세 변화로 통증을 줄여보세요.',
        image_url: 'https://example.com/guides/shoulder-03.jpg'
      }
    ]
  });

  // Content sections (banners)
  await prisma.content_sections.createMany({
    data: [
      { section_type: 'banner', title: '어깨 통증은 잘못된 자세...', content: '', image_url: 'https://example.com/banners/01.webp', display_order: 1 },
      { section_type: 'banner', title: '', content: '', image_url: 'https://example.com/banners/02.webp', display_order: 2 },
      { section_type: 'banner', title: '', content: '', image_url: 'https://example.com/banners/03.webp', display_order: 3 }
    ]
  });

  // Usage guides
  await prisma.usage_guides.createMany({
    data: [
      { card_number: 1, title: '사용법 1', modal_content: '간단 사용법 1', image_url: null },
      { card_number: 2, title: '사용법 2', modal_content: '간단 사용법 2', image_url: null }
    ]
  });

  // Doctor answers (expert_answers)
  const doctorAnswersPath = path.resolve(process.cwd(), 'src', 'data', 'doctor-answers.json');
  const doctorAnswers = JSON.parse(fs.readFileSync(doctorAnswersPath, 'utf8'));
  if (doctorAnswers && doctorAnswers.length > 0) {
    await prisma.expert_answers.createMany({
      data: doctorAnswers.map(a => ({
        answer_id: a.answerId,
        symptom_id: a.symptomId,
        summary: a.summary,
        full_content: '', // 상세 설명은 비워둠
        source_url: ''
      })),
      skipDuplicates: true
    });
    console.log('Doctor answers seeded.');
  }

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
