import React from 'react';

interface IconRendererProps {
  iconName: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ iconName }) => {
  if (iconName.includes('fire')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"></path>
        <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"></path>
      </svg>
    );
  } else if (iconName.includes('images')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M21 3.6v16.8a.6.6 0 01-.6.6H3.6a.6.6 0 01-.6-.6V3.6a.6.6 0 01.6-.6h16.8a.6.6 0 01.6.6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M3 16l7-3 11 5M16 10a2 2 0 110-4 2 2 0 010 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    );
  } else if (iconName.includes('video')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M6.906 4.537A.6.6 0 006 5.053v13.894a.6.6 0 00.906.516l11.723-6.947a.6.6 0 000-1.032L6.906 4.537z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    );
  } else if (iconName.includes('community')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M1 20v-1a7 7 0 017-7v0a7 7 0 017 7v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
        <path d="M13 14v0a5 5 0 015-5v0a5 5 0 015 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
        <path d="M8 12a4 4 0 100-8 4 4 0 000 8zM18 9a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    );
  } else if (iconName.includes('profile')) {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M4.271 18.346S6.5 15.5 12 15.5s7.73 2.846 7.73 2.846M12 12a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    );
  } else if (iconName.includes('shop')) {
    return (
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"></path>
      </svg>
    );
  }

  // 默认返回一个简单图标
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
    </svg>
  );
}; 