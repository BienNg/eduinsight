// src/utils/levelSorting.js
export const sortLanguageLevels = (levels) => {
    return [...levels].sort((a, b) => {
      // Extract the parts: letter (A, B, C), first number (1, 2), and second number (1, 2)
      const aMatch = a.match(/([A-C])(\d+)\.?(\d*)/i);
      const bMatch = b.match(/([A-C])(\d+)\.?(\d*)/i);
      
      if (!aMatch || !bMatch) return a.localeCompare(b);
      
      // Compare letter first (A comes before B comes before C)
      if (aMatch[1] !== bMatch[1]) {
        return aMatch[1].localeCompare(bMatch[1]);
      }
      
      // Compare first number (1 comes before 2)
      if (parseInt(aMatch[2]) !== parseInt(bMatch[2])) {
        return parseInt(aMatch[2]) - parseInt(bMatch[2]);
      }
      
      // Compare second number (1 comes before 2)
      return parseInt(aMatch[3] || "0") - parseInt(bMatch[3] || "0");
    });
  };