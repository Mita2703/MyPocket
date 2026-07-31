import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = '', size = 20 }) => {
  // Dynamically resolve icon component from Lucide React
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[name] || Icons.Circle;

  return <IconComponent className={className} size={size} />;
};
