import type { ReactNode } from 'react'

type IconProps = { className?: string }

function Line({ children, className, viewBox = '0 0 24 24' }: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

export const HeartIcon = ({ className }: IconProps) => <Line className={className}><path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" /></Line>
export const CartIcon = ({ className }: IconProps) => <Line className={className}><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.4-1.1L20.3 8H6.2" /><circle cx="9.5" cy="19.3" r="1.2" /><circle cx="17" cy="19.3" r="1.2" /><path d="M10 11.2h7.6" /></Line>
export const ArrowIcon = ({ className }: IconProps) => <Line className={className}><path d="M4.5 12h14.5M13.5 6.5 19 12l-5.5 5.5" /></Line>
export const ChevronDownIcon = ({ className }: IconProps) => <Line className={className}><path d="m6.5 9.5 5.5 5.5 5.5-5.5" /></Line>
export const QuestionIcon = ({ className }: IconProps) => <Line className={className}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7" /><circle cx="12" cy="16.9" r=".6" fill="currentColor" /></Line>
export const MinusIcon = ({ className }: IconProps) => <Line className={className}><path d="M6 12h12" /></Line>
export const PlusIcon = ({ className }: IconProps) => <Line className={className}><path d="M6 12h12M12 6v12" /></Line>
export const HandHeartIcon = ({ className }: IconProps) => <Line className={className} viewBox="0 0 48 48"><path d="M24 20s-7-4.3-7-9.4A3.9 3.9 0 0 1 24 8.4a3.9 3.9 0 0 1 7 2.2C31 15.7 24 20 24 20Z" /><path d="M5 30h6l7 3.5h7.5a2.5 2.5 0 0 1 0 5H18" /><path d="M25.5 38.5 38 32a2.6 2.6 0 0 1 3 4.2L30 43.5H17.5L11 40.5H5" /></Line>
export const GemIcon = ({ className }: IconProps) => <Line className={className} viewBox="0 0 48 48"><path d="M14 9h20l8 10-18 21L6 19Z" /><path d="M6 19h36M19 9l-4 10 9 21 9-21-4-10" /></Line>
export const GiftIcon = ({ className }: IconProps) => <Line className={className} viewBox="0 0 48 48"><rect x="8" y="17" width="32" height="8" rx="1" /><path d="M10.5 25v16h27V25M24 17v24" /><path d="M24 17c-3-6-10-7-10-2.6 0 2.6 4 2.6 10 2.6ZM24 17c3-6 10-7 10-2.6 0 2.6-4 2.6-10 2.6Z" /></Line>
export const CrownIcon = ({ className }: IconProps) => <Line className={className} viewBox="0 0 48 48"><path d="M8 36h32M9 32 6 14l11 9 7-13 7 13 11-9-3 18Z" /><circle cx="6" cy="13" r="2" /><circle cx="42" cy="13" r="2" /><circle cx="24" cy="9" r="2" /></Line>
export const LeafIcon = ({ className }: IconProps) => <Line className={className}><path d="M5 19C5 10 10 5 19.5 4.5 19 14 14 19 5 19Z" /><path d="M5 19 14 10M9 15h4M11.5 12.5V9" /></Line>
export const HandIcon = ({ className }: IconProps) => <Line className={className}><path d="M8 12V5.5a1.3 1.3 0 0 1 2.6 0V11M10.6 10V4.3a1.3 1.3 0 0 1 2.6 0V11M13.2 10V5.3a1.3 1.3 0 0 1 2.6 0V12M15.8 11V7.8a1.3 1.3 0 0 1 2.6 0V14c0 4-2.6 6.5-6.2 6.5-2.6 0-4-1.2-5.6-3.4L4.4 13.5a1.4 1.4 0 0 1 2.2-1.6L8 13.6" /></Line>
export const BoxIcon = ({ className }: IconProps) => <Line className={className}><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5Z" /><path d="M4 7.5 12 11l8-3.5M12 11v9" /></Line>
export const InstagramIcon = ({ className }: IconProps) => <Line className={className}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" fill="currentColor" /></Line>
/** Outline like Instagram and Mail, so the social icons share one drawing style and stroke. */
export const YouTubeIcon = ({ className }: IconProps) => <Line className={className}><rect x="3" y="5.5" width="18" height="13" rx="4" /><path d="m10.2 9.4 4.4 2.6-4.4 2.6Z" /></Line>
/** Rating star (Flaticon Animals and nature, pack 616407, 084-star), supplied privately at build time. */
export const StarIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
    <path fill="currentColor" d={__RATING_STAR_PATH__} />
  </svg>
)
export const MailIcon =({ className }: IconProps) => <Line className={className}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></Line>

/** Small hand-drawn sprig used beside headings and the Japanese wordmark. */
export const SprigIcon = ({ className }: IconProps) => (
  <Line className={className} viewBox="0 0 40 24">
    <path d="M3 21C12 18 22 12 37 3" />
    <path d="M12 17.2c-1.4-3.6-.6-6.6 2-8.6 1 3.4.3 6.4-2 8.6ZM19 13c-1-3.8.2-6.8 3-8.4.7 3.6-.4 6.5-3 8.4ZM26 9c-.4-3.4 1-6 3.6-7.2.3 3.3-1 5.8-3.6 7.2Z" />
    <path d="M12 17.2c3.4.6 6.4-.2 8.4-2.6-3.4-.8-6.4 0-8.4 2.6ZM19 13c3.4.4 6.2-.6 8-3-3.4-.6-6.2.4-8 3ZM26 9c3 .2 5.6-.8 7.2-3-3-.4-5.6.6-7.2 3Z" />
  </Line>
)

/** Decorative leafy branch for section corners. */
export function Branch({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 160 200" aria-hidden="true" focusable="false">
      <path d="M8 196C40 150 70 100 150 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {[
        [34, 158, -30], [52, 128, 20], [66, 108, -40], [84, 84, 25], [98, 66, -45], [116, 46, 30], [130, 28, -50],
      ].map(([x, y, r], index) => (
        <path key={index} d="M0 0C10-14 30-16 44-8 32 6 12 10 0 0Z" fill="currentColor" transform={`translate(${x} ${y}) rotate(${r - 25})`} />
      ))}
    </svg>
  )
}

/** Thin rule with a central ornament (heart, star or knot). */
export function OrnamentRule({ className, kind = 'star' }: IconProps & { kind?: 'heart' | 'star' | 'knot' }) {
  return (
    <div className={`atelier-rule atelier-rule--${kind}${className ? ` ${className}` : ''}`} aria-hidden="true">
      <span />
      {kind === 'heart' ? <HeartIcon /> : kind === 'knot' ? (
        <Line viewBox="0 0 32 32"><circle cx="11" cy="11" r="6.5" /><circle cx="21" cy="11" r="6.5" /><circle cx="11" cy="21" r="6.5" /><circle cx="21" cy="21" r="6.5" /></Line>
      ) : (
        <Line viewBox="0 0 24 24"><path d="M12 4c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z" /></Line>
      )}
      <span />
    </div>
  )
}

/** Mountain-and-waves seal used in the product quote box. */
export const SealIcon = ({ className }: IconProps) => (
  <Line className={className} viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="28" />
    <path d="M12 38 25 21l6 8 5-6 16 15" />
    <path d="M22 25.5h6M12 44c4-2.6 7-2.6 10 0s7 2.6 10 0 7-2.6 10 0 7 2.6 10 0M16 49c3.4-2 6-2 8.6 0s6 2 8.6 0 6-2 8.6 0 5 2 7.6 0" />
  </Line>
)
