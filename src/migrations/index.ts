import * as migration_20250315_174700 from './20250315_174700';

export const migrations = [
  {
    up: migration_20250315_174700.up,
    down: migration_20250315_174700.down,
    name: '20250315_174700'
  },
];
