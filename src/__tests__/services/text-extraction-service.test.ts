import { TextExtractionService, ExtractedContent } from '../../services/analysis/text-extraction-service';

describe('TextExtractionService', () => {
  let service: TextExtractionService;

  beforeEach(() => {
    service = new TextExtractionService();
  });

  it('should analyze extracted content', () => {
    const content = `
      import React, { useState, useEffect } from 'react';
      
      class MyComponent extends React.Component {
        render() {
          return <div>Hello</div>;
        }
      }
    `;

    const extractedContent: ExtractedContent = {
      code: content,
      imports: ["import React, { useState, useEffect } from 'react';"],
    };

    const patterns = service.identifyPatterns(extractedContent);
    expect(patterns).toEqual(["React Hooks", "Class Components"]);
  });

  it('should analyze extracted content and only detect React Hooks', () => {
    const content = `
      import React, { useState, useEffect } from 'react';
      
      function MyComponent(){
        return <div>Hello</div>;
      }
    `;

    const extractedContent: ExtractedContent = {
      code: content,
      imports: ["import React, { useState, useEffect } from 'react';"],
    };

    const patterns = service.identifyPatterns(extractedContent);
    expect(patterns).toEqual(["React Hooks"]);
  });
  
  it('should analyze extracted content and only detect Class Components', () => {
    const content = `
      import React from 'react';
      
      class MyComponent extends React.Component {
        render() {
          return <div>Hello</div>;
        }
      }
    `;

    const extractedContent: ExtractedContent = {
      code: content,
      imports: ["import React from 'react';"],
    };

    const patterns = service.identifyPatterns(extractedContent);
    expect(patterns).toEqual(["Class Components"]);
  });

  it('should extract content with default exports', () => {
    const content = `export default function() {}`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });
  
  it('should extract content with named exports', () => {
    const content = `export const functionName = () => {}`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });
  
  it('should extract content with named exports with types', () => {
    const content = `export type functionName = () => {}`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });

  it('should extract content with a simple import', () => {
    const content = `import React from 'react'`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });

  it('should extract content with a simple semicolon import', () => {
    const content = `import React from 'react';`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });

  it('should extract content with a complex import', () => {
    const content = `import React, { useState } from 'react'`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });

  it('should extract content with a complex semicolon import', () => {
    const content = `import React, { useState } from 'react';`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });

  it('should extract content with a multiline import', () => {
    const content = `import {
      useState,
      useEffect
    } from 'react';`;
    const extracted = service.extractText(content);
    expect(extracted).toEqual([content]);
  });
});