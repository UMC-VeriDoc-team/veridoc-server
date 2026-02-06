import AgreementRepository from '../repositories/agreement.repository.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

const VALID_TYPES = ['TOS', 'PRIVACY', 'LOCATION'];

class AgreementService {
  constructor(repository = new AgreementRepository()) {
    this.repository = repository;
  }

  async agree(userID, payload) {
    const { termsOfService, privacyPolicy, locationService } = payload || {};

    if (!termsOfService || !privacyPolicy || !locationService) {
      throw new ApiError(
        400,
        errorCodes.VALIDATION_ERROR,
        '모든 약관에 동의해야 합니다. (termsOfService, privacyPolicy, locationService)',
      );
    }

    const agreementTypes = [];
    if (termsOfService) agreementTypes.push('TOS');
    if (privacyPolicy) agreementTypes.push('PRIVACY');
    if (locationService) agreementTypes.push('LOCATION');

    const { agreedAt } = await this.repository.createMany(userID, agreementTypes);

    return { agreedAt };
  }

  async getMyAgreements(userID) {
    const agreements = await this.repository.findByUserId(userID);

    return {
      termsOfService: agreements.find((a) => a.agreement_type === 'TOS') || null,
      privacyPolicy: agreements.find((a) => a.agreement_type === 'PRIVACY') || null,
      locationService: agreements.find((a) => a.agreement_type === 'LOCATION') || null,
    };
  }
}

export default AgreementService;