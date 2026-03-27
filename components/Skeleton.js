'use client';

import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div
      className={`bg-surface-hover animate-pulse rounded-md ${className}`}
    />
  );
};

export default Skeleton;
