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
import * as migration_20261004_185118_menu_internal_destinations from './20261004_185118_menu_internal_destinations'
import * as migration_20261004_190940_menu_submenus_projects_slug from './20261004_190940_menu_submenus_projects_slug'
import * as migration_20261005_114355_tangled_tree_taxonomies from './20261005_114355_tangled_tree_taxonomies'
import * as migration_20261005_114820_taxonomy_menu_links from './20261005_114820_taxonomy_menu_links'
import * as migration_20261005_160000_project_guide_settings from './20261005_160000_project_guide_settings'
import * as migration_20261006_104500_appearance_global from './20261006_104500_appearance_global'
import * as migration_20261006_133000_project_industries_many from './20261006_133000_project_industries_many'
import * as migration_20261006_140000_agency_url from './20261006_140000_agency_url'
import * as migration_20261006_143000_story_image_presentation from './20261006_143000_story_image_presentation'
import * as migration_20261006_164500_remove_treemap_autoplay from './20261006_164500_remove_treemap_autoplay'
import * as migration_20261006_173000_appearance_key_colour from './20261006_173000_appearance_key_colour'
import * as migration_20261007_090000_client_url from './20261007_090000_client_url'

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
  {
    up: migration_20261004_185118_menu_internal_destinations.up,
    down: migration_20261004_185118_menu_internal_destinations.down,
    name: '20261004_185118_menu_internal_destinations',
  },
  {
    up: migration_20261004_190940_menu_submenus_projects_slug.up,
    down: migration_20261004_190940_menu_submenus_projects_slug.down,
    name: '20261004_190940_menu_submenus_projects_slug',
  },
  {
    up: migration_20261005_114355_tangled_tree_taxonomies.up,
    down: migration_20261005_114355_tangled_tree_taxonomies.down,
    name: '20261005_114355_tangled_tree_taxonomies',
  },
  {
    up: migration_20261005_114820_taxonomy_menu_links.up,
    down: migration_20261005_114820_taxonomy_menu_links.down,
    name: '20261005_114820_taxonomy_menu_links',
  },
  {
    up: migration_20261005_160000_project_guide_settings.up,
    down: migration_20261005_160000_project_guide_settings.down,
    name: '20261005_160000_project_guide_settings',
  },
  {
    up: migration_20261006_104500_appearance_global.up,
    down: migration_20261006_104500_appearance_global.down,
    name: '20261006_104500_appearance_global',
  },
  {
    up: migration_20261006_133000_project_industries_many.up,
    down: migration_20261006_133000_project_industries_many.down,
    name: '20261006_133000_project_industries_many',
  },
  {
    up: migration_20261006_140000_agency_url.up,
    down: migration_20261006_140000_agency_url.down,
    name: '20261006_140000_agency_url',
  },
  {
    up: migration_20261006_143000_story_image_presentation.up,
    down: migration_20261006_143000_story_image_presentation.down,
    name: '20261006_143000_story_image_presentation',
  },
  {
    up: migration_20261006_164500_remove_treemap_autoplay.up,
    down: migration_20261006_164500_remove_treemap_autoplay.down,
    name: '20261006_164500_remove_treemap_autoplay',
  },
  {
    up: migration_20261006_173000_appearance_key_colour.up,
    down: migration_20261006_173000_appearance_key_colour.down,
    name: '20261006_173000_appearance_key_colour',
  },
  {
    up: migration_20261007_090000_client_url.up,
    down: migration_20261007_090000_client_url.down,
    name: '20261007_090000_client_url',
  },
]
