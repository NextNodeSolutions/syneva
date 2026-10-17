// An edge label's drawn width, estimated: SVG text cannot be measured before it is laid out, and the drawing's width must include its labels or the frame clips them (scrolling cannot reveal what lies outside the SVG). 6px a character is a generous average for the diagram's 10px sans.
const CHAR_WIDTH = 6

export function labelWidth(label: string | undefined): number {
	return label ? label.length * CHAR_WIDTH : 0
}
