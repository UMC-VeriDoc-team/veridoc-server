import prisma from '../config/db.config.js';

const GUIDE_META_BY_TYPE = {
  '스트레칭/찜질': {
    badges: ['집 · 사무실', '하루 1~2회'],
    duration: '약 10분 소요'
  },
  '생활 습관': {
    badges: ['작은 자세 변화', '하루 여러 회'],
    duration: '약 1분 소요'
  }
};

class HomeRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  // 홈 화면용 전체 데이터 조회 (사용자 필터링)
  async getHomeData(userId) {
    // 사용자가 선택한 통증 부위 조회
    const userPainAreas = await this.client.user_pain_areas.findMany({
      where: { user_id: BigInt(userId) },
      select: { pain_area_id: true }
    });

    const painAreaIds = userPainAreas.map(upa => upa.pain_area_id);

    // 사용자가 선택한 증상 조회
    const userSymptoms = await this.client.user_symptoms.findMany({
      where: { user_id: BigInt(userId) },
      select: { symptom_id: true }
    });

    const symptomIds = userSymptoms.map(us => us.symptom_id);

    if (painAreaIds.length === 0) {
      // 선택한 통증 부위가 없으면 빈 데이터 반환
      return {
        banners: [],
        symptoms: [],
        commonGuides: [],
        doctorAnswers: []
      };
    }

    // banners: 타이틀은 통증 부위로 통일, 이미지는 3개로 구성
    const primaryPainArea = await this.client.pain_areas.findFirst({
      where: {
        pain_area_id: {
          in: painAreaIds
        }
      },
      select: {
        pain_area_id: true,
        name: true
      }
    });

    const bannerImages = await this.client.usage_guides.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      take: 3,
      select: {
        guide_id: true,
        image_url: true
      }
    });

    const bannerTitleSuffix = process.env.BANNER_TITLE_SUFFIX || ' 통증은 잘못된 자세...';
    const bannerTitle = `${primaryPainArea?.name || '통증 부위'}${bannerTitleSuffix}`;
    const banners = bannerImages.map((b, index) => ({
      id: Number(b.guide_id) || index + 1,
      title: bannerTitle,
      imageUrl: b.image_url
    }));

    while (banners.length < 3) {
      banners.push({
        id: banners.length + 1,
        title: bannerTitle,
        imageUrl: null
      });
    }

    // symptoms: 사용자가 선택한 통증 부위의 증상만 조회
    const symptoms = await this.client.symptoms.findMany({
      where: {
        pain_area_id: {
          in: painAreaIds
        }
      },
      select: {
        symptom_id: true,
        name: true,
        pain_area_id: true,
        pain_areas: {
          select: { name: true }
        }
      }
    });

    const formattedSymptoms = symptoms.map(symptom => ({
      symptomId: Number(symptom.symptom_id),
      name: symptom.name
    }));

    // commonGuides: 사용자가 선택한 통증 부위의 임시 치료법 조회
    const commonGuides = await this.client.temporary_care_guides.findMany({
      where: {
        pain_area_id: {
          in: painAreaIds
        }
      },
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

    const formattedGuides = commonGuides.map(guide => {
      const meta = GUIDE_META_BY_TYPE[guide.guide_type] || {
        badges: [],
        duration: null
      };

      return {
        guideId: Number(guide.guide_id),
        title: guide.title,
        badges: meta.badges,
        description: guide.content,
        imageUrl: guide.image_url,
        type: guide.guide_type,
        duration: meta.duration
      };
    });

    let formattedAnswers = [];
    if (symptomIds.length > 0) {
      // expertAnswers: 사용자가 선택한 증상의 전문의 답변 조회
      const expertAnswers = await this.client.expert_answers.findMany({
        where: {
          symptom_id: {
            in: symptomIds
          }
        },
        select: {
          answer_id: true,
          summary: true,
          symptom_id: true,
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

      formattedAnswers = expertAnswers.map(answer => ({
        answerId: Number(answer.answer_id),
        symptomId: Number(answer.symptom_id),
        symptomName: answer.symptoms?.name,
        painAreaId: Number(answer.symptoms.pain_area_id),
        painAreaName: answer.symptoms.pain_areas?.name,
        summary: answer.summary
      }));
    }

    return {
      banners,
      symptoms: formattedSymptoms,
      commonGuides: formattedGuides,
      doctorAnswers: formattedAnswers
    };
  }

  // 전문의 답변 요약본 조회 (사용자 필터링)
  async getExpertAnswerSummary(answerId, userId) {
    // 사용자가 선택한 증상 ID 조회
    const userSymptoms = await this.client.user_symptoms.findMany({
      where: { user_id: BigInt(userId) },
      select: { symptom_id: true }
    });

    const allowedSymptomIds = userSymptoms.map(us => us.symptom_id);

    // 전문의 답변 조회
    const answer = await this.client.expert_answers.findUnique({
      where: { answer_id: BigInt(answerId) },
      select: {
        answer_id: true,
        symptom_id: true,
        summary: true,
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

    // 사용자가 선택한 증상에 포함되는지 확인
    if (!allowedSymptomIds.some(id => id === answer.symptom_id)) {
      return null;
    }

    return {
      answerId: Number(answer.answer_id),
      painAreaId: Number(answer.symptoms.pain_area_id),
      painAreaName: answer.symptoms.pain_areas?.name,
      symptomId: Number(answer.symptom_id),
      symptomName: answer.symptoms?.name,
      summary: answer.summary,
      updatedAt: answer.updated_at
    };
  }

  // 전문의 답변 상세 조회 (사용자 필터링)
  async getExpertAnswerDetail(answerId, userId) {
    // 사용자가 선택한 증상 ID 조회
    const userSymptoms = await this.client.user_symptoms.findMany({
      where: { user_id: BigInt(userId) },
      select: { symptom_id: true }
    });

    const allowedSymptomIds = userSymptoms.map(us => us.symptom_id);

    // 사용자가 선택한 통증 부위 조회
    const userPainAreas = await this.client.user_pain_areas.findMany({
      where: { user_id: BigInt(userId) },
      select: { pain_area_id: true }
    });

    const allowedPainAreaIds = userPainAreas.map(upa => upa.pain_area_id);

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

    // 사용자가 선택한 증상에 포함되는지 확인
    if (!allowedSymptomIds.some(id => id === answer.symptom_id)) {
      return null;
    }

    // 사용자가 선택한 통증 부위의 다른 답변들 조회 (현재 답변 제외, 최대 2개)
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
