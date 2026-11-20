import {
  COMMENT_MAX_LENGTH,
  DOCUMENT_NAME_MAX_LENGTH,
  sanitizeDocumentName,
  validateCommentBody,
} from './comments';

describe('validateCommentBody', () => {
  it('rejects empty and blank comments', () => {
    expect(validateCommentBody('')).toBe('empty_comment');
    expect(validateCommentBody('   \n ')).toBe('empty_comment');
  });

  it('rejects comments over the limit and accepts the limit itself', () => {
    expect(validateCommentBody('x'.repeat(COMMENT_MAX_LENGTH + 1))).toBe('comment_too_long');
    expect(validateCommentBody('x'.repeat(COMMENT_MAX_LENGTH))).toBeNull();
  });
});

describe('sanitizeDocumentName', () => {
  it('keeps ordinary names', () => {
    expect(sanitizeDocumentName('orçamento 2027.pdf')).toBe('orçamento 2027.pdf');
  });

  it('removes slashes and control characters', () => {
    expect(sanitizeDocumentName('../../etc/passwd')).toBe('....etcpasswd');
    expect(sanitizeDocumentName('a\u0000b\tc.pdf')).toBe('abc.pdf');
  });

  it('returns null when nothing is left', () => {
    expect(sanitizeDocumentName('///')).toBeNull();
    expect(sanitizeDocumentName('   ')).toBeNull();
  });

  it('truncates long names', () => {
    expect(sanitizeDocumentName('a'.repeat(200))).toHaveLength(DOCUMENT_NAME_MAX_LENGTH);
  });
});
