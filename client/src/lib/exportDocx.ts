import {
	AlignmentType,
	BorderStyle,
	Document,
	Packer,
	Paragraph,
	TabStopType,
	TextRun,
} from 'docx'
import type { Resume } from '@/types'

/**
 * Builds and triggers a download of the candidate's current in-app edited resume
 * as a standard Microsoft Word (.docx) document that they can edit and format.
 */
export async function exportResumeToDocx(resume: Resume): Promise<void> {
	const doc = createResumeDocx(resume)
	const blob = await Packer.toBlob(doc)

	const safeName =
		(resume.contact.name || 'Resume')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '') || 'resume'

	const filename = `${safeName}_resume.docx`

	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function createSectionHeading(title: string): Paragraph {
	return new Paragraph({
		children: [
			new TextRun({
				text: title.toUpperCase(),
				bold: true,
				size: 21,
				font: 'Calibri',
				color: '222222',
			}),
		],
		border: {
			bottom: {
				color: 'CCCCCC',
				space: 2,
				style: BorderStyle.SINGLE,
				size: 6,
			},
		},
		spacing: {
			before: 220,
			after: 80,
		},
	})
}

function createResumeDocx(resume: Resume): Document {
	const children: Paragraph[] = []

	// --- 1. Header (Name & Contact) ---
	const candidateName = resume.contact.name?.trim() || 'Resume'
	children.push(
		new Paragraph({
			children: [
				new TextRun({
					text: candidateName,
					bold: true,
					size: 36, // 18pt
					font: 'Calibri',
					color: '111111',
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 60 },
		}),
	)

	// Contact info items
	const contactItems: string[] = []
	if (resume.contact.phone?.trim()) contactItems.push(resume.contact.phone.trim())
	if (resume.contact.email?.trim()) contactItems.push(resume.contact.email.trim())
	if (resume.contact.location?.trim()) contactItems.push(resume.contact.location.trim())
	if (resume.contact.links?.length) {
		for (const link of resume.contact.links) {
			if (link.trim()) contactItems.push(link.trim())
		}
	}

	if (contactItems.length > 0) {
		children.push(
			new Paragraph({
				children: [
					new TextRun({
						text: contactItems.join('  •  '),
						size: 19,
						font: 'Calibri',
						color: '555555',
					}),
				],
				alignment: AlignmentType.CENTER,
				spacing: { after: 180 },
			}),
		)
	}

	// --- 2. Summary ---
	if (resume.summary?.trim()) {
		children.push(createSectionHeading('Professional Summary'))
		children.push(
			new Paragraph({
				children: [
					new TextRun({
						text: resume.summary.trim(),
						size: 20,
						font: 'Calibri',
						color: '333333',
					}),
				],
				spacing: { after: 120 },
			}),
		)
	}

	// --- 3. Experience ---
	if (resume.experience?.length) {
		children.push(createSectionHeading('Experience'))

		for (const exp of resume.experience) {
			const dateStr =
				exp.startDate || exp.endDate
					? `${exp.startDate || ''} – ${exp.isCurrent ? 'Present' : exp.endDate || ''}`.trim()
					: ''

			const headerRuns: TextRun[] = [
				new TextRun({
					text: exp.title || 'Role',
					bold: true,
					size: 20,
					font: 'Calibri',
					color: '111111',
				}),
			]

			if (exp.company) {
				headerRuns.push(
					new TextRun({
						text: ` | ${exp.company}`,
						size: 20,
						font: 'Calibri',
						color: '333333',
					}),
				)
			}

			if (exp.location) {
				headerRuns.push(
					new TextRun({
						text: ` (${exp.location})`,
						size: 19,
						font: 'Calibri',
						color: '666666',
						italics: true,
					}),
				)
			}

			if (dateStr) {
				headerRuns.push(new TextRun({ text: '\t' }))
				headerRuns.push(
					new TextRun({
						text: dateStr,
						size: 19,
						font: 'Calibri',
						color: '666666',
						italics: true,
					}),
				)
			}

			children.push(
				new Paragraph({
					children: headerRuns,
					tabStops: [{ type: TabStopType.RIGHT, position: 10800 }],
					spacing: { before: 100, after: 40 },
				}),
			)

			// Bullets
			for (const bullet of exp.bullets) {
				if (!bullet.trim()) continue
				children.push(
					new Paragraph({
						children: [
							new TextRun({
								text: bullet.trim(),
								size: 20,
								font: 'Calibri',
								color: '333333',
							}),
						],
						bullet: { level: 0 },
						spacing: { after: 30 },
					}),
				)
			}
		}
	}

	// --- 4. Projects ---
	if (resume.projects?.length) {
		children.push(createSectionHeading('Projects'))

		for (const project of resume.projects) {
			const projectRuns: TextRun[] = [
				new TextRun({
					text: project.name || 'Project',
					bold: true,
					size: 20,
					font: 'Calibri',
					color: '111111',
				}),
			]

			if (project.technologies?.length) {
				projectRuns.push(
					new TextRun({
						text: ` | ${project.technologies.join(', ')}`,
						italics: true,
						size: 19,
						font: 'Calibri',
						color: '666666',
					}),
				)
			}

			children.push(
				new Paragraph({
					children: projectRuns,
					spacing: { before: 100, after: 40 },
				}),
			)

			if (project.description?.trim()) {
				children.push(
					new Paragraph({
						children: [
							new TextRun({
								text: project.description.trim(),
								size: 20,
								font: 'Calibri',
								color: '444444',
							}),
						],
						spacing: { after: 30 },
					}),
				)
			}

			for (const bullet of project.bullets) {
				if (!bullet.trim()) continue
				children.push(
					new Paragraph({
						children: [
							new TextRun({
								text: bullet.trim(),
								size: 20,
								font: 'Calibri',
								color: '333333',
							}),
						],
						bullet: { level: 0 },
						spacing: { after: 30 },
					}),
				)
			}
		}
	}

	// --- 5. Education ---
	if (resume.education?.length) {
		children.push(createSectionHeading('Education'))

		for (const edu of resume.education) {
			const eduDegreeParts: string[] = []
			if (edu.degree) eduDegreeParts.push(edu.degree)
			if (edu.field) eduDegreeParts.push(edu.field)
			const degreeStr = eduDegreeParts.join(' in ')

			const eduRuns: TextRun[] = [
				new TextRun({
					text: edu.school || 'University',
					bold: true,
					size: 20,
					font: 'Calibri',
					color: '111111',
				}),
			]

			if (degreeStr) {
				eduRuns.push(
					new TextRun({
						text: ` — ${degreeStr}`,
						size: 20,
						font: 'Calibri',
						color: '333333',
					}),
				)
			}

			if (edu.gpa) {
				eduRuns.push(
					new TextRun({
						text: ` (GPA: ${edu.gpa})`,
						size: 19,
						font: 'Calibri',
						color: '666666',
					}),
				)
			}

			if (edu.graduationDate) {
				eduRuns.push(new TextRun({ text: '\t' }))
				eduRuns.push(
					new TextRun({
						text: edu.graduationDate,
						italics: true,
						size: 19,
						font: 'Calibri',
						color: '666666',
					}),
				)
			}

			children.push(
				new Paragraph({
					children: eduRuns,
					tabStops: [{ type: TabStopType.RIGHT, position: 10800 }],
					spacing: { before: 80, after: 40 },
				}),
			)
		}
	}

	// --- 6. Skills ---
	if (resume.skills?.length) {
		children.push(createSectionHeading('Technical Skills'))
		children.push(
			new Paragraph({
				children: [
					new TextRun({
						text: resume.skills.join('  •  '),
						size: 20,
						font: 'Calibri',
						color: '333333',
					}),
				],
				spacing: { after: 60 },
			}),
		)
	}

	// --- 7. Certifications ---
	if (resume.certifications?.length) {
		children.push(createSectionHeading('Certifications'))
		for (const cert of resume.certifications) {
			if (!cert.trim()) continue
			children.push(
				new Paragraph({
					children: [
						new TextRun({
							text: cert.trim(),
							size: 20,
							font: 'Calibri',
							color: '333333',
						}),
					],
					bullet: { level: 0 },
					spacing: { after: 30 },
				}),
			)
		}
	}

	return new Document({
		sections: [
			{
				properties: {
					page: {
						margin: {
							top: 720, // 0.5 in
							right: 720,
							bottom: 720,
							left: 720,
						},
					},
				},
				children,
			},
		],
	})
}
