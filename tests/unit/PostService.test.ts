import { describe, it, expect, vi } from 'vitest';
import { PostService } from '../../src/scripts/services/PostService';

describe('PostService', () => {
  it('should assemble a post correctly', () => {
    const service = new PostService();
    const yaml = 'title: Test';
    const body = 'Content';
    const result = service.assemble(yaml, body);
    
    expect(result).toContain('---');
    expect(result).toContain('title: Test');
    expect(result).toContain('Content');
  });
});