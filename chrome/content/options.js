Components.utils.import('resource://colt/common.js');

var objCoLTOptions = {
	_selectItem: function(item)
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		listBox.clearSelection(); // Clear all selected elements
		listBox.ensureElementIsVisible(item); // Make sure it's visible (first!)
		listBox.selectItem(item); // Select the incoming item
	},
	
	AppendFormat: function(label, accesskey, format, autoSelect)
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var listItem = document.createElement("listitem");
		
		var listCell = document.createElement("listcell");
		listCell.setAttribute("label", label);
		listItem.appendChild(listCell);

		listCell = document.createElement("listcell");
		listCell.setAttribute("label", accesskey);
		listItem.appendChild(listCell);

		listCell = document.createElement("listcell");
		listCell.setAttribute("label", format);
		listItem.appendChild(listCell);
		
		var oref = listBox.appendChild(listItem);
		
		if(autoSelect)
			this._selectItem(oref);
	},
	
	AppendSeparator: function(autoSelect)
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var listItem = document.createElement("listitem");
		
		var separatorElement = document.createElement("separator");
		separatorElement.setAttribute("class", "groove");
		listItem.appendChild(separatorElement);

		separatorElement = document.createElement("separator");
		separatorElement.setAttribute("class", "groove");
		listItem.appendChild(separatorElement);

		separatorElement = document.createElement("separator");
		separatorElement.setAttribute("class", "groove");
		listItem.appendChild(separatorElement);

		var oref = listBox.appendChild(listItem);

		if(autoSelect)
			this._selectItem(oref);
	},
	
	CustomFormatsLoaded: function(formats)
	{
		var stringBundle = document.getElementById("CLT-String-Bundle");
		
		// Prompt the user to see if they want to append to the current list or overwrite it
		var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		var rv = ps.confirmEx(window, stringBundle.getString("CLT_OverwriteTitle"),
							  stringBundle.getString("CLT_OverwritePrompt"),
							  ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_0 +
							  ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_1,
							  stringBundle.getString("CLT_OverwriteButton"),
							  stringBundle.getString("CLT_AppendButton"), null, null, {});

		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");

		// If the user chose to overwrite their items, blow away everything in the current list
		if(rv == 0)
		{
			// Overwrite current items
			while(listBox.hasChildNodes() && listBox.lastChild.nodeName == "listitem")
			{
				listBox.removeChild(listBox.lastChild);
			}
		}

		// Now append all the incoming items
		for(var i=0; i<formats.length; i++)
		{
			if(formats[i].hasOwnProperty('isSep') && formats[i].isSep == true)
				objCoLTOptions.AppendSeparator(false);
			else
				objCoLTOptions.AppendFormat(formats[i].label, formats[i].key, formats[i].format, false);
		}
	},

	LoadOptions: function()
	{
		const branch = CoLTCommon.Data.PrefBranch;
		
		document.getElementById("CLT-Opt-DisplayCopyText").checked = branch.getBoolPref(CoLTCommon.Data.Prefs.ShowCopyText.name);
		document.getElementById("CLT-Opt-DisplayCopyBoth").checked = branch.getBoolPref(CoLTCommon.Data.Prefs.ShowCopyBoth.name);
		document.getElementById("CLT-Opt-DisplayCopyPage").checked = branch.getBoolPref(CoLTCommon.Data.Prefs.ShowCopyPage.name);
		
		for(var i=0; i < CoLTCommon.Data.CustomFormats.length; i++)
		{
			var listItem = document.createElement("listitem");
			
			if(CoLTCommon.Data.CustomFormats[i].hasOwnProperty("isSep") && CoLTCommon.Data.CustomFormats[i].isSep == true)
				this.AppendSeparator(false);
			else
			{
				this.AppendFormat(CoLTCommon.Data.CustomFormats[i].label,
								  CoLTCommon.Data.CustomFormats[i].key,
								  CoLTCommon.Data.CustomFormats[i].format, false);
			}
		}
		
		this.UpdateSubmenuControls();
	},
	
	OnAddCustomFormat: function()
	{
		window.openDialog("chrome://colt/content/custom_format.xul", "colt-custom-format-dialog", "centerscreen,chrome,modal", "add");
	
		if(CoLTCommon.Data.TempCustomFormat.label && 
		   (CoLTCommon.Data.TempCustomFormat.format || CoLTCommon.Data.TempCustomFormat.isRichText))
		{
			this.AppendFormat(CoLTCommon.Data.TempCustomFormat.label,
							  CoLTCommon.Data.TempCustomFormat.key, 
							  (CoLTCommon.Data.TempCustomFormat.isRichText ?
							   CoLTCommon.Data.RichTextFormatLabel : CoLTCommon.Data.TempCustomFormat.format),
							  true);
		}
	},

	OnAddSeparator: function()
	{
		this.AppendSeparator(true);
	},

	OnEditCustomFormat: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var selectedItem = listBox.selectedItem;
	
		if(selectedItem)
		{
			var selectedCell = selectedItem.childNodes[0];
			if(selectedCell.tagName != "separator")
			{
				window.openDialog("chrome://colt/content/custom_format.xul", "colt-custom-format-dialog",
								  "centerscreen,chrome,modal", "edit", selectedCell.getAttribute("label"),
								  selectedItem.childNodes[1].getAttribute("label"),
								  selectedItem.childNodes[2].getAttribute("label"));
	
				if(CoLTCommon.Data.TempCustomFormat.label && CoLTCommon.Data.TempCustomFormat.format)
				{
					var childElements = selectedItem.childNodes;
					while(childElements.length > 0)
					{
						selectedItem.removeChild(childElements[0]);
					}
					
					var listCell = document.createElement("listcell");
	
					listCell.setAttribute("label", CoLTCommon.Data.TempCustomFormat.label);
					selectedItem.appendChild(listCell);
					
					listCell = document.createElement("listcell");
					listCell.setAttribute("label", CoLTCommon.Data.TempCustomFormat.key);
					selectedItem.appendChild(listCell);
	
					listCell = document.createElement("listcell");
					listCell.setAttribute("label", CoLTCommon.Data.TempCustomFormat.format);
					selectedItem.appendChild(listCell);

					this._selectItem(selectedItem);
				}
			}
		}
	},
	
	OnExportCustom: function()
	{
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Export Custom Formats", nsIFilePicker.modeSave);
		fp.appendFilter("JSON Files", "*.json");
		fp.appendFilters(nsIFilePicker.filterAll);
		fp.defaultExtension = "json";
		
		var retval = fp.show();
		if(retval == nsIFilePicker.returnOK || retval == nsIFilePicker.returnReplace)
		{
			CoLTCommon.Func.StoreCustomFormats(fp.file.path);
		}
	},
	
	OnImportCustom: function()
	{
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		var stringBundle = document.getElementById("CLT-String-Bundle");
		
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, stringBundle.getString("CLT_ImportTitle"), nsIFilePicker.modeOpen);
		fp.appendFilter("JSON Files", "*.json");
		fp.appendFilters(nsIFilePicker.filterText);
		fp.appendFilters(nsIFilePicker.filterAll);
		fp.defaultExtension = "json";
		
		var importData = [];
		var retval = fp.show();
		if(retval == nsIFilePicker.returnOK)
		{
			if(/\.txt$/.test(fp.file.path)) // Do a legacy import if we have a txt file
			{
				var fiStream = Components.classes["@mozilla.org/network/file-input-stream;1"].
					createInstance(Components.interfaces.nsIFileInputStream);
				fiStream.init(fp.file, 0x01, -1, 0); // Open the file for reading (0x01)

				var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
					createInstance(Components.interfaces.nsIConverterInputStream);
				is.init(fiStream, "UTF-8", 0, 0);
				is.QueryInterface(Components.interfaces.nsIUnicharLineInputStream);

				if(is instanceof Components.interfaces.nsIUnicharLineInputStream)
				{
					var line = {};
					var c;
					var num = 0;
					var buf = {};
					do {
						c = is.readLine(line);
						var str = line.value;
						str.trim();
						
						if(str == "---ITEM---")
						{
							if(num > 0)
							{
								importData.push(buf);
								buf = {};
							}

							num++;
							continue;
						}

						var prefix = str.substr(0, 2);
						var data = str.slice(2);
						if(prefix.charAt(1) == ':')
						{
							switch(prefix.charAt(0))
							{
							case 'a':
								buf.key = data;
								break;
							case 'f':
								buf.format = data;
								break;
							case 'l':
								buf.label = data;
								break;
							case 's':
								buf.isSep = true;
								break;
							default:
								break;
							}
						}
					} while(c);

					importData.push(buf); // Push the last object onto the array
					is.close();
					fiStream.close();
					
					objCoLTOptions.CustomFormatsLoaded(importData);
				}
				else
				{
					alert("ERROR: Failed to import file due to invalid nsIConverterInputStream");
					is.close();
					fiStream.close();
					return;
				}
			}
			else
			{
				CoLTCommon.Func.LoadCustomFormats(fp.file.path, objCoLTOptions.CustomFormatsLoaded);
			}
		}
	},
	
	OnListBoxSelected: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var selectedIndex = listBox.selectedIndex;
	
		var editButton = document.getElementById("CLT-Opt-Edit-Format");
		var removeButton = document.getElementById("CLT-Opt-Remove-Format");
		var moveUpButton = document.getElementById("CLT-Opt-Move-Format-Up");
		var moveDownButton = document.getElementById("CLT-Opt-Move-Format-Down");
	
		if(listBox.selectedItem)
		{
			removeButton.disabled = false;
	
			if(listBox.selectedItem.childNodes[0].tagName != "separator")
				editButton.disabled = false;
			else
				editButton.disabled = true;
	
			if(selectedIndex == 0)
				moveUpButton.disabled = true;
			else
				moveUpButton.disabled = false;
	
			if(selectedIndex == listBox.getRowCount() - 1)
				moveDownButton.disabled = true;
			else
				moveDownButton.disabled = false;
		}
		else
		{
			editButton.disabled = true;
			removeButton.disabled = true;
			moveUpButton.disabled = true;
			moveDownButton.disabled = true;
		}
	
		if(listBox.getRowCount() == 1)
			removeButton.disabled = true;
	},
	
	OnMoveDown: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");

		// Return if the selected item is null for some reason, or we're at the end of the list
		if (!listBox.selectedItem || listBox.selectedIndex == listBox.getRowCount() - 1)
			return;

		// Figure out where the item is headed
		var newIndex = listBox.selectedIndex + 1;
		
		// Remove the item
		var oldItem = listBox.removeItemAt(listBox.selectedIndex);
		var newItem;

		// If we're at the end of the list, append the item
		if (newIndex == listBox.getRowCount())
			newItem = listBox.appendChild(oldItem);
		else
			newItem = listBox.insertBefore(oldItem, listBox.getItemAtIndex(newIndex));

		this._selectItem(newItem);
	},
	
	OnMoveUp: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");

		if (!listBox.selectedItem || listBox.selectedIndex == 0)
			return;

		var newIndex = listBox.selectedIndex - 1;

		var oldItem = listBox.removeItemAt(listBox.selectedIndex);
		var newItem = listBox.insertBefore(oldItem, listBox.getItemAtIndex(newIndex));

		this._selectItem(newItem);
	},
	
	OnRemoveCustomFormat: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var selItem = listBox.selectedItem;
		var index = listBox.getIndexOfItem(selItem);
		
		if(selItem)
		{
			listBox.removeChild(selItem); // Remove the item

			var count = listBox.getRowCount(); // Get the resulting count
			if (index >= count)
				index = count - 1; // Adjust the index if we've walked off the end

			var newItem = listBox.getItemAtIndex(index);
			this._selectItem(newItem);
		}
	},
	
	OnRestoreDefaults: function()
	{
		var stringBundle = document.getElementById("CLT-String-Bundle");
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);

		var check = {value: false};
		var flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
					prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;
		
		var retVal = prompts.confirmEx(window, stringBundle.getString("CLT_RestoreDefaultsTitle"),
									   stringBundle.getString("CLT_RestoreDefaultsPrompt"), flags, null, null, null, null, check);
		if(retVal == 0) // Button 0 is the "Yes" option here
		{
			// Remove current items
			var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
			while(listBox.hasChildNodes() && listBox.lastChild.nodeName == "listitem")
			{
				listBox.removeChild(listBox.lastChild);
			}
			
			var a = CoLTCommon.Func.GetDefaultFormats();
			
			for(var i=0; i < a.length; i++)
			{
				if(a[i].hasOwnProperty('isSep') && a[i].isSep == true)
					objCoLTOptions.AppendSeparator(false);
				else
					objCoLTOptions.AppendFormat(a[i].label, a[i].key, a[i].format, false);
			}
		}
	},

	SaveOptions: function()
	{
		const branch = CoLTCommon.Data.PrefBranch;

		branch.setBoolPref(CoLTCommon.Data.Prefs.ShowCopyText.name, document.getElementById("CLT-Opt-DisplayCopyText").checked);
		branch.setBoolPref(CoLTCommon.Data.Prefs.ShowCopyBoth.name, document.getElementById("CLT-Opt-DisplayCopyBoth").checked);
		branch.setBoolPref(CoLTCommon.Data.Prefs.ShowCopyPage.name, document.getElementById("CLT-Opt-DisplayCopyPage").checked);
	
		CoLTCommon.Data.CustomFormats.length = 0; // Clean up all the existing custom formats

		// Now store all the current formats
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		for(var i=1; i <= listBox.getRowCount(); i++)
		{
			var listItem = listBox.getItemAtIndex(i - 1);
			var myObj = {};

			if(listItem.childNodes[0].tagName == "separator")
			{
				myObj.isSep = true;
			}
			else
			{
				myObj.label = listItem.childNodes[0].getAttribute("label");
				myObj.key = listItem.childNodes[1].getAttribute("label");
				myObj.format = listItem.childNodes[2].getAttribute("label");
			}
			
			CoLTCommon.Data.CustomFormats.push(myObj);
		}

		CoLTCommon.Func.StoreCustomFormats();
		
		try
		{
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var e = wm.getEnumerator("navigator:browser");
			var win;
	
			while(e.hasMoreElements())
			{
				win = e.getNext();
				win.objCoLT.OptionsHaveUpdated();
			}
		} catch (e) { CoLTCommon.Func.Log("ERROR: Exception caught while propagating options."); }
	},
		
	UpdateSubmenuControls: function()
	{
		var disabled = true;
		if(document.getElementById("CLT-Opt-DisplayCopyBoth").checked ||
		   document.getElementById("CLT-Opt-DisplayCopyPage").checked)
			disabled = false;
	
		if(disabled)
			document.getElementById("CLT-Opt-Custom-Format-List").selectedIndex = -1;
	
		document.getElementById("CLT-Opt-Custom-Format-List").disabled = disabled;
		document.getElementById("CLT-Opt-Move-Format-Up").disabled = disabled;
		document.getElementById("CLT-Opt-Move-Format-Down").disabled = disabled;
		document.getElementById("CLT-Opt-New-Button").disabled = disabled;
		document.getElementById("CLT-Opt-Edit-Format").disabled = disabled;
		document.getElementById("CLT-Opt-Remove-Format").disabled = disabled;
		document.getElementById("CLT-Opt-Export-Import-Button").disabled = disabled;
	
		this.OnListBoxSelected();
	}
};

