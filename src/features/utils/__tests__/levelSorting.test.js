// src/features/utils/__tests__/levelSorting.test.js
import { sortLanguageLevels } from '../levelSorting';

describe('sortLanguageLevels', () => {
  test('sorts language levels correctly', () => {
    // Arrange
    const unsortedLevels = ['B1.2', 'A2.1', 'C1', 'B2.2', 'A1', 'B1.1'];
    const expectedSortedLevels = ['A1', 'A2.1', 'B1.1', 'B1.2', 'B2.2', 'C1'];
    
    // Act
    const sortedLevels = sortLanguageLevels(unsortedLevels);
    
    // Assert
    expect(sortedLevels).toEqual(expectedSortedLevels);
  });
  
  test('handles empty array', () => {
    expect(sortLanguageLevels([])).toEqual([]);
  });
  
  test('preserves original array', () => {
    const original = ['B1', 'A2'];
    sortLanguageLevels(original);
    expect(original).toEqual(['B1', 'A2']); // Original should be unchanged
  });
  
  test('handles non-standard formats with fallback to string comparison', () => {
    const mixed = ['Special', 'A1', 'Custom'];
    const sorted = sortLanguageLevels(mixed);
    // Items without the expected format should be sorted alphabetically
    expect(sorted).toEqual(['A1', 'Custom', 'Special']);
  });
});