## CoLT Revision History

### 2.6.7
* A new variable (%D) is now available for custom formats, allowing the user to insert a local date stamp
* JSON output is now beautified when exporting custom formats
* A README file has been added to the tree for use at GitHub

### 2.6.6
* Removed the _updateURL_ from builds offered at my personal website. CoLT will now be hosted only at AMO.
* Converted the changelog to Markdown format
* Bumped the supported _minVersion_ to 38.0

### 2.6.5
* Default formats can now be restored via the options dialog
* Reorganized the options dialog
* Displaying the CoLT context sub-menus is now slightly more efficient (they are no longer built on the fly)
* Error handler routines have been updated to use the reportError() call
* Bug Fix: Removed an erroneous instance in the options dialog where DOM elements were being created and never used
* Bug Fix: Selected item artifacts should no longer be left around when moving custom formats in the list

### 2.6.4
* Removed a few deprecated parameters from various internal functions
* Bug Fix: CoLT's menu items were not working properly when only one format was present in the custom formats list
* Bug Fix: Improved the way migrating from ancient versions of CoLT works (prefs weren't being fully migrated)

### 2.6.3
* Removed the following translations, all of which were mostly incomplete: cs-CZ, ko-KR, tr, zh-TW
* Bug Fix: Removed an invalid reference to the document object in CoLT's common module, which prevented new installs from being set up properly

### 2.6.2
* Custom formats are now stored in a JSON file in the user's Firefox profile, instead of as Firefox preferences
* Rewrote the export and import routines to support the new JSON file format
* Improved the way internal logging is handled
* Modified the way new-line characters are determined
* Bumped the minVersion to 24.0
* Bumped the maxVersion to 45.*
* Bug Fix: Redesigned the way data is passed between the browser and CoLT's options dialog, fixing several errors that would appear in the browser console
* Bug Fix: Fixed a few places where DOM elements were erroneously being created and never used

### 2.6.1
* Changed the minimum supported Firefox version to 17.0, since the 10.x line is no longer supported
* Bumped the maxVersion to 30.*
* Various locale updates

### 2.6.0
* Added support for conditional expressions using the %?[] variable
* Added support for importing and exporting custom formats (useful for moving them between systems)
* Improved the way custom format events are handled
* Removed the embedded JAR file from within the extension's XPI file
* Made a few minor improvements to the installer manifest
* Changed the minimum supported Firefox version to 10.0
* Bug Fix: Newly added separators now properly extend across the custom format dialog

### 2.5.9
* Added a Catalan (ca) localization
* Updated the Arabic (ar) localization
* Bug Fix: Once again altered the "insertafter" attribute of the "Copy Page Title and Location" menu. It should no longer appear above the "Copy" menu item when text is selected.
* Bug Fix: Corrected the changes to the nsITransferable interface made in the previous version (the initial recommendation from Mozilla was incorrect)

### 2.5.8
* Improved the use of the nsITransferable interface in preparation for upcoming private browsing changes
* Changed the maxVersion to 25.*
* Bug Fix: Changed the "insertafter" attribute for the "Copy Page Title and Location" menu items, to move them higher in the context menu for Firefox 16

### 2.5.7
* Improved the way percent signs can be escaped. You can now specify either '%%' or '\%' to get a literal percent character.
* Added logic to clear all custom formats if the "extensions.colt.prefs_version" setting gets cleared in about:config. Clearing this value is a handy way to reset to the default custom formats.

### 2.5.6
* Added the capability to specify access-key accelerators for custom format context menu items. Existing custom formats will have no key assigned; you must manually set them if upgrading from a previous version.
* Added the capability to insert a percent sign into a given custom format (simply escape the percent sign with a backslash character).
* Replaced the default FuseTalk custom format with the somewhat more prevalent Markdown format.

### 2.5.5
* Bug Fix: Rewrote the routine that handles doing the substitution for custom formats. This will prevent the mistaken translation of encoded characters within substituted text (URLs, for example).

### 2.5.4
* Added Unicode support (custom formats can now include extended characters)
* Added a new custom format variable for inserting tab characters (%B)
* Options are now stored under the more appropriate "extensions." branch
* Removed a few extraneous menu updates during initialization
* Removed the obsolete contents.rdf files from each localization folder, reducing overall file size
* Changed the minVersion from 1.5 to 3.6
* Changed the maxVersion to 15.*
* Bug Fix: Several registered event listeners were not being removed on shutdown

### 2.5.3
* Bumped the maxVersion to 12.* to work around Mozilla’s annoying new release schedule
* Various locale updates

### 2.5.2
* Added support for Firefox 5 and 6
* Minor locale updates

### 2.5.1
* Bumped the maxVersion to 4.0.* to allow CoLT to work in all future Firefox 4 builds.

### 2.5.0
* Added capability to capture selected text when copying the page's title and location (big thank you to Philip and Paul)
* Added the local time stamp to the available fields for custom formats (big thank you to Philip and Paul)
* A rich-text custom format is now one of the default formats for new installs of CoLT
* Added a new Swedish (sv-SE) localization
* Cleaned up some now redundant preferences used by CoLT
* CoLT licensing has been updated and relaxed.
* Bug Fix: Corrected a problem that caused CoLT to stop working in Firefox 4.0 builds
* Bug Fix: Copying as rich text now works properly if the rich text option is the only custom format in the custom format list (i.e. it appears as a top-level menu item)
* Bug Fix: Removing an item from the custom format list no longer causes the selected index to be cleared
* Bug Fix: Moving items around in the custom format list when the list contains many items no longer causes the selection to disappear

### 2.4.7
* Bug Fix: Page titles are now copied in a more appropriate fashion, and should no longer result in an undefined value on trunk builds of Firefox

### 2.4.6
* Bumped the maxVersion to 3.6.* to support Firefox 3.6 builds

### 2.4.5
* Cleaned up all JavaScript code so it no longer pollutes the global namespace
* Bug Fix: Removed a stray debug log message

### 2.4.4
* Bumped the maxVersion to 3.5.* to support Firefox 3.5 builds
* Updated the Arabic (ar) localization

### 2.4.3
* Bug Fix: The "Copy Page Title and Location" menu items no longer show up in text input controls or on 'mailto:' style links.
* Bug Fix: The logic for showing the Copy Link Text menu items has been improved.
* Bug Fix: Repositioned the placement of the "Copy Page Title and Location" menu items.

### 2.4.2
* New Copy Page Title and Location option added
* New custom format variables allow users to copy the current page title, current page url, or link title attribute.
* Added a new Arabic (ar) translation.

### 2.4.1
* Bumped the maXVersion to support Firefox 3 Release Candidate 1 (and all future Firefox 3.0.x builds).
* Updated the Polish (pl-PL) translation.
* Updated the Portuguese: Brazilian (pt-BR) translation.

### 2.4.0
* New rich-text copy option (for pasting rich text URLs) now available.
* Added support for Firefox 3.0pre (includes beta 5 support).
* Minimum version changed to 1.5.0.*. Beginning with this build, Firefox 1.0.x is no longer supported.
* Added a new Persian (fa-IR) translation.
* Added a new Polish (pl-PL) translation.

### 2.3.0
* CoLT now supports an unlimited number of custom formats for the 'Copy Link Text and Location' action.
* When only one format is available for the 'Copy Link Text and Location' action, it appears as a menu item, rather than an item in a sub-menu.
* Custom menu separators can now be added to the 'Copy Link Text and Location' sub-menu.
* Added a new Czech (cs-CZ) translation.
* Added a new Korean (ko-KR) translation.
* Added a new Lithuanian (lt-LT) translation.
* Added a new Chinese Simplified (zh-CN) translation.

### 2.2.1
* Added a new Dutch (nl-NL) translation.
* Added a new Ukrainian (uk-UA) translation.
* Brand new extension logo.

### 2.2
* Added support for Firefox 2.0 release candidate builds.

### 2.1.1
* Added support for Bon Echo Beta 2 builds (Firefox 2.0).
* Added a new Chinese Traditional (zh-TW) translation.
* Added a new Danish (da-DK) translation.

### 2.1
* Added a new Turkish (tr-TR) localization.
* Bug Fix: The "Display the 'Copy Link Text and Location' sub-menu" option could not be properly disabled.
* Bug Fix: The German (de-DE) locale had an untranslated string.
* Bug Fix: Removed an erroneous apostrophe in one of the English locale's strings.

### 2.0
* Two new custom formats have been added for the "Copy Link Text and Location" action, bringing the total to three custom formats.
* A new option has been added, allowing the user to hide the "Copy Link Text" menu item.
* The "Copy Link Text and Location" menu item is now always shown as a sub-menu.
* CoLT now uses the nsIClipboardHelper service instead of the nsIClipboard service.
* Added support for Bon Echo alphas (Firefox 2.0).
* Added a new Slovak (sk-SK) translation.
* Extension description has been localized.

### 1.3.2
* Added a new Russian (ru-RU) translation.
* Added a new Spanish (Spain) (es-ES) translation.

### 1.3.1
* Added a new French (fr-FR) translation.
* Added a new Italian (it-IT) translation.
* Added a new Japanese (ja-JP) translation.
* Added a new Spanish (Argentina) (es-AR) translation.

### 1.3
* A new option allows the "Copy Link Text and Location" menu item to show up as a sub-menu, presenting all three options to the user at once (plain text, HTML link, custom format).

### 1.2
* A new %N parameter is now available for specifying a new-line in the custom format string.
* The plain text format for the "copy both" command has been updated.
* The "copy both" option is now enabled by default.
* The default format for "copy both" is now HTML rather than plan text.

### 1.1
* New option allows you to add a new context menu item, which copies a link's URL and text at the same time. You can even select what format you want the data copied in (or supply your own custom format). Very handy for blogs!
* Bug Fix: Corrected a strict JavaScript parsing bug.

### 1.0
* New German (de-DE) translation added.
* Automatic update support added.
* New extension icon.

### 0.9.2
* Firefox 1.5 RC1 support.
* New Brazilian Portugese (pt-BR) translation added.

### 0.9.1
* Bug Fix: Chrome registration problem fixed in 1.5 beta builds.

### 0.9
* Initial public release
