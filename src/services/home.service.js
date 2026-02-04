import fs from 'fs';
import path from 'path';

class HomeService {
  constructor(dataPath = path.resolve(process.cwd(), 'src', 'data', 'home.json')) {
    this.dataPath = dataPath;
  }

  async getHomeData() {
    const raw = fs.readFileSync(this.dataPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed;
  }

  async getDoctorAnswerSummary(answerId) {
    // expert_answers: answer_id, symptom_id, summary
    const prisma = (await import('../config/db.config.js')).default;
    const answer = await prisma.expert_answers.findUnique({
      where: { answer_id: BigInt(answerId) },
      select: { answer_id: true, symptom_id: true, summary: true }
    });
    if (!answer) return null;
    return {
      answerId: Number(answer.answer_id),
      symptomId: Number(answer.symptom_id),
      summary: answer.summary
    };
  }
}

export default HomeService;