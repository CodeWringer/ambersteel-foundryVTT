import { showConfirmationDialog } from "../utils/dialog-utility.mjs";

/**
 * Registers events on elements of the given DOM. 
 * @param html {Object} DOM of the sheet for which to register listeners. 
 * @param ownerSheet {ActorSheet|ItemSheet} DOM owner object. This should be an actor sheet object or item sheet object.
 * @param isOwner {Boolean} If true, registers events that require owner permission. 
 * @param isEditable {Boolean} If true, registers events that require editing permission. 
 */
export function activateListeners(html, ownerSheet, isOwner, isEditable) {
  // -------------------------------------------------------------
  if (!isOwner) return;
  // -------------------------------------------------------------
  if (!isEditable) return;

  // Delete item. 
  html.find(".ambersteel-delete").click(_onDelete.bind(ownerSheet));
}

async function _onDelete(event) {
  const dataset = event.currentTarget.dataset;

  if (dataset.promptConfirm) {
    if (!keyboard.isDown("Shift")) {
      const dialogResult = await showConfirmationDialog({
        localizableTitle: dataset.promptTitle ?? "ambersteel.dialog.titleConfirmDeletionQuery"
      });
      if (!dialogResult) return;
    }
  }

  const who = dataset.itemId ? this.getItem(dataset.itemId) : this.getContextEntity();
  if (dataset.propertyPath) {
    await who.deleteByPropertyPath(dataset.propertyPath);
  } else {
    await who.delete();
  }
}