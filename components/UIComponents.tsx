import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyle = "px-6 py-2 font-tech font-bold uppercase tracking-wider transition-all duration-200 clip-path-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  const variants = {
    primary: "bg-cyan-500 text-slate-900 hover:bg-cyan-400 focus:ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400",
    secondary: "bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300 hover:bg-slate-700 focus:ring-cyan-500"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className = '' }) => (
  <div className={`bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 relative overflow-hidden group ${className}`}>
    {/* Corner Accents */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-500"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-500"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-500"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-500"></div>
    
    {title && (
      <h3 className="text-cyan-400 font-tech text-sm tracking-widest uppercase mb-3 border-b border-slate-700/50 pb-2 flex items-center">
        <span className="w-2 h-2 bg-cyan-500 mr-2 rounded-full animate-pulse"></span>
        {title}
      </h3>
    )}
    {children}
  </div>
);

export const Loader: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center h-64 w-full space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      <div className="absolute inset-2 border-b-4 border-fuchsia-500 rounded-full animate-spin animation-delay-150"></div>
    </div>
    <div className="font-tech text-cyan-400 animate-pulse tracking-widest text-lg">
      {text}...
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-900/50 text-cyan-200 border border-cyan-500/30">
    {children}
  </span>
);
