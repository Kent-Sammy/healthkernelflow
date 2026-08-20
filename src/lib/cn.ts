import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge ships pattern-matching for Tailwind's BUILT-IN scales
 * only. It has no way to see the custom `@theme` font-size tokens defined
 * in `index.css` (text-display, text-h1 … text-overline) — so by default
 * it lumps unrecognized `text-*` classes into the same conflict group as
 * `text-color` utilities like `text-white`. That silently drops whichever
 * one appears second in the merged string (e.g. a Button's `text-white`
 * variant class getting removed by its own `text-body-sm` size class,
 * leaving invisible text on a dark background).
 *
 * Registering our type-scale tokens under the built-in `font-size` group
 * fixes that at the root — every component using `cn()` gets it for free,
 * instead of every callsite having to work around the collision.
 */
const TYPE_SCALE_TOKENS = ['display', 'h1', 'h2', 'h3', 'h4', 'body-lg', 'body', 'body-sm', 'caption', 'overline']

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_SCALE_TOKENS }],
    },
  },
})

/**
 * Merge conditional class names and resolve Tailwind class conflicts.
 * Used by every component in the design system instead of raw template
 * strings so variant/override className props behave predictably.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
