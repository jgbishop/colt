var objCoLT = {
	PrefBranch: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.colt."),
	PrefVersion: 3,
	
	Prefs: {
		ShowCopyText: { name: "showcopytext", value: false },
		ShowCopyBoth: { name: "showcopyboth", value: false },
		ShowCopyPage: { name: "showcopypage", value: false },
		CustomFormatCount: { name: "custom.count", value: 0, type: "int" },
	},
	
	// Miscellaneous variables
	Initialized: false,

	Log: function(aMessage)
	{
		var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage('CoLT: ' + aMessage);
	},

	CopyBoth: function(formatIndex, type)
	{
		var url;
		var text;
		var titleAttr;
		var pageTitle;
		var pageURL;
		var selection;
	
		if(type == "page")
		{
			url = content.document.location.href;
			text = content.document.title;
			titleAttr = "";
			pageTitle = "";
			pageURL = "";
			selection = document.commandDispatcher.focusedWindow.getSelection().toString();
		}
		else
		{
			var cMenu = document.getElementById("contentAreaContextMenu");

			url = gContextMenu.linkURL;
			text = gContextMenu.linkText();
			if ("triggerNode" in cMenu)
			{
				// The triggerNode property was added in FF 4.0
				titleAttr = cMenu.triggerNode.title;
			}
			else
			{
				// The popupNode property was deprecated in FF 4.0, but we still need it for legacy installs
				titleAttr = document.popupNode.title;
			}
			pageTitle = content.document.title;
			pageURL = content.document.location.href;
			selection = "";
		}
		
		var format = this.GetComplexPref("custom." + formatIndex + ".format");
		
		if(format == "{RT}")
		{
			var richText = "<a href=\"" + url + "\">" + text + "</a>";

			var xfer = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
			xfer.addDataFlavor("text/html");

			var htmlString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			htmlString.data = richText;
			xfer.setTransferData("text/html", htmlString, richText.length * 2);

			var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
			clipboard.setData(xfer, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
		}
		else
		{
			var myString = objCoLT.FormatString(format, text, url, titleAttr, pageTitle, pageURL, selection);

			var result = objCoLT.PlaceOnClipboard(myString);
			if(!result)
				alert("ERROR: The link text and location were unable to be placed on the clipboard.");
		}
	},
	
	CopyLinkText: function()
	{
		var linkText = gContextMenu.linkText();
		var result = this.PlaceOnClipboard(linkText);
		if(!result)
			alert("ERROR: The link text was unable to be placed on the clipboard.");
	},

	FormatString: function(string, text, url, titleAttr, pageTitle, pageURL, selection)
	{
		var result = "";
		var buffer = "";
		
		for(var i=0; i<string.length; i++)
		{
			if(string.charAt(i) == "%")
			{
				buffer = string.charAt(i);
				
				if(i+1 == string.length) // Make sure we don't walk off the end of the string
				{
					result += buffer;
					break;
				}
				else
				{
					if(string.charAt(i+1) == "?") // We found '??' for some reason
					{
						result += buffer; // Don't bump 'i' in this case
					}
					else
					{
						buffer += string.charAt(i+1); // Pull in the next character
						i++; // Bump 'i' so we skip the next character next time around the loop
						
						if(/%[Tt]/.test(buffer)) result += text;
						else if(/%[Uu]/.test(buffer)) result += url;
						else if(/%[Nn]/.test(buffer)) result += this.GetNewLine();
						else if(/%[Bb]/.test(buffer)) result += "\t";
						else if(/%[Ii]/.test(buffer)) result += titleAttr;
						else if(/%[Pp]/.test(buffer)) result += pageTitle;
						else if(/%[Rr]/.test(buffer)) result += pageURL;
						else if(/%[Ll]/.test(buffer))
						{
							var _ts = new Date();
							result += _ts.toLocaleString();
						}
						else if(/%[Ss]/.test(buffer)) result += selection;
						else result += buffer;
					}
				}

				buffer = ""; // Clear the buffer
			}
			else if(string.charAt(i) == "\\")
			{
				if(i+1 == string.length) // Make sure we don't walk off the end of the string
				{
					result += string.charAt(i);
					break;
				}
				else
				{
					if(string.charAt(i+1) == "%")
					{
						result += "%"; // Only add a percent sign
						i++; // Bump 'i' so we skip the next character next time around the loop
					}
					else
						result += string.charAt(i);
				}
			}
			else
				result += string.charAt(i);
		}
		
		return result;
	},
	
	GetComplexPref: function(name)
	{
		return this.PrefBranch.getComplexValue(name, Components.interfaces.nsISupportsString).data;
	},

	GetNewLine: function()
	{
		var platform = navigator.platform.toLowerCase();
	
		if(platform.indexOf('win') != -1) // Windows
			return "\r\n";
		else if(platform.indexOf('mac') != -1) // Mac
			return "\r";
		else // *nix
			return "\n";
	},
	
	LoadPrefs: function()
	{
		var b = this.PrefBranch;
	
		this.Prefs.ShowCopyText.value = b.getBoolPref(this.Prefs.ShowCopyText.name);
		this.Prefs.ShowCopyBoth.value = b.getBoolPref(this.Prefs.ShowCopyBoth.name);
		this.Prefs.ShowCopyPage.value = b.getBoolPref(this.Prefs.ShowCopyPage.name);
		this.Prefs.CustomFormatCount.value = b.getIntPref(this.Prefs.CustomFormatCount.name);
	},

	MigratePrefs: function(oldBranch)
	{
		for(var pid in this.Prefs)
		{
			var p = this.Prefs[pid];
			if(oldBranch.prefHasUserValue(p.name))
			{
				if(p.hasOwnProperty("type"))
				{
					if(p.type == "int")
					{
						var temp = oldBranch.getIntPref(p.name);
						this.PrefBranch.setIntPref(p.name, temp);
						try {
							oldBranch.clearUserPref(p.name); // Clean up the old preference
						} catch(e) {}
					}
				}
				else
				{
					var temp = oldBranch.getBoolPref(p.name); // Get the old preference
					this.PrefBranch.setBoolPref(p.name, temp); // Move it to the new location
					try {
						oldBranch.clearUserPref(p.name); // Clean up the old preference
					} catch (e) {}
				}
			}
		}
		
		var customCount = this.PrefBranch.getIntPref(this.Prefs.CustomFormatCount.name);
		for(var i=1; i <= customCount; i++)
		{
			var name = "custom." + i + ".separator";
			var value = false;
			if(oldBranch.prefHasUserValue(name))
				value = oldBranch.getBoolPref(name);
			else
				continue;
			
			// Is this pref a separator?
			if(value)
			{
				this.PrefBranch.setBoolPref(name, value); // Move the separator pref
				try {
					oldBranch.clearUserPref(name); // Clear the old one
				} catch(e) {}
			}
			else
			{
				// Migrate the label
				name = "custom." + i + ".label";
				value = oldBranch.getCharPref(name);
				this.SetComplexPref(name, value);
				try {
					oldBranch.clearUserPref(name);
				} catch(e) {}
				
				// Migrate the format
				name = "custom." + i + ".format";
				value = oldBranch.getCharPref(name);
				this.SetComplexPref(name, value);
				try {
					oldBranch.clearUserPref(name);
				} catch(e) {}
				
				// Remove the extraneous separator
				try {
					oldBranch.clearUserPref("custom." + i + ".separator");
				} catch(e) {}
			}
		}
		
		// Clean up the final obsolete pref
		if(oldBranch.prefHasUserValue("version"))
		{
			try {
				oldBranch.clearUserPref("version");
			} catch(e) {}
		}
	},
	
	OptionsHaveUpdated: function()
	{
		this.LoadPrefs();
	},

	PlaceOnClipboard: function(string)
	{
		var clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
		clipboard.copyString(string);
		return true;
	},

	PurgeContextSubMenu: function(nodeID)
	{
		// Remove all the menu items from the sub menu (since we will recreate them)
		var popupmenu = document.getElementById(nodeID);
		while(popupmenu.firstChild)
			popupmenu.removeChild(popupmenu.firstChild);
	},
	
	SetComplexPref: function(name, value)
	{
		try {
			var complex = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			complex.data = value;
			this.PrefBranch.setComplexValue(name, Components.interfaces.nsISupportsString, complex);
		} catch(e) { this.Log("ERROR: Caught exception trying to set complex preference (" + e.message + ")"); }
	},
	
	SetupDefaults: function()
	{
		var stringBundle = document.getElementById("CLT-String-Bundle");
		
		var defaults = {
			HTML: {label: stringBundle.getString("CLT_DefaultLabelHTMLLink"), key: 'H', format: "<a href=\"%U\">%T</a>"},
			PlainText: {label: stringBundle.getString("CLT_DefaultLabelPlainText"), key: 'P', format: "%T - %U"},
			Sep1: {label: "---"},
			BBCode: {label: "BB Code", key: 'B', format: "[url=%U]%T[/url]"},
			Markdown: {label: "Markdown", key: 'M', format: "[%T](%U)"},
			Wikipedia: {label: "Wikipedia", key: 'W', format: "[%U %T]"},
			Sep2: {label: "---"},
			RichText: {label: "Rich Text HTML", key: 'R', format: "{RT}"},
		};
		
		var counter = 0;
		for(var d in defaults)
		{
			counter++;
			
			var item = defaults[d];
			if(item.label == "---")
			{
				this.PrefBranch.setBoolPref("custom." + counter + ".separator", true);
			}
			else
			{
				this.SetComplexPref("custom." + counter + ".label", item.label);
				this.SetComplexPref("custom." + counter + ".accesskey", item.key);
				this.SetComplexPref("custom." + counter + ".format", item.format);
			}
		}
		
		this.PrefBranch.setIntPref(this.Prefs.CustomFormatCount.name, counter);
	},

	Shutdown: function()
	{
		var contextMenu = document.getElementById("contentAreaContextMenu");
		contextMenu.removeEventListener('popupshowing', objCoLT.UpdateContextMenu, false);
		
		window.removeEventListener('load', objCoLT.Startup, false);
		window.removeEventListener('unload', objCoLT.Shutdown, false);
	},
	
	Startup: function()
	{
		if(objCoLT.Initialized == false)
		{
			objCoLT.Initialized = true;
	
			if(objCoLT.PrefBranch.prefHasUserValue("prefs_version") == false)
			{
				var oldBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("colt.");
				if(oldBranch.prefHasUserValue(objCoLT.Prefs.CustomFormatCount.name))
					objCoLT.MigratePrefs(oldBranch); // Migrate old preferences
				else
					objCoLT.SetupDefaults(); // Create the defaults (new install)
				
				objCoLT.PrefBranch.setIntPref("prefs_version", objCoLT.PrefVersion);
			}
			
			objCoLT.LoadPrefs();
	
			// Update our preferences if necessary
			var pv = objCoLT.PrefBranch.getIntPref("prefs_version");
			if(pv < objCoLT.PrefVersion)
				objCoLT.UpdatePrefs(pv);
				
			var menu = document.getElementById("contentAreaContextMenu");
			menu.addEventListener('popupshowing', objCoLT.UpdateContextMenu, false);
		}
	},

	UpdateContextMenu: function()
	{
		// Only show the menu items if we're on a link and it's not a mailto link
		var hiddenFlag = true;
		if(gContextMenu && (gContextMenu.onLink && !gContextMenu.onMailtoLink))
			hiddenFlag = false;
	
		var copyText = document.getElementById("CLT-Context-CopyLinkText");
		var copyBothItem = document.getElementById("CLT-Context-CopyBoth");
		var copyBothMenu = document.getElementById("CLT-Context-CopyBothMenu");
		var copyPageItem = document.getElementById("CLT-Context-CopyPage");
		var copyPageMenu = document.getElementById("CLT-Context-CopyPageMenu");
	
		copyText.hidden = (objCoLT.Prefs.ShowCopyText.value) ? hiddenFlag : true;
		copyBothItem.hidden = (objCoLT.Prefs.ShowCopyBoth.value && (objCoLT.Prefs.CustomFormatCount.value == 1)) ? hiddenFlag : true;
		copyBothMenu.hidden = (objCoLT.Prefs.ShowCopyBoth.value && (objCoLT.Prefs.CustomFormatCount.value > 1)) ? hiddenFlag : true;
	
		// This time we default to false (we want to show the items more often than we want to hide them)
		hiddenFlag = false;
		if(gContextMenu && (gContextMenu.onLink || gContextMenu.onTextInput))
			hiddenFlag = true;
		
		copyPageItem.hidden = (objCoLT.Prefs.ShowCopyPage.value && (objCoLT.Prefs.CustomFormatCount.value == 1)) ? hiddenFlag : true;
		copyPageMenu.hidden = (objCoLT.Prefs.ShowCopyPage.value && (objCoLT.Prefs.CustomFormatCount.value > 1)) ? hiddenFlag : true;
	},

	UpdateContextSubMenu: function(nodeID, type)
	{
		this.PurgeContextSubMenu(nodeID);
	
		var popupmenu = document.getElementById(nodeID);
		
		for(var i=1; i <= this.Prefs.CustomFormatCount.value; i++)
		{
			var separatorPref = "custom." + i + ".separator";
	
			if(this.PrefBranch.prefHasUserValue(separatorPref))
			{
				var menuseparator = document.createElement("menuseparator");
				popupmenu.appendChild(menuseparator);
			}
			else
			{
				var label = this.GetComplexPref("custom." + i + ".label");
				var key = this.GetComplexPref("custom." + i + ".accesskey");
				
				// Skip any weird occurances that don't have a label (shouldn't happen, but you never know)
				if(label && label != "")
				{
					var menuitem = document.createElement("menuitem");
					menuitem.setAttribute("label", label);
					if(key && key != "")
						menuitem.setAttribute("accesskey", key);
					menuitem.setAttribute("oncommand", "objCoLT.CopyBoth('" + i + "', '" + type + "');");
					popupmenu.appendChild(menuitem);
				}
			}
		}
	},
	
	UpdatePrefs: function(currentVersion)
	{
		for(var i=1; i <= this.Prefs.CustomFormatCount.value; i++)
		{
			var sepPref = "custom." + i + ".separator";
			var isSep = this.PrefBranch.prefHasUserValue(sepPref);
			
			var keyPref = "custom." + i + ".accesskey";
			if(isSep == false && this.PrefBranch.prefHasUserValue(keyPref) == false)
			{
				this.SetComplexPref(keyPref, ""); // Set them to blank if we're upgrading
			}
		}
		
		// Finally, update the stored preference version
		this.PrefBranch.setIntPref("prefs_version", this.PrefVersion);
	}
};

window.addEventListener('load', objCoLT.Startup, false);
window.addEventListener('unload', objCoLT.Shutdown, false);
