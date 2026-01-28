import PainAreaRepository from '../repositories/painArea.repository.js';

class PainAreaService {
    constructor(repository = new PainAreaRepository()) {
        this.repository = repository
    }
    
    // 회원가입 단계에서는 모든 아픈 부위가 보이기만 하면 되므로 단순 조회 로직만 구현
    async list() {
        return this.repository.findAll()
    }
}

export default PainAreaService;