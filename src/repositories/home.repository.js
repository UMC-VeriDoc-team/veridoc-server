import prisma from '../config/db.config.js';

class HomeRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  // 홈 화면용 전체 데이터 조회
  async getHomeData() {
    // banners: usage_guides에서 display_order 기준으로 정렬
    const banners = await this.client.usage_guides.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      select: {
        guide_id: true,
        title: true,
        image_url: true,
        modal_content: true
      }
    });

    // symptoms: pain_areas별 증상 조회
    const painAreas = await this.client.pain_areas.findMany({
      include: {
        symptoms: {
          select: {
            symptom_id: true,
            name: true
          }
        }
      }
    });

    const symptoms = [];
    painAreas.forEach(area => {
      area.symptoms.forEach(symptom => {
        symptoms.push({
          symptomId: Number(symptom.symptom_id),
          name: symptom.name,
          painAreaId: Number(area.pain_area_id)
        });
      });
    });

    // commonGuides: temporary_care_guides에서 임시 치료법 조회
    const commonGuides = await this.client.temporary_care_guides.findMany({
      where: { pain_areas: { is_active: true } },
      orderBy: { display_order: 'asc' },
      select: {
        guide_id: true,
        title: true,
        content: true,
        image_url: true,
        guide_type: true,
        pain_areas: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedGuides = commonGuides.map(guide => ({
      guideId: Number(guide.guide_id),
      title: guide.title,
      description: guide.content,
      imageUrl: guide.image_url,
      type: guide.guide_type,
      painAreaName: guide.pain_areas?.name
    }));

    return {
      banners: banners.map(b => ({
        id: Number(b.guide_id),
        title: b.title,
        imageUrl: b.image_url,
        modalContent: b.modal_content
      })),
      symptoms,
      commonGuides: formattedGuides
    };
  }

  // 전문의 답변 상세 조회
  async getExpertAnswerDetail(answerId) {
    const answer = await this.client.expert_answers.findUnique({
      where: { answer_id: BigInt(answerId) },
      select: {
        answer_id: true,
        symptom_id: true,
        summary: true,
        full_content: true,
        source_url: true,
        updated_at: true,
        symptoms: {
          select: {
            name: true,
            pain_area_id: true,
            pain_areas: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!answer) return null;

    // 같은 painAreaId의 다른 답변들 조회 (현재 답변 제외, 최대 2개)
    const morePosts = await this.client.expert_answers.findMany({
      where: {
        symptoms: {
          pain_area_id: answer.symptoms.pain_area_id
        },
        answer_id: {
          not: BigInt(answerId)
        }
      },
      select: {
        answer_id: true,
        symptom_id: true,
        summary: true,
        symptoms: {
          select: {
            name: true,
            pain_area_id: true
          }
        }
      },
      take: 2
    });

    return {
      answerId: Number(answer.answer_id),
      painAreaId: Number(answer.symptoms.pain_area_id),
      painAreaName: answer.symptoms.pain_areas?.name,
      symptomId: Number(answer.symptom_id),
      symptomName: answer.symptoms?.name,
      title: `${answer.symptoms?.name} 전문의 소견`,
      content: answer.full_content,
      imageUrl: null, // expert_answers에 imageUrl 필드가 없으므로 null
      sourceUrl: answer.source_url,
      updatedAt: answer.updated_at,
      morePosts: morePosts.map(post => ({
        answerId: Number(post.answer_id),
        painAreaId: Number(post.symptoms.pain_area_id),
        symptomId: Number(post.symptom_id),
        title: `${post.symptoms?.name} 전문의 소견`,
        imageUrl: null
      }))
    };
  }
}

export default HomeRepository;
