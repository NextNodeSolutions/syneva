import * as stylex from '@stylexjs/stylex'

// Where the page column starts, for what is placed against it from outside the column's flow
// (the close toast, fixed to the screen): past the open sidebar, or past the rail once it
// folds (foldedShell, which the frame carries while folded).
export const shellEdge = stylex.defineVars({ page: '232px' })

export const foldedShell = stylex.createTheme(shellEdge, { page: '56px' })
