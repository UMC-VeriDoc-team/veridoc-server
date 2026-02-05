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
    // 한 유저당 통증부위는 1개만 가질 수 있다고 가정
    const userPainArea = await this.client.user_pain_areas.findFirst({
      where: { user_id: BigInt(userId) },
      select: { pain_area_id: true }
    });

    const painAreaId = userPainArea?.pain_area_id;

    // 사용자가 선택한(매핑된) 증상 조회
    const userSymptoms = await this.client.user_symptoms.findMany({
      where: { user_id: BigInt(userId) },
      select: { symptom_id: true }
    });

    const symptomIds = userSymptoms.map(us => us.symptom_id);

    if (!painAreaId) {
      // 선택한 통증 부위가 없으면 빈 데이터 반환 (요청된 포맷 유지)
      return {
        banners: [],
        symptoms: [],
        commonGuides: []
      };
    }

    // banners: 타이틀은 통증 부위로 통일, 이미지는 3개로 구성
    const primaryPainArea = await this.client.pain_areas.findUnique({
      where: { pain_area_id: painAreaId },
      select: { pain_area_id: true, name: true }
    });

    const bannerImages = await this.client.usage_guides.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      take: 3,
      select: { guide_id: true, image_url: true }
    });

    const bannerTitleSuffix = process.env.BANNER_TITLE_SUFFIX || ' 통증은 잘못된 자세...';
    const bannerTitle = `${primaryPainArea?.name || '통증 부위'}${bannerTitleSuffix}`;
    // 요청된 포맷: 첫 항목은 타이틀(텍스트), 이후 3개의 이미지 블록
    const banners = [{ title: bannerTitle }];
    for (let i = 0; i < 3; i++) {
      const b = bannerImages[i];
      banners.push({ id: b ? Number(b.guide_id) : i + 1, imageUrl: b ? b.image_url : null });
    }

    // symptoms: 사용자가 선택한 통증 부위의 증상만 조회
    const symptoms = await this.client.symptoms.findMany({
      where: { pain_area_id: painAreaId },
      orderBy: { symptom_id: 'asc' },
      take: 3,
      select: { symptom_id: true, name: true }
    });

    const formattedSymptoms = symptoms.map(symptom => ({
      symptomId: Number(symptom.symptom_id),
      name: symptom.name
    }));

    // Ensure exactly 3 symptoms in response (pad if necessary)
    while (formattedSymptoms.length < 3) {
      formattedSymptoms.push({ symptomId: null, name: null });
    }

    // commonGuides: 사용자가 선택한 통증 부위의 임시 치료법 조회
    const commonGuides = await this.client.temporary_care_guides.findMany({
      where: { pain_area_id: painAreaId },
      orderBy: { display_order: 'asc' },
      take: 3,
      select: { guide_id: true, title: true, content: true, image_url: true, guide_type: true }
    });

    const formattedGuides = commonGuides.map(guide => {
      const meta = GUIDE_META_BY_TYPE[guide.guide_type] || { badges: [], duration: null };
      // 복원: seed나 DB에 이스케이프된 '\n'이 들어있을 수 있어 실제 줄바꿈으로 변환
      const description = guide.content ? String(guide.content).replace(/\\n/g, '\n') : null;
      return {
        guideId: Number(guide.guide_id),
        title: guide.title,
        badges: meta.badges,
        description,
        imageUrl: guide.image_url,
        type: guide.guide_type,
        duration: meta.duration
      };
    });

    // pad to 3 guides if needed
    while (formattedGuides.length < 3) {
      formattedGuides.push({ guideId: null, title: null, badges: [], description: null, imageUrl: null, type: null, duration: null });
    }

    return {
      painAreaId: Number(primaryPainArea.pain_area_id),
      painAreaName: primaryPainArea.name,
      banners,
      symptoms: formattedSymptoms,
      commonGuides: formattedGuides
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
            pain_areas: { select: { name: true } }
          }
        }
      }
    });

    if (!answer) return null;
    if (!allowedSymptomIds.some(id => id === answer.symptom_id)) return null;

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
            pain_areas: { select: { name: true } }
          }
        }
      }
    });

    if (!answer) return null;
    if (!allowedSymptomIds.some(id => id === answer.symptom_id)) return null;

    const morePosts = await this.client.expert_answers.findMany({
      where: {
        symptoms: { pain_area_id: answer.symptoms.pain_area_id },
        answer_id: { not: BigInt(answerId) }
      },
      select: {
        answer_id: true,
        symptom_id: true,
        summary: true,
        symptoms: { select: { name: true, pain_area_id: true } }
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
      imageUrl: null,
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
  // 홈 화면용 전체 데이터 조회 (사용자 필터링)
  async getHomeData(userId) {
    // 한 유저당 통증부위는 1개만 가질 수 있다고 가정
    const userPainArea = await this.client.user_pain_areas.findFirst({
      where: { user_id: BigInt(userId) },
      select: { pain_area_id: true }
    });

    const painAreaId = userPainArea?.pain_area_id;

    // 사용자가 선택한(매핑된) 증상 조회
    const userSymptoms = await this.client.user_symptoms.findMany({
      where: { user_id: BigInt(userId) },
      select: { symptom_id: true }
    });

    const symptomIds = userSymptoms.map(us => us.symptom_id);

    if (!painAreaId) {
      // 선택한 통증 부위가 없으면 빈 데이터 반환 (요청된 포맷 유지)
      return {
        banners: [],
        symptoms: [],
        commonGuides: []
      };
    }

    // banners: 타이틀은 통증 부위로 통일, 이미지는 3개로 구성
    const primaryPainArea = await this.client.pain_areas.findUnique({
      where: { pain_area_id: painAreaId },
      select: { pain_area_id: true, name: true }
    });

    const bannerImages = await this.client.usage_guides.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      take: 3,
      select: { guide_id: true, image_url: true }
    });

    const bannerTitleSuffix = process.env.BANNER_TITLE_SUFFIX || ' 통증은 잘못된 자세...';
    const bannerTitle = `${primaryPainArea?.name || '통증 부위'}${bannerTitleSuffix}`;
    // 요청된 포맷: 첫 항목은 타이틀(텍스트), 이후 3개의 이미지 블록
    const banners = [{ title: bannerTitle }];
    for (let i = 0; i < 3; i++) {
      const b = bannerImages[i];
      banners.push({ id: b ? Number(b.guide_id) : i + 1, imageUrl: b ? b.image_url : null });
    }

    // symptoms: 사용자가 선택한 통증 부위의 증상만 조회
    const symptoms = await this.client.symptoms.findMany({
      where: { pain_area_id: painAreaId },
      orderBy: { symptom_id: 'asc' },
      take: 3,
      select: { symptom_id: true, name: true }
    });

    const formattedSymptoms = symptoms.map(symptom => ({
      symptomId: Number(symptom.symptom_id),
      name: symptom.name
    }));

    // Ensure exactly 3 symptoms in response (pad if necessary)
    while (formattedSymptoms.length < 3) {
      formattedSymptoms.push({ symptomId: null, name: null });
    }

    // commonGuides: 사용자가 선택한 통증 부위의 임시 치료법 조회
    const commonGuides = await this.client.temporary_care_guides.findMany({
      where: { pain_area_id: painAreaId },
>>>>>>> Stashed changes
      orderBy: { display_order: 'asc' },
      take: 3,
      select: { guide_id: true, title: true, content: true, image_url: true, guide_type: true }
    });

<<<<<<< Updated upstream
    const formattedGuides = commonGuides.map(guide => ({
      guideId: Number(guide.guide_id),
      title: guide.title,
      description: guide.content,
      imageUrl: guide.image_url,
      type: guide.guide_type,
      painAreaName: guide.pain_areas?.name
    }));
=======
    const formattedGuides = commonGuides.map(guide => {
      const meta = GUIDE_META_BY_TYPE[guide.guide_type] || { badges: [], duration: null };
      // 복원: seed나 DB에 이스케이프된 '\n'이 들어있을 수 있어 실제 줄바꿈으로 변환
      const description = guide.content ? String(guide.content).replace(/\\n/g, '\n') : null;
      return {
        guideId: Number(guide.guide_id),
        title: guide.title,
        badges: meta.badges,
        description,
        imageUrl: guide.image_url,
        type: guide.guide_type,
        duration: meta.duration
      };
    });

    // pad to 3 guides if needed
    while (formattedGuides.length < 3) {
      formattedGuides.push({ guideId: null, title: null, badges: [], description: null, imageUrl: null, type: null, duration: null });
    }
>>>>>>> Stashed changes

    // doctorAnswers removed from homes response to force clients
    // to call the dedicated summary/detail endpoints.
    const formattedAnswers = [];

    return {
<<<<<<< Updated upstream
      banners: banners.map(b => ({
        id: Number(b.guide_id),
        title: b.title,
        imageUrl: b.image_url,
        modalContent: b.modal_content
      })),
      symptoms,
      commonGuides: formattedGuides
=======
      painAreaId: Number(primaryPainArea.pain_area_id),
      painAreaName: primaryPainArea.name,
      banners,
      symptoms: formattedSymptoms,
      commonGuides: formattedGuides
    };
>>>>>>> Stashed changes
    };
  }

  // 전문의 답변 조회
  async getExpertAnswer(answerId) {
    const answer = await this.client.expert_answers.findUnique({
      where: { answer_id: BigInt(answerId) },
      select: {
        answer_id: true,
        symptom_id: true,
        summary: true,
        full_content: true,
        source_url: true,
        symptoms: {
          select: {
            name: true,
            pain_area_id: true
          }
        }
      }
    });

    if (!answer) return null;

    return {
      answerId: Number(answer.answer_id),
      symptomId: Number(answer.symptom_id),
      symptomName: answer.symptoms?.name,
      summary: answer.summary,
      fullContent: answer.full_content,
      sourceUrl: answer.source_url
    };
  }
}

export default HomeRepository;
