// Utility types to help with TypeScript type checking

import { Pick } from './index';

/**
 * A utility type that ensures the tags property is recognized
 * This helps TypeScript understand that tags can be part of the Pick type
 * without modifying the actual Pick type definition
 */
export type PickWithTags = Pick & {
  tags: string[] | undefined;
};

/**
 * A utility type for partial Pick objects that includes tags
 */
export type PartialPickWithTags = Partial<Pick> & {
  tags?: string[] | undefined;
};
