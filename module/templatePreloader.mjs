/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Components.
    "systems/ambersteel/templates/actor/components/component-attribute-table.hbs",
    "systems/ambersteel/templates/actor/components/component-skill-table.hbs",
    "systems/ambersteel/templates/actor/components/number-spinner.hbs",
    // Actor partials.
    "systems/ambersteel/templates/actor/parts/actor-personals.hbs",
    "systems/ambersteel/templates/actor/parts/actor-attributes.hbs",
    "systems/ambersteel/templates/actor/parts/actor-skills.hbs",
    "systems/ambersteel/templates/actor/parts/actor-beliefs.hbs",
    "systems/ambersteel/templates/actor/parts/actor-fate.hbs",
    "systems/ambersteel/templates/actor/parts/actor-beliefs-fate.hbs",
    "systems/ambersteel/templates/actor/parts/actor-health.hbs",
    "systems/ambersteel/templates/actor/parts/actor-possessions.hbs",
    "systems/ambersteel/templates/actor/parts/actor-biography.hbs",
    // Item partials.
    "systems/ambersteel/templates/item/parts/skill-ability-table.hbs",
    "systems/ambersteel/templates/item/parts/fate-card.hbs",
    // Dice.
    "systems/ambersteel/templates/dice/roll.hbs",
    // Sheets.
    "systems/ambersteel/templates/actor/actor-character-sheet.hbs",
    "systems/ambersteel/templates/item/item-item-sheet.hbs",
    "systems/ambersteel/templates/item/skill-item-sheet.hbs",
    "systems/ambersteel/templates/item/fate-card-item-sheet.hbs",
    // Dialogs.
    "systems/ambersteel/templates/dice/roll-dialog.hbs",
    "systems/ambersteel/templates/dialog/skill-add-dialog.hbs",
    // GM.
    "systems/ambersteel/templates/gm-notes.hbs",
  ]);
};