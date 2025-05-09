import { v4 as uuidv4 } from 'uuid';

export type QuestionType = 'relationship' | 'summary' | 'detail' | 'why' | 'synthesis';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
}

export interface DocumentContent {
  fileName: string;
  content: string;
}

export class QuestionGenerator {
  private generateRelationshipQuestions(documents: DocumentContent[]): Question[] {
    const questions: Question[] = [];
    
    // Generate questions about relationships between documents
    if (documents.length > 1) {
      questions.push({
        id: uuidv4(),
        text: `How do the contents of ${documents[0].fileName} relate to ${documents[1].fileName}?`,
        type: 'relationship'
      });
    }

    return questions;
  }

  private generateSummaryQuestions(documents: DocumentContent[]): Question[] {
    const questions: Question[] = [];
    
    documents.forEach(doc => {
      questions.push({
        id: uuidv4(),
        text: `What are the key points in ${doc.fileName}?`,
        type: 'summary'
      });
    });

    return questions;
  }

  private generateDetailQuestions(documents: DocumentContent[]): Question[] {
    const questions: Question[] = [];
    
    documents.forEach(doc => {
      questions.push({
        id: uuidv4(),
        text: `What specific details are mentioned in ${doc.fileName}?`,
        type: 'detail'
      });
    });

    return questions;
  }

  private generateWhyQuestions(documents: DocumentContent[]): Question[] {
    const questions: Question[] = [];
    
    documents.forEach(doc => {
      questions.push({
        id: uuidv4(),
        text: `Why are certain decisions or approaches taken in ${doc.fileName}?`,
        type: 'why'
      });
    });

    return questions;
  }

  private generateSynthesisQuestions(documents: DocumentContent[]): Question[] {
    const questions: Question[] = [];
    
    if (documents.length > 1) {
      questions.push({
        id: uuidv4(),
        text: `How do the different documents work together to tell a complete story?`,
        type: 'synthesis'
      });
    }

    return questions;
  }

  public generateQuestions(documents: DocumentContent[]): Question[] {
    const questions: Question[] = [
      ...this.generateRelationshipQuestions(documents),
      ...this.generateSummaryQuestions(documents),
      ...this.generateDetailQuestions(documents),
      ...this.generateWhyQuestions(documents),
      ...this.generateSynthesisQuestions(documents)
    ];

    return questions;
  }
} 