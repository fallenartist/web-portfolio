import * as migration_20250315_174700 from './20250315_174700'
import * as migration_20260924_082754_dependency_upgrade from './20260924_082754_dependency_upgrade'
import * as migration_20260925_125815_project_hero from './20260925_125815_project_hero'

export const migrations = [
  {
    up: migration_20250315_174700.up,
    down: migration_20250315_174700.down,
    name: '20250315_174700',
  },
  {
    up: migration_20260924_082754_dependency_upgrade.up,
    down: migration_20260924_082754_dependency_upgrade.down,
    name: '20260924_082754_dependency_upgrade',
  },
  {
    up: migration_20260925_125815_project_hero.up,
    down: migration_20260925_125815_project_hero.down,
    name: '20260925_125815_project_hero',
  },
]
