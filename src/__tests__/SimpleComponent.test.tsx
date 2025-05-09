import React from 'react';
import { render, screen } from '@testing-library/react';
import SimpleComponent from '../components/SimpleComponent';

describe('SimpleComponent', () => {
  it('renders without crashing and shows Hello text', () => {
    console.log('Starting SimpleComponent test');
    render(<SimpleComponent />);
    console.log('Finished rendering SimpleComponent in test');
    
    const element = screen.getByText('Hello');
    expect(element).toBeInTheDocument();
  });
}); 