/**
 * Types UI pour éliminer les any[] sur les collections clés
 */

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  action: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<any>;
  active?: boolean;
  badge?: number;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
}