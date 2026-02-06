import TermsRepository from '../repositories/terms.repository.js';
import termsConfig from '../config/terms.config.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class TermsService {
  constructor(repository = new TermsRepository(), config = termsConfig) {
    this.repository = repository;
    this.config = config;
  }

  async createAgreement(userId, payload) {
    const {
      serviceAgreed,
      serviceVersion,
      privacyAgreed,
      privacyVersion,
      locationAgreed,
      locationVersion,
    } = payload || {};

    if (serviceAgreed !== true || privacyAgreed !== true || locationAgreed !== true) {
      throw new ApiError(
        400,
        errorCodes.REQUIRED_TERMS_MISSING,
        '필수 이용약관에 동의해야 서비스 이용이 가능합니다.',
      );
    }

    const expectedServiceVersion = this.config?.serviceVersion;
    const expectedPrivacyVersion = this.config?.privacyVersion;
    const expectedLocationVersion = this.config?.locationVersion;

    if (!expectedServiceVersion || !expectedPrivacyVersion || !expectedLocationVersion) {
      throw new ApiError(
        500,
        errorCodes.SERVER_ERROR,
        '약관 버전 설정이 필요합니다.',
      );
    }

    if (
      serviceVersion !== expectedServiceVersion ||
      privacyVersion !== expectedPrivacyVersion ||
      locationVersion !== expectedLocationVersion
    ) {
      throw new ApiError(
        400,
        errorCodes.INVALID_TERMS_VERSION,
        '유효하지 않은 약관 버전 정보입니다.',
      );
    }

    return this.repository.upsertAgreement(userId, {
      service_agreed: true,
      service_version: serviceVersion,
      privacy_agreed: true,
      privacy_version: privacyVersion,
      location_agreed: true,
      location_version: locationVersion,
    });
  }
}

export default TermsService;
