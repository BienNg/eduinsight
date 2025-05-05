// src/features/import/services/helpers/colorHelpers.js
import { getNextCourseColor } from '../firebaseService';

const COURSE_COLORS = [
  '#911DD2', // Purple Base
  '#7310A8', // Purple Dark
  '#FF5F68', // Coral Red Base
  '#D94D54', // Coral Dark
  '#4DBEFF', // Sky Blue Base
  '#3A9BD4', // Sky Dark
  '#18BF69', // Emerald Green Base
  '#139954', // Emerald Dark
  '#FBC14E', // Golden Yellow Base
  '#D9A53F', // Golden Dark
  '#D21D91', // Purple Complement
  '#5FFFC8', // Coral Complement
  '#FF944D', // Sky Complement
  '#BF181D', // Emerald Complement
  '#4E9CFB'  // Golden Complement
];

export { COURSE_COLORS };

// You can move the getNextCourseColor function here if it's not needed in firebaseService
// If you do, remember to update imports in the other files