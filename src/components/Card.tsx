import React from "react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}
interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className = "", children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

const CardContent: React.FC<CardContentProps> = ({
  className = "",
  children,
}) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

export { Card, CardContent };
