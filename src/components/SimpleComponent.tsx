import React from 'react';

console.log('SimpleComponent is being loaded');

const SimpleComponent: React.FC = () => {
  console.log('SimpleComponent is rendering');
  return <div>Hello</div>;
};

console.log('SimpleComponent is defined');

export default SimpleComponent; 