var objCoLT = {
	ConsoleService : Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService),
	PrefBranch : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("colt."),
	
	// Preference names
	PrefName_ShowCopyText		: "showcopytext",
	PrefName_ShowCopyBoth		: "showcopyboth",
	PrefName_ShowCopyPage		: "showcopypage",
	PrefName_CustomFormatCount 	: "custom.count",
	PrefName_Version			: "version",

	// Option variables
	ShowCopyText : false,
	ShowCopyBoth : false,
	ShowCopyPage : false,
	
	// Miscellaneous variables
	RunOnce : false,
	Version : "2.5", // Must be of the form "X.Y" or "X.YZ" (only 1 decimal)

	Log: function(aMessage)
	{
		this.ConsoleService.logStringMessage('CoLT: ' + aMessage);
	},

	_DoCopyBoth: function(formatIndex, type)
	{
		var format = this.PrefBranch.getCharPref("custom." + formatIndex + ".format");
		if(format == "{RT}")
			this.CopyBothAsRichText(type);
		else
			this.CopyBoth(formatIndex, type);
	},
	
	CopyBoth: function(formatIndex, type)
	{
		var url;
		var text;
		var titleAttr;
		var pageTitle;
		var pageURL;
		var _ts = new Date();
		var localtime = _ts.toLocaleString();
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
			if ("triggerNode" in cMenu) {
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
		
		var format = this.PrefBranch.getCharPref("custom." + formatIndex + ".format");
		var myString = objCoLT.FormatString(format, text, url, titleAttr, pageTitle, pageURL, localtime, selection);
	
		var result = objCoLT.PlaceOnClipboard(myString);
		if(!result)
			alert("ERROR: The link text and location were unable to be placed on the clipboard.");
	},
	
	CopyBothAsRichText: function(type)
	{
		var richText = "<a href=\"";
	
		if(type == "page")
			richText += content.document.location.href + "\">" + content.document.title + "</a>";
		else
			richText += gContextMenu.linkURL + "\">" + gContextMenu.linkText() + "</a>";
		
		var xfer = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		xfer.addDataFlavor("text/html");
	
		var htmlString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		htmlString.data = richText;
		xfer.setTransferData("text/html", htmlString, richText.length * 2);
	
		var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
		clipboard.setData(xfer, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
	},
	
	CopyLinkText: function()
	{
		var linkText = gContextMenu.linkText();
		var result = this.PlaceOnClipboard(linkText);
		if(!result)
			alert("ERROR: The link text was unable to be placed on the clipboard.");
	},

	FormatString: function(string, text, url, titleAttr, pageTitle, pageURL, localtime, selection)
	{
		string = string.replace(/%[Tt]/g, text);
		string = string.replace(/%[Uu]/g, url);
		string = string.replace(/%[Nn]/g, this.GetNewLine());
		string = string.replace(/%[Ii]/g, titleAttr);
		string = string.replace(/%[Pp]/g, pageTitle);
		string = string.replace(/%[Rr]/g, pageURL);
		string = string.replace(/%[Ll]/g, localtime);
		string = string.replace(/%[Ss]/g, selection);
		return string;
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
	
	Init: function()
	{
		if(objCoLT.RunOnce == false)
		{
			objCoLT.RunOnce = true;
	
			objCoLT.Upgrade();
			objCoLT.LoadPrefs();
			objCoLT.UpdateContextMenu();
	
			var menu = document.getElementById("contentAreaContextMenu");
			menu.addEventListener('popupshowing', objCoLT.UpdateContextMenu, false);
		}
	},

	IsPreferenceSet: function(pref)
	{
		if(pref)
			return this.PrefBranch.prefHasUserValue(pref);
	
		return false;
	},

	LoadPrefs: function()
	{
		var b = this.PrefBranch;
		var initDefaults = false;
	
		this.ShowCopyText = b.getBoolPref(this.PrefName_ShowCopyText);
		this.ShowCopyBoth = b.getBoolPref(this.PrefName_ShowCopyBoth);
		this.ShowCopyPage = b.getBoolPref(this.PrefName_ShowCopyPage);
		this.CustomFormatCount = b.getIntPref(this.PrefName_CustomFormatCount);
	},

	MigrateTo23: function()
	{
		var stringBundle = document.getElementById("CLT-String-Bundle");
	
		// Create all the new preferences, migrating old settings as necessary
		this.PrefBranch.setIntPref(this.PrefName_CustomFormatCount, 6);
	
		this.PrefBranch.setCharPref("custom.1.label", stringBundle.getString("CLT_DefaultLabelHTMLLink"));
		this.PrefBranch.setCharPref("custom.1.format", "<a href=\"%U\">%T</a>");
		this.PrefBranch.setBoolPref("custom.1.separator", false);
		
		this.PrefBranch.setCharPref("custom.2.label", stringBundle.getString("CLT_DefaultLabelPlainText"));
		this.PrefBranch.setCharPref("custom.2.format", "%T - %U");
		this.PrefBranch.setBoolPref("custom.2.separator", false);
	
		this.PrefBranch.setBoolPref("custom.3.separator", true);
	
		if(this.IsPreferenceSet("customlabel1") && this.IsPreferenceSet("customformat1"))
		{
			this.PrefBranch.setCharPref("custom.4.label", this.PrefBranch.getCharPref("customlabel1"));
			this.PrefBranch.setCharPref("custom.4.format", this.PrefBranch.getCharPref("customformat1"));
			this.PrefBranch.setBoolPref("custom.4.separator", false);
	
			if(this.PrefBranch.prefHasUserValue("customlabel1"))
				this.PrefBranch.clearUserPref("customlabel1");
	
			if(this.PrefBranch.prefHasUserValue("customformat1"))
				this.PrefBranch.clearUserPref("customformat1");
		}
		else
		{
			// If we can't migrate, set a default custom format
			this.PrefBranch.setCharPref("custom.4.label", "BB Code");
			this.PrefBranch.setCharPref("custom.4.format", "[url=%U]%T[/url]");
			this.PrefBranch.setBoolPref("custom.4.separator", false);
		}
	
		if(this.IsPreferenceSet("customformat2") && this.IsPreferenceSet("customlabel2"))
		{
			this.PrefBranch.setCharPref("custom.5.label", this.PrefBranch.getCharPref("customlabel2"));
			this.PrefBranch.setCharPref("custom.5.format", this.PrefBranch.getCharPref("customformat2"));
			this.PrefBranch.setBoolPref("custom.5.separator", false);
	
			if(this.PrefBranch.prefHasUserValue("customlabel2"))
				this.PrefBranch.clearUserPref("customlabel2");
	
			if(this.PrefBranch.prefHasUserValue("customformat2"))
				this.PrefBranch.clearUserPref("customformat2");
		}
		else
		{
			// If we can't migrate, set a default custom format
			this.PrefBranch.setCharPref("custom.5.label", "FuseTalk");
			this.PrefBranch.setCharPref("custom.5.format", "[L=%T]%U[/L]");
			this.PrefBranch.setBoolPref("custom.5.separator", false);
		}
	
		if(this.IsPreferenceSet("customformat3") && this.IsPreferenceSet("customlabel3"))
		{
			this.PrefBranch.setCharPref("custom.6.label", this.PrefBranch.getCharPref("customlabel3"));
			this.PrefBranch.setCharPref("custom.6.format", this.PrefBranch.getCharPref("customformat3"));
			this.PrefBranch.setBoolPref("custom.6.separator", false);
	
			if(this.PrefBranch.prefHasUserValue("customlabel3"))
				this.PrefBranch.clearUserPref("customlabel3");
	
			if(this.PrefBranch.prefHasUserValue("customformat3"))
				this.PrefBranch.clearUserPref("customformat3");
		}
		else
		{
			// If we can't migrate, set a default custom format
			this.PrefBranch.setCharPref("custom.6.label", "Wikipedia");
			this.PrefBranch.setCharPref("custom.6.format", "[%U %T]");
			this.PrefBranch.setBoolPref("custom.6.separator", false);
		}

		// Delete all other old preferences that we no longer use
		if(this.IsPreferenceSet("submenu.custom1"))
			this.PrefBranch.clearUserPref("submenu.custom1");
	
		if(this.IsPreferenceSet("submenu.custom2") && this.PrefBranch.prefHasUserValue("submenu.custom2"))
			this.PrefBranch.clearUserPref("submenu.custom2");
	
		if(this.IsPreferenceSet("submenu.custom3") && this.PrefBranch.prefHasUserValue("submenu.custom3"))
			this.PrefBranch.clearUserPref("submenu.custom3");
	
		if(this.IsPreferenceSet("submenu.html") && this.PrefBranch.prefHasUserValue("submenu.html"))
			this.PrefBranch.clearUserPref("submenu.html");
	
		if(this.IsPreferenceSet("submenu.text") && this.PrefBranch.prefHasUserValue("submenu.text"))
			this.PrefBranch.clearUserPref("submenu.text");
	},
	
	MigrateTo25: function()
	{
		var count = this.PrefBranch.getIntPref(this.PrefName_CustomFormatCount);
		var hasRichText = false;
		for(var i=1; i<=count; i++)
		{
			// Clear all rich-text prefs since we no longer need them
			var rtPrefName = "custom." + i + ".richtext";
			if(this.IsPreferenceSet(rtPrefName) && this.PrefBranch.prefHasUserValue(rtPrefName))
				this.PrefBranch.clearUserPref(rtPrefName);

			// Is there a rich-text option set?
			var fPrefName = "custom." + i + ".format";
			if(this.IsPreferenceSet(fPrefName) && this.PrefBranch.getCharPref(fPrefName) == "{RT}")
				hasRichText = true;
		}

		// Insert a default rich text item if there isn't one. Note that this only happens
		// on first-time installs. Also, don't insert it if there's only 1 custom format
		// (the user clearly wanted to only use the top-level menu item, not a sub-menu).
		if (count > 1 && hasRichText == false)
		{
			count++;
			this.PrefBranch.setBoolPref("custom." + count + ".separator", true);

			count++;
			this.PrefBranch.setCharPref("custom." + count + ".label", "Rich Text HTML");
			this.PrefBranch.setCharPref("custom." + count + ".format", "{RT}");
			this.PrefBranch.setBoolPref("custom." + count + ".separator", false);

			// Bump the count
			this.PrefBranch.setIntPref(this.PrefName_CustomFormatCount, count);
		}
	},

	OptionsHaveUpdated: function()
	{
		this.LoadPrefs();
		this.UpdateContextMenu();
	},

	ParseVersion: function(version)
	{
		if(version)
		{
			var splitVersion = version.split(".");
			var parsedVersion = splitVersion[0] + ".";
	
			for(var i=1; i<splitVersion.length; i++)
			{
				parsedVersion += splitVersion[i];
			}
	
			return parseFloat(parsedVersion);
		}
		else
			return 0;
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
	
		copyText.hidden = (objCoLT.ShowCopyText) ? hiddenFlag : true;
		copyBothItem.hidden = (objCoLT.ShowCopyBoth && (objCoLT.CustomFormatCount == 1)) ? hiddenFlag : true;
		copyBothMenu.hidden = (objCoLT.ShowCopyBoth && (objCoLT.CustomFormatCount > 1)) ? hiddenFlag : true;
	
		// This time we default to false (we want to show the items more often than we want to hide them)
		hiddenFlag = false;
		if(gContextMenu && (gContextMenu.onLink || gContextMenu.onTextInput))
			hiddenFlag = true;
		
		copyPageItem.hidden = (objCoLT.ShowCopyPage && (objCoLT.CustomFormatCount == 1)) ? hiddenFlag : true;
		copyPageMenu.hidden = (objCoLT.ShowCopyPage && (objCoLT.CustomFormatCount > 1)) ? hiddenFlag : true;
	},

	UpdateContextSubMenu: function(nodeID, type)
	{
		this.PurgeContextSubMenu(nodeID);
	
		var popupmenu = document.getElementById(nodeID);
		
		for(var i=1; i <= this.CustomFormatCount; i++)
		{
			var separatorPref = "custom." + i + ".separator";
	
			var isSeparator = false;
			if(this.IsPreferenceSet(separatorPref))
				isSeparator = this.PrefBranch.getBoolPref(separatorPref);
			
			if(isSeparator)
			{
				var menuseparator = document.createElement("menuseparator");
				popupmenu.appendChild(menuseparator);
			}
			else
			{
				var labelPref = "custom." + i + ".label";
				var label = "";
				if(this.IsPreferenceSet(labelPref))
					label = this.PrefBranch.getCharPref(labelPref);
	
				// Skip any weird occurances that don't have a label (shouldn't happen, but you never know)
				if(label && label != "")
				{
					var menuitem = document.createElement("menuitem");
					menuitem.setAttribute("label", label);
					menuitem.setAttribute("oncommand", "objCoLT._DoCopyBoth('" + i + "', '" + type + "');");
					popupmenu.appendChild(menuitem);
				}
			}
		}
	},

	Upgrade: function()
	{
		var previousVersion = 0;
		
		if(this.IsPreferenceSet(this.PrefName_Version))
			previousVersion = this.ParseVersion(this.PrefBranch.getCharPref(this.PrefName_Version));
	
		var currentVersion = this.ParseVersion(this.Version);
	
		if(previousVersion != currentVersion)
		{
			if(previousVersion < this.ParseVersion("2.3"))
				this.MigrateTo23();
	
			if(previousVersion < this.ParseVersion("2.5"))
				this.MigrateTo25();

			this.PrefBranch.setCharPref(this.PrefName_Version, this.Version);
		}
	}
};

window.addEventListener('load', objCoLT.Init, false);
