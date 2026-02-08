import prisma from "../config/db.config.js";

class TemporaryGuideRepository {
	constructor(client = prisma) {
		this.client = client;
	}

	async findGuideById(guideId) {
		return this.client.temporary_care_guides.findUnique({
			where: { guide_id: BigInt(guideId) },
			select: {
				guide_id: true,
				pain_area_id: true,
				guide_type: true,
				title: true,
				content: true,
				image_url: true,
				pain_areas: {
					select: {
						pain_area_id: true,
						name: true,
					},
				},
			},
		});
	}

	async findMoreGuidesByPainArea(painAreaId, excludeGuideId, limit = 2) {
		return this.client.temporary_care_guides.findMany({
			where: {
				pain_area_id: BigInt(painAreaId),
				guide_id: {
					not: BigInt(excludeGuideId),
				},
			},
			orderBy: {
				display_order: "asc",
			},
			take: limit,
			select: {
				guide_id: true,
				title: true,
				image_url: true,
				pain_area_id: true,
			},
		});
	}

	async findGuideIdList() {
		return this.client.temporary_care_guides.findMany({
			orderBy: { guide_id: "asc" },
			select: {
				guide_id: true,
				pain_areas: {
					select: {
						name: true,
					},
				},
			},
		});
	}
}

export default TemporaryGuideRepository;
