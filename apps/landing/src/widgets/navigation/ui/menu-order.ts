// A menu row's place in its panel: rows stagger in on the panel's progress
// by it (rowStagger in menu.styles.ts reads --menu-order).
export const menuOrder = (index: number): { style: string } => ({
	style: `--menu-order:${index}`,
})
