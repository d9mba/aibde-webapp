// Re-export all icons from assets/svg
export * from '@/assets/svg';

// Re-export ToolBadge smart component
export { ToolBadge } from './ToolBadge';

// ===== Smart Icon Components (with props/logic) =====
// These components have additional props beyond the base SVG

interface IconBaseProps {
    size?: number;
    className?: string;
    'aria-hidden'?: boolean;
}

// Verified Badge Icon (Blue checkmark) - hardcoded color
export function VerifiedBadge({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="#1d9bf0"
            className={`flex-shrink-0 ${className}`}
            aria-hidden="true"
        >
            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
        </svg>
    );
}

// Featured Badge Icon (Gold/Amber checkmark) - hardcoded color
export function FeaturedBadge({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="#f59e0b"
            className={`flex-shrink-0 ${className}`}
            aria-hidden="true"
        >
            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
        </svg>
    );
}

// AI Sparkle Icon (for AI Generated content) - uses currentColor
export function AiSparkleIcon({ size = 14, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M22.714 9.238l-1.214-3.238-1.214 3.238-2.286 0.762 2.286 0.762 1.214 3.238 1.214-3.238 2.286-0.762-2.286-0.762zM20.714 21.238l-1.214-3.238-1.214 3.238-2.286 0.762 2.286 0.762 1.214 3.238 1.214-3.238 2.286-0.762-2.286-0.762zM13.459 13.486l-1.959-5.487-1.959 5.487-4.541 1.514 4.541 1.514 1.959 5.486 1.959-5.486 4.541-1.514-4.541-1.514z" />
        </svg>
    );
}

// Lightning Bolt Icon (for Fast Listing)
export function LightningIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    );
}

// Star Icon (for ratings/featured) - with filled prop
interface StarIconProps extends IconBaseProps {
    filled?: boolean;
}

export function StarIcon({ size = 16, className = '', filled = true }: StarIconProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={filled ? 0 : 2}
            className={className}
            aria-hidden="true"
        >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

// Check Icon
export function CheckIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

// X/Close Icon
export function CloseIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

// Chevron Icons
export function ChevronLeftIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

export function ChevronRightIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

export function ChevronDownIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

export function ChevronUpIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <polyline points="18 15 12 9 6 15" />
        </svg>
    );
}

// External Link Icon
export function ExternalLinkIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}

// Play Icon
export function PlayIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

// Kebab/More Icon (vertical dots)
export function MoreVerticalIcon({ size = 16, className = '' }: IconBaseProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    );
}
