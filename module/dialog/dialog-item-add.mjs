import * as DialogUtil from '../utils/dialog-utility.mjs';
import { TEMPLATES } from '../templatePreloader.mjs';
import { getItemDeclarations } from '../utils/content-utility.mjs';
import { getElementValue } from '../utils/sheet-utility.mjs';

const LOCALIZABLE_TITLE = "ambersteel.dialog.titleAddItemQuery";
const LOCALIZABLE_ITEM_LABEL = "ambersteel.labels.item";

/**
 * @param {String} itemType Item type. "skill"|"injury"|"illness"|"item"
 * @param {String} localizableItemLabel Localization string for the item input label. 
 * @param {String} localizableTitle Localization string for the dialog title. 
 * @returns {Promise<Object>} = {
 * selected: {String} Id of the selected item,
 * isCustomChecked: {Boolean},
 * confirmed: {Boolean}
 * }
 * @async
 */
export async function showDialog(itemType, localizableItemLabel = LOCALIZABLE_ITEM_LABEL, localizableTitle = LOCALIZABLE_TITLE) {
  const itemDeclarations = getItemDeclarations(itemType);

  return new Promise(async (resolve, reject) => {
    const dialogResult = await DialogUtil.showDialog(
      {
        dialogTemplate: TEMPLATES.DIALOG_ITEM_ADD,
        localizableTitle: localizableTitle,
        render: html => {
          html.find(".ambersteel-is-custom").change(event => {
            const select = html.find(".ambersteel-item-select")[0];
            if (getElementValue(event.currentTarget) === true) {
              select.className = select.className + " ambersteel-read-only";
            } else {
              select.className = select.className.replace(" ambersteel-read-only", "");
            }
          });
        }
      },
      {
        itemLabel: game.i18n.localize(localizableItemLabel),
        itemDeclarations: itemDeclarations
      }
    );
    resolve({
      selected: getElementValue(dialogResult.html.find(".ambersteel-item-select")[0]),
      isCustomChecked: getElementValue(dialogResult.html.find(".ambersteel-is-custom")[0]),
      confirmed: dialogResult.confirmed
    });
  });
}

/**
 * @param {String} itemType Item type. "skill"|"injury"|"illness"|"item"
 * @param {String} localizableItemLabel Localization string for the item input label. 
 * @param {String} localizableTitle Localization string for the dialog title. 
 * @returns {Promise<Object>} = {
 * selected: {String} Id of the selected item,
 * isCustomChecked: {Boolean},
 * confirmed: {Boolean}
 * }
 * @async
 */
export async function query(itemType, localizableItemLabel = LOCALIZABLE_ITEM_LABEL, localizableTitle = LOCALIZABLE_TITLE) {
  return new Promise(async (resolve, reject) => {
    if (game.keyboard.downKeys.has("SHIFT")) {
      resolve({
        selected: undefined,
        isCustomChecked: true,
        confirmed: true
      });
    } else {
      resolve(await showDialog(itemType, localizableItemLabel, localizableTitle));
    }
  });
}
