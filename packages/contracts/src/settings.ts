// The reviewer's preferences as both settings routes read and write them (a desk's
// `/api/desks/<id>/settings`, the hub's `/api/hub/settings`; `~/.syneva/settings.json` on a local
// hub): `{ settings: { <key>: <value> }, diffStyle }`, every key the UI's own.

// The keys of `settings` that belong to the machine rather than to the reviewer: the hub acts on
// them (it runs `editorCommand` as a program), so only the machine sets them - its own tabs, or
// the file by hand. Over a paired hub's relay (RFC 0001, 4.5) a read leaves them out and a write
// keeps the machine's values whatever its body says: the web keeps its preferences on its side
// (RFC 4.7), and whoever holds the web account must never choose what runs on the machine.
export const MACHINE_SETTINGS = ['editorCommand'] as const

export type MachineSetting = (typeof MACHINE_SETTINGS)[number]
