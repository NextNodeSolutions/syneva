import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const box = (
	fill: string,
	stroke: string,
): { fill: string; stroke: string } => ({ fill, stroke })

// Product drawings: the exploded desk layers (isometric sheets), the desk's
// anatomy, the guide sort, the question sequence and the plan queue.
export const productArt = stylex.create({
	isoFace: {
		fill: color['--white'],
		stroke: color['--line-strong'],
		strokeWidth: 1.1,
		strokeLinejoin: 'round',
	},
	isoEdge: {
		fill: color['--iso-side'],
		stroke: color['--line-strong'],
		strokeLinejoin: 'round',
	},
	faceGuide: { stroke: color['--accent'] },
	edgeGuide: box(color['--iso-wash-side'], color['--accent']),
	faceThread: {
		fill: `color-mix(in srgb, ${color['--wash-tint']} 50%, ${color['--white']})`,
	},
	faceVerdict: box(color['--mint'], color['--green']),
	edgeVerdict: box(color['--iso-mint-side'], color['--green']),
	isoBar: { fill: color['--line-strong'] },
	isoBarFaint: { fill: color['--line'] },
	isoBarAccent: { fill: color['--accent'] },
	isoMarkAdd: { fill: color['--green'] },
	isoMarkDel: { fill: color['--signal'] },
	isoNum: { fill: color['--accent'] },
	isoBand: { fill: color['--wash'] },
	isoBubble: box(color['--white'], color['--line-strong']),
	isoRail: { fill: color['--accent'] },
	isoYes: {
		fill: color['--white'],
		stroke: color['--green'],
		strokeWidth: 1.5,
	},
	isoNo: {
		fill: color['--wash'],
		stroke: color['--accent'],
		strokeWidth: 1.5,
	},
	anatomyNumber: { fill: color['--accent'] },
	anatomyNumberText: {
		font: `600 10px ${font['--mono']}`,
		fill: color['--white'],
	},
	anatomyKey: { fill: color['--accent'], fontWeight: 600 },
	anatomySend: { fill: color['--accent'] },
	guideChip: box(color['--white'], color['--ink']),
	guideChipOther: box(color['--paper'], color['--line-strong']),
	guideGhost: {
		fill: 'none',
		stroke: color['--line-strong'],
		strokeDasharray: '3 3',
	},
	lane: box(color['--white'], color['--line-strong']),
	laneRule: {
		stroke: color['--line-strong'],
		strokeDasharray: '2 4',
		fill: 'none',
	},
	sequenceLine: { fill: 'none', strokeWidth: 1.4 },
	lineAccent: { stroke: color['--accent'] },
	lineGreen: { stroke: color['--green'] },
	lineMuted: { stroke: color['--line-strong'], strokeDasharray: '4 3' },
	headAccent: { fill: color['--accent'] },
	headGreen: { fill: color['--green'] },
	headMuted: { fill: color['--line-strong'] },
	riskCell: box(color['--white'], color['--line-strong']),
	riskHigh: box(color['--accent'], color['--accent']),
	riskMid: {
		fill: color['--signal'],
		stroke: color['--signal'],
		fillOpacity: 0.55,
	},
	riskLow: box(color['--green'], color['--green']),
	queueMark: { fill: color['--line'] },
	protoTag: box(color['--wash'], color['--accent']),
})
