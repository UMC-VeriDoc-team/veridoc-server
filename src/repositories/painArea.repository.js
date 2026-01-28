import prisma from '../config/db.config.js';

class PainAreaRepository {
    constructor(client = prisma) {
        this.client = client
    }

    // 모든 아픈 부위 조회 (정렬은 asc 를 통해 고정)
    async findAll() {
        return this.client.painArea.findMany({
            orderBy: {
                painAreaID: 'asc'
            }
        });
    }
}

export default PainAreaRepository;