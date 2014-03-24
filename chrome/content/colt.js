Components.utils.import('resource://colt/common.js');

var objCoLT = {
	LinkData: {
		linkURL: '',
		linkText: '',
		linkTitle: '',
		pageTitle: '',
		pageURL: '',
		selection: ''
	},
	
	Initialized: false,

	CopyBoth: function(formatIndex, type)
	{
		this.LoadLinkData(type);
		
		if(CoLTCommon.Data.CustomFormats[formatIndex].format == "{RT}")
		{
			var richText = "<a href=\"" + this.LinkData.linkURL + "\">" + this.LinkData.linkText + "</a>";
			
			var trans = Components.classes["@mozilla.org/widget/transferable;1"].
				createInstance(Components.interfaces.nsITransferable);
			
			// The init() function was added to FF 16 for upcoming changes to private browsing mode
			// See https://bugzilla.mozilla.org/show_bug.cgi?id=722872 for more information
			if('init' in trans)
			{
				var privacyContext = document.commandDispatcher.focusedWindow.
					QueryInterface(Components.interfaces.nsIInterfaceRequestor).
					getInterface(Components.interfaces.nsIWebNavigation).
					QueryInterface(Components.interfaces.nsILoadContext);
				trans.init(privacyContext);
			}
			trans.addDataFlavor("text/html");
			
			var htmlString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			htmlString.data = richText;
			trans.setTransferData("text/html", htmlString, richText.length * 2);

			var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
			clipboard.setData(trans, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
		}
		else
		{
			var myString = objCoLT.FormatString(CoLTCommon.Data.CustomFormats[formatIndex].format, type);
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
	
	DeletePref: function(branch, prefname)
	{
		try {
			branch.clearUserPref(prefname); // Clean up the old preference
		} catch(e) {}
	},
	
	DoSubs: function(string)
	{
		switch(string.toUpperCase())
		{
			case "%B": // Tab
				return "\t";
				break;
			case "%I": // Link title attribute
				return this.LinkData.linkTitle;
				break;
			case "%L": // Local time
				var _ts = new Date();
				return _ts.toLocaleString();
				break;
			case "%N": // New-line
				return this.GetNewLine();
				break;
			case "%P": // Page title
				return this.LinkData.pageTitle;
				break;
			case "%R": // Page URL
				return this.LinkData.pageURL;
				break;
			case "%S": // Selected text
				return this.LinkData.selection;
				break;
			case "%T": // Link text / Page Title
				return this.LinkData.linkText;
				break;
			case "%U": // Link URL / Page URL
				return this.LinkData.linkURL;
				break;
		}
		return '';
	},

	FormatString: function(string, type)
	{
		var result = "";
		var buffer = "";
		
		for(var i=0; i<string.length; i++)
		{
			if(string.charAt(i) == "%" && (i+1 < string.length))
			{
				buffer = string.charAt(i);
				
				if(string.charAt(i+1) == "%")
				{
					result += "%"; // Only add a percent sign
					i++; // Bump 'i' so we skip the next character next time around the loop
				}
				else
				{
					buffer += string.charAt(i+1); // Pull in the next character
					i++; // Bump 'i' so we skip the next character next time around the loop
					
					if(buffer == "%?") // Handle the conditional case
					{
						var conditional = "";
						var j=i+1;
						var obraces = 0;
						for(j; j<string.length; j++) // Eat up everything in the conditional
						{
							conditional += string.charAt(j);
							if(string.charAt(j) == '[')
								obraces++;
							
							if(string.charAt(j) == ']')
							{
								obraces--;
								if(obraces <= 0)
									break;
							}
						}
						conditional = conditional.replace(/^\[/, ''); // Replace leading [
						conditional = conditional.replace(/\]$/, ''); // Replace trailing ]
						var tests = conditional.split('|'); // Split on the pipe character for things to test
						for(var x=0; x<tests.length; x++)
						{
							var re = /{(.*)}/; // Capture any replacement text the user may have implemented
							var matches = re.exec(tests[x]);
							var tvar = tests[x].replace(re, ''); // Variable to test on
							var tval = (matches && matches.length > 0) ? matches[1] : ''; // Substitute value to use
							var tbuff = this.DoSubs('%' + tvar); // Expand the test variable
							if(tbuff.length > 0)
							{
								if(tval.length > 0)
									result += this.FormatString(tval, type);
								else
									result += tbuff;
								break;
							}
						}
						i=j; // Skip over the conditional
					}
					else
						result += this.DoSubs(buffer);
				}
				
				buffer = ""; // Clear the buffer
			}
			else if(string.charAt(i) == "\\" && (i+1 < string.length))
			{
				if(string.charAt(i+1) == "%")
				{
					result += "%"; // Only add a percent sign
					i++; // Bump 'i' so we skip the next character next time around the loop
				}
				else
					result += string.charAt(i);
			}
			else
				result += string.charAt(i);
		}
		
		return result;
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
	
	Legacy_GetComplexPref: function(name)
	{
		return CoLTCommon.Data.PrefBranch.getComplexValue(name, Components.interfaces.nsISupportsString).data;
	},

	Legacy_MigratePrefs: function(oldBranch)
	{
		for(var pid in CoLTCommon.Data.Prefs)
		{
			var p = CoLTCommon.Data.Prefs[pid];
			if(oldBranch.prefHasUserValue(p.name))
			{
				if(p.hasOwnProperty("type"))
				{
					if(p.type == "int")
					{
						var temp = oldBranch.getIntPref(p.name);
						CoLTCommon.Data.PrefBranch.setIntPref(p.name, temp);
						this.DeletePref(oldBranch, p.name); // Clean up the old preference
					}
				}
				else
				{
					var temp = oldBranch.getBoolPref(p.name); // Get the old preference
					CoLTCommon.Data.PrefBranch.setBoolPref(p.name, temp); // Move it to the new location
					this.DeletePref(oldBranch, p.name); // Clean up the old preference
				}
			}
		}
		
		var customCount = CoLTCommon.Data.PrefBranch.getIntPref("custom.count");
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
				CoLTCommon.Data.PrefBranch.setBoolPref(name, value); // Move the separator pref
				this.DeletePref(oldBranch, name);
			}
			else
			{
				// Migrate the label
				name = "custom." + i + ".label";
				value = oldBranch.getCharPref(name);
				this.Legacy_SetComplexPref(name, value);
				this.DeletePref(oldBranch, name);
				
				// Migrate the format
				name = "custom." + i + ".format";
				value = oldBranch.getCharPref(name);
				this.Legacy_SetComplexPref(name, value);
				this.DeletePref(oldBranch, name);
				
				// Remove the extraneous separator
				this.DeletePref(oldBranch, "custom." + i + ".separator");
			}
		}
		
		// Clean up the final obsolete pref
		if(oldBranch.prefHasUserValue("version"))
			this.DeletePref(oldBranch, "version");
	},
	
	Legacy_SetComplexPref: function(name, value)
	{
		try {
			var complex = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			complex.data = value;
			CoLTCommon.Data.PrefBranch.setComplexValue(name, Components.interfaces.nsISupportsString, complex);
		} catch(e) { CoLTCommon.Func.Log("ERROR: Caught exception trying to set complex preference (" + e.message + ")"); }
	},
	
	LoadLinkData: function(type)
	{
		if(type == "link")
		{
			this.LinkData.linkURL = gContextMenu.linkURL;
			this.LinkData.linkText = gContextMenu.linkText();
			this.LinkData.linkTitle = document.getElementById("contentAreaContextMenu").triggerNode.title;
			this.LinkData.pageTitle = content.document.title;
			this.LinkData.pageURL = content.document.location.href;
			this.LinkData.selection = '';
		}
		else if(type == "page")
		{
			this.LinkData.linkURL = content.document.location.href;
			this.LinkData.linkText = content.document.title;
			this.LinkData.linkTitle = '';
			this.LinkData.pageTitle = '';
			this.LinkData.pageURL = '';
			this.LinkData.selection = document.commandDispatcher.focusedWindow.getSelection().toString();
		}
		else
		{
			this.LinkData.linkURL = '';
			this.LinkData.linkText = '';
			this.LinkData.linkTitle = '';
			this.LinkData.pageTitle = '';
			this.LinkData.pageURL = '';
			this.LinkData.selection = '';
		}
	},
	
	LoadPrefs: function()
	{
		var b = CoLTCommon.Data.PrefBranch;
		var p = CoLTCommon.Data.Prefs;
	
		p.ShowCopyText.value = b.getBoolPref(p.ShowCopyText.name);
		p.ShowCopyBoth.value = b.getBoolPref(p.ShowCopyBoth.name);
		p.ShowCopyPage.value = b.getBoolPref(p.ShowCopyPage.name);
	},

	NukePreviousPrefs: function()
	{
		var countPrefName = "custom.count";
		if(CoLTCommon.Data.PrefBranch.prefHasUserValue(countPrefName))
		{
			var c = CoLTCommon.Data.PrefBranch.getIntPref(countPrefName);
			for(var i=1; i<=c; i++)
			{
				var separatorPref = "custom." + i + ".separator";

				if(CoLTCommon.Data.PrefBranch.prefHasUserValue(separatorPref))
				{
					this.DeletePref(CoLTCommon.Data.PrefBranch, separatorPref);
				}
				else
				{
					if(CoLTCommon.Data.PrefBranch.prefHasUserValue("custom." + i + ".label"))
						this.DeletePref(CoLTCommon.Data.PrefBranch, "custom." + i + ".label");
					
					if(CoLTCommon.Data.PrefBranch.prefHasUserValue("custom." + i + ".format"))
						this.DeletePref(CoLTCommon.Data.PrefBranch, "custom." + i + ".format");

					if(CoLTCommon.Data.PrefBranch.prefHasUserValue("custom." + i + ".accesskey"))
						this.DeletePref(CoLTCommon.Data.PrefBranch, "custom." + i + ".accesskey");
				}
			}
			
			this.DeletePref(CoLTCommon.Data.PrefBranch, countPrefName);
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

	PurgeContextSubMenu: function(node)
	{
		// Remove all the menu items from the sub menu (since we will recreate them)
		while(node.firstChild)
			node.removeChild(node.firstChild);
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
	
			if(CoLTCommon.Data.PrefBranch.prefHasUserValue("prefs_version") == false)
			{
				var oldBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("colt.");
				if(oldBranch.prefHasUserValue("custom.count"))
					objCoLT.Legacy_MigratePrefs(oldBranch); // Migrate old preferences
				else
				{
					objCoLT.NukePreviousPrefs();
					CoLTCommon.Func.SetupDefaults(); // Create the defaults (new install)
				}
				
				CoLTCommon.Data.PrefBranch.setIntPref("prefs_version", CoLTCommon.Data.PrefVersion);
			}
			else
			{
				// Update our preferences if necessary
				var pv = CoLTCommon.Data.PrefBranch.getIntPref("prefs_version");
				if(pv < CoLTCommon.Data.PrefVersion)
					objCoLT.UpdatePrefs(pv);
			}
			
			objCoLT.LoadPrefs();
			CoLTCommon.Func.LoadCustomFormats();
				
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
	
		copyText.hidden = (CoLTCommon.Data.Prefs.ShowCopyText.value) ? hiddenFlag : true;
		copyBothItem.hidden = (CoLTCommon.Data.Prefs.ShowCopyBoth.value && (CoLTCommon.Data.CustomFormats.length == 1)) ? hiddenFlag : true;
		copyBothMenu.hidden = (CoLTCommon.Data.Prefs.ShowCopyBoth.value && (CoLTCommon.Data.CustomFormats.length > 1)) ? hiddenFlag : true;
	
		// This time we default to false (we want to show the items more often than we want to hide them)
		hiddenFlag = false;
		if(gContextMenu && (gContextMenu.onLink || gContextMenu.onTextInput))
			hiddenFlag = true;
		
		copyPageItem.hidden = (CoLTCommon.Data.Prefs.ShowCopyPage.value && (CoLTCommon.Data.CustomFormats.length == 1)) ? hiddenFlag : true;
		copyPageMenu.hidden = (CoLTCommon.Data.Prefs.ShowCopyPage.value && (CoLTCommon.Data.CustomFormats.length > 1)) ? hiddenFlag : true;
	},

	UpdateContextSubMenu: function(node, type)
	{
		this.PurgeContextSubMenu(node);
	
		for(var i=0; i < CoLTCommon.Data.CustomFormats.length; i++)
		{
			if(CoLTCommon.Data.CustomFormats[i].hasOwnProperty("isSep") && 
			   CoLTCommon.Data.CustomFormats[i].isSep == true)
			{
				var menuseparator = document.createElement("menuseparator");
				node.appendChild(menuseparator);
			}
			else
			{
				// Skip any weird occurances that don't have a label (shouldn't happen, but you never know)
				if(CoLTCommon.Data.CustomFormats[i].hasOwnProperty("label") && 
				   CoLTCommon.Data.CustomFormats[i].label != "")
				{
					var menuitem = document.createElement("menuitem");
					menuitem.setAttribute("label", CoLTCommon.Data.CustomFormats[i].label);
					if(CoLTCommon.Data.CustomFormats[i].hasOwnProperty("key") && 
					   CoLTCommon.Data.CustomFormats[i].key != "")
						menuitem.setAttribute("accesskey", CoLTCommon.Data.CustomFormats[i].key);
					menuitem.setAttribute("formatindex", i);
					node.appendChild(menuitem);
				}
			}
		}
	},
	
	UpdatePrefs: function(currentVersion)
	{
		if(currentVersion < 3)
		{
			var customCount = CoLTCommon.Data.PrefBranch.getIntPref("custom.count");
			for(var i=1; i <= customCount; i++)
			{
				var sepPref = "custom." + i + ".separator";
				var isSep = CoLTCommon.Data.PrefBranch.prefHasUserValue(sepPref);
				
				var keyPref = "custom." + i + ".accesskey";
				if(isSep == false && CoLTCommon.Data.PrefBranch.prefHasUserValue(keyPref) == false)
				{
					this.Legacy_SetComplexPref(keyPref, ""); // Set them to blank if we're upgrading
				}
			}
		}
		
		if(currentVersion < 4)
		{
			// Migrate custom formats to an external JSON file
			var customCount = CoLTCommon.Data.PrefBranch.getIntPref("custom.count");
			for(var i=1; i <= customCount; i++)
			{
				var formatObj = {};
				if(CoLTCommon.Data.PrefBranch.prefHasUserValue("custom." + i + ".separator"))
				{
					formatObj.isSep = true;
				}
				else
				{
					formatObj.label = this.Legacy_GetComplexPref("custom." + i + ".label");
					formatObj.key = this.Legacy_GetComplexPref("custom." + i + ".accesskey");
					formatObj.format = this.Legacy_GetComplexPref("custom." + i + ".format");
				}
				CoLTCommon.Data.CustomFormats.push(formatObj);
			}
			
			CoLTCommon.Func.StoreCustomFormats();
			
			// TODO: Reenable
			//this.NukePreviousPrefs(); // Clean up our old prefs
		}
		
		// Finally, update the stored preference version
		//CoLTCommon.Data.PrefBranch.setIntPref("prefs_version", CoLTCommon.Data.PrefVersion); // TODO: Reenable
	}
};

window.addEventListener('load', objCoLT.Startup, false);
window.addEventListener('unload', objCoLT.Shutdown, false);

