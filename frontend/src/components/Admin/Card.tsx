import React, { ReactNode } from 'react';
import '../Admin/css/Card.css';

// Define types for the props passed to the Card component
interface CardProps {
  title: string;
  description: string;
  icon?: string;
  bgColor: string;
  float?: 'left' | 'right' | 'none';
  width?: string;
  height?: string;
  children?: ReactNode;  // Allow Card component to accept children
  id?: string;              
  className?: string;        // ← Optional custom class
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  icon,
  bgColor,
  float,
  width,
  height,
  children,
  id,
  className
}) => {
  return (
    <div
    className={`card ${className || ''}`}
    id={id}
      style={{
        backgroundColor: bgColor,
        float: float,
        width: width,
        height: height,
      }} // Apply width and height from props
    >
      <div className="card-content">
        <div className="card-text">
          <h3 className="card-title">{title}</h3>
          <p className="card-description">{description}</p>
        </div>
        <div className="card-icon">
          {icon && <img src={icon} alt="icon" />}
        </div>
      </div>

      {/* Render children here */}
      {children && <div className="card-children">{children}</div>}
    </div>
  );
};

export default Card;
