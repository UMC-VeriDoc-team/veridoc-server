import prisma from '../config/db.config.js';

const findStepsByPainArea = async (painAreaId) => {
  return prisma.symptom_steps.findMany({
    where: {
      pain_area_id: painAreaId,
    },
    orderBy: {
      step_number: 'asc',
    },
  });
};

const findUserProgress = async (userId, painAreaId) => {
  return prisma.symptom_guide_progress.findUnique({
    where: {
      user_id_pain_area_id: {
        user_id: userId,
        pain_area_id: painAreaId,
      },
    },
  });
};

const hasEvent = async (userId, painAreaId, eventType) => {
  const count = await prisma.symptom_guide_events.count({
    where: {
      user_id: userId,
      pain_area_id: painAreaId,
      event_type: eventType,
    },
  });

  return count > 0;
};

const createEvent = async (userId, painAreaId, event) => {
  return prisma.symptom_guide_events.create({
    data: {
      event_type: event,

      users: {
        connect: {
          user_id: userId,
        },
      },

      pain_areas: {
        connect: {
          pain_area_id: painAreaId,
        },
      },
    },
  });
};

const updateProgress = async (userId, painAreaId, step) => {
  return prisma.symptom_guide_progress.upsert({
    where: {
      user_id_pain_area_id: {
        user_id: userId,
        pain_area_id: painAreaId,
      },
    },
    update: {
      current_step: step,
      last_visited_at: new Date(),
    },
    create: {
      user_id: userId,
      pain_area_id: painAreaId,
      current_step: step,
    },
  });
};

const resetProgress = async (userId, painAreaId) => {
  // 진행 상태 upsert (없으면 생성, 있으면 초기화)
  return prisma.symptom_guide_progress.upsert({
    where: {
      user_id_pain_area_id: {
        user_id: userId,
        pain_area_id: painAreaId,
      },
    },
    update: {
      current_step: 1,
      last_visited_at: new Date(),
    },
    create: {
      user_id: userId,
      pain_area_id: painAreaId,
      current_step: 1,
    },
  });
};

const clearEvents = async (userId, painAreaId) => {
  return prisma.symptom_guide_events.deleteMany({
    where: {
      user_id: userId,
      pain_area_id: painAreaId,
    },
  });
};

export default {
  findStepsByPainArea,
  findUserProgress,
  hasEvent,
  createEvent,
  updateProgress,
  resetProgress,
  clearEvents,
};