export const EVENT_COLORS = [
  { name: 'blue',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   dot: 'bg-blue-400'   },
  { name: 'red',    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100',    dot: 'bg-red-400'    },
  { name: 'green',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100',  dot: 'bg-green-400'  },
  { name: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', dot: 'bg-purple-400' },
  { name: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-400' },
  { name: 'pink',   bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-100',   dot: 'bg-pink-400'   },
  { name: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-400' },
  { name: 'teal',   bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-100',   dot: 'bg-teal-400'   },
  { name: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', dot: 'bg-indigo-400' },
  { name: 'gray',   bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-100',   dot: 'bg-gray-400'   },
  { name: 'rose',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-100',   dot: 'bg-rose-400'   },
  { name: 'sky',    bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-100',    dot: 'bg-sky-400'    },
] as const

export type EventColorName = typeof EVENT_COLORS[number]['name']

export const COLOR_MAP = Object.fromEntries(EVENT_COLORS.map(c => [c.name, c])) as Record<string, typeof EVENT_COLORS[number]>

export const DEFAULT_COLOR: EventColorName = 'blue'
