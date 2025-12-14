'use client';

import { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'teamColor';
  children: ReactNode;
  icon?: LucideIcon;
  teamColor?: string;
}

export const Button = ({
  variant = 'primary',
  children,
  icon: Icon,
  teamColor,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses = 'font-medium text-sm cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-accent-primary text-white px-6 py-3 rounded-lg hover:bg-accent-hover hover:-translate-y-0.5',
    secondary: 'bg-accent-bg text-accent-secondary border border-accent-border px-5 py-2.5 rounded-md hover:bg-accent-bg-hover',
    tertiary: 'bg-bg-tertiary text-text-primary px-4 py-2 rounded-lg hover:bg-border',
    teamColor: 'px-3 py-3 rounded-lg border',
  };

  // For teamColor variant, use inline styles since Tailwind can't handle dynamic colors
  const getTeamColorStyle = (): CSSProperties | undefined => {
    if (variant === 'teamColor' && teamColor) {
      // Convert hex to rgba
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      return {
        background: hexToRgba(teamColor, 0.2),
        color: teamColor,
        borderColor: hexToRgba(teamColor, 0.3),
      };
    }
    return undefined;
  };

  const style = getTeamColorStyle();
  const hoverClass = variant === 'teamColor' && teamColor ? 'hover:opacity-80' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClass} ${className}`}
      style={style}
      onMouseEnter={(e) => {
        if (variant === 'teamColor' && teamColor) {
          const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };
          e.currentTarget.style.background = hexToRgba(teamColor, 0.3);
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'teamColor' && teamColor) {
          const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };
          e.currentTarget.style.background = hexToRgba(teamColor, 0.2);
        }
      }}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </span>
    </button>
  );
};

