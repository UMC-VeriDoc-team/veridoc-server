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
				   subtitle: true,
				   content: true,
				   image_url: true,
				   duration: true,
				   source_name: true,
				   source_url: true,
				   highlighter: true,
				   pain_areas: {
					   select: {
						   pain_area_id: true,
						   name: true,
					   },
				   },
				   badges: { select: { badge_id: true, text: true } },
				   notes: { select: { note_id: true, image_url: true, bold: true, text: true } },
				   cautions: { select: { caution_id: true, icon_url: true, bold: true, text: true } },
				   helps: { select: { help_id: true, text: true } },
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
