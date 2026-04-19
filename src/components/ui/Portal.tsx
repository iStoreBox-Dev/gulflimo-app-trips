import React from 'react';

interface PortalProps {
  children: React.ReactNode;
}

export default function Portal({ children }: PortalProps) {
  if (typeof document === 'undefined') return <>{children}</>;
  // Use require to avoid resolving react-dom on native platforms
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactDOM = require('react-dom');
  return ReactDOM.createPortal(children, document.body);
}
