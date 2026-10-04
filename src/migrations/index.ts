import * as migration_20250315_174700 from './20250315_174700'
import * as migration_20260924_082754_dependency_upgrade from './20260924_082754_dependency_upgrade'
import * as migration_20260925_125815_project_hero from './20260925_125815_project_hero'
import * as migration_20260925_141031_navigation_logos from './20260925_141031_navigation_logos'
import * as migration_20260925_142451_live_category_palette from './20260925_142451_live_category_palette'
import * as migration_20260925_214829_project_story_layout from './20260925_214829_project_story_layout'
import * as migration_20260926_122547_admin_content_groups_industries from './20260926_122547_admin_content_groups_industries'
import * as migration_20260926_154205_project_clients_single_industry from './20260926_154205_project_clients_single_industry'
import * as migration_20260928_094158_project_story_video from './20260928_094158_project_story_video'
import * as migration_20260929_070501_project_content_model from './20260929_070501_project_content_model'
import * as migration_20261001_144525_global_project_title_presentation from './20261001_144525_global_project_title_presentation'
import * as migration_20261001_151326_global_story_text_presentation from './20261001_151326_global_story_text_presentation'
import * as migration_20261001_195846_global_project_description_presentation from './20261001_195846_global_project_description_presentation'
import * as migration_20261003_093438_industry_colour from './20261003_093438_industry_colour'
import * as migration_20261003_150000_mobile_project_title_size from './20261003_150000_mobile_project_title_size'
import * as migration_20261004_124136_discipline_rename from './20261004_124136_discipline_rename'

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
  {
    up: migration_20260925_141031_navigation_logos.up,
    down: migration_20260925_141031_navigation_logos.down,
    name: '20260925_141031_navigation_logos',
  },
  {
    up: migration_20260925_142451_live_category_palette.up,
    down: migration_20260925_142451_live_category_palette.down,
    name: '20260925_142451_live_category_palette',
  },
  {
    up: migration_20260925_214829_project_story_layout.up,
    down: migration_20260925_214829_project_story_layout.down,
    name: '20260925_214829_project_story_layout',
  },
  {
    up: migration_20260926_122547_admin_content_groups_industries.up,
    down: migration_20260926_122547_admin_content_groups_industries.down,
    name: '20260926_122547_admin_content_groups_industries',
  },
  {
    up: migration_20260926_154205_project_clients_single_industry.up,
    down: migration_20260926_154205_project_clients_single_industry.down,
    name: '20260926_154205_project_clients_single_industry',
  },
  {
    up: migration_20260928_094158_project_story_video.up,
    down: migration_20260928_094158_project_story_video.down,
    name: '20260928_094158_project_story_video',
  },
  {
    up: migration_20260929_070501_project_content_model.up,
    down: migration_20260929_070501_project_content_model.down,
    name: '20260929_070501_project_content_model',
  },
  {
    up: migration_20261001_144525_global_project_title_presentation.up,
    down: migration_20261001_144525_global_project_title_presentation.down,
    name: '20261001_144525_global_project_title_presentation',
  },
  {
    up: migration_20261001_151326_global_story_text_presentation.up,
    down: migration_20261001_151326_global_story_text_presentation.down,
    name: '20261001_151326_global_story_text_presentation',
  },
  {
    up: migration_20261001_195846_global_project_description_presentation.up,
    down: migration_20261001_195846_global_project_description_presentation.down,
    name: '20261001_195846_global_project_description_presentation',
  },
  {
    up: migration_20261003_093438_industry_colour.up,
    down: migration_20261003_093438_industry_colour.down,
    name: '20261003_093438_industry_colour',
  },
  {
    up: migration_20261003_150000_mobile_project_title_size.up,
    down: migration_20261003_150000_mobile_project_title_size.down,
    name: '20261003_150000_mobile_project_title_size',
  },
  {
    up: migration_20261004_124136_discipline_rename.up,
    down: migration_20261004_124136_discipline_rename.down,
    name: '20261004_124136_discipline_rename',
  },
]
