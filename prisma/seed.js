import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding start...");

  // 1. 주요 아픈 부위 (6개)
  const painAreas = [
    "어깨",
    "허리",
    "무릎",
    "목",
    "두통",
    "복통",
  ];

  for (const name of painAreas) {
    await prisma.painArea.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("PainAreas seeded");

  // 2. 세부 증상 (부위별 예시)
  const painAreaMap = await prisma.painArea.findMany();

  const symptomMap = {
    어깨: ["뻐근함", "찌릿함", "움직일 때 통증"],
    허리: ["뻐근함", "찌릿함", "움직일 때 통증"],
    무릎: ["뻐근함", "찌릿함", "움직일 때 통증"],
    목: ["뻐근함", "찌릿함", "움직일 때 통증"],
    두통: ["조이는 듯한 두통", "욱신거리는 두통", "한쪽으로 심한 두통"],
    복통: ["쥐어짜는 듯한 복통", "콕콕 찌르는 복통", "더부룩한 복통"],
  };

  for (const area of painAreaMap) {
    const symptoms = symptomMap[area.name] ?? [];
    for (const name of symptoms) {
      await prisma.symptom.upsert({
        where: {
          painAreaID_name: {
            painAreaID: area.painAreaID,
            name,
          },
        },
        update: {},
        create: {
          painAreaID: area.painAreaID,
          name,
        },
      });
    }
  }

  console.log("Symptoms seeded");
  console.log("Seeding done!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
