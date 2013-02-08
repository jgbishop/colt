var objCoLTOptions = {
	CustomFormatLabel: null,
	CustomFormatAccessKey: null,
	CustomFormatFormat: null,
	CustomFormatRichText: null,
	
	RichTextFormatLabel: "{RT}",
	
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

	LoadOptions: function()
	{
		const branch = objCoLT.PrefBranch;
	
		document.getElementById("CLT-Opt-DisplayCopyText").checked = branch.getBoolPref(objCoLT.Prefs.ShowCopyText.name);
		document.getElementById("CLT-Opt-DisplayCopyBoth").checked	= branch.getBoolPref(objCoLT.Prefs.ShowCopyBoth.name);
		document.getElementById("CLT-Opt-DisplayCopyPage").checked	= branch.getBoolPref(objCoLT.Prefs.ShowCopyPage.name);
	
		var count = branch.getIntPref(objCoLT.Prefs.CustomFormatCount.name);
		for(var i=1; i <= count; i++)
		{
			var labelPref = "custom." + i + ".label";
			var accessKeyPref = "custom." + i + ".accesskey";
			var formatPref = "custom." + i + ".format";
			var separatorPref = "custom." + i + ".separator";
			
			var listItem = document.createElement("listitem");
			var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
			
			if(branch.prefHasUserValue(separatorPref))
			{
				this.AppendSeparator(false);
			}
			else
			{
				var label = objCoLT.GetComplexPref(labelPref);
				var key = objCoLT.GetComplexPref(accessKeyPref);
				var format = objCoLT.GetComplexPref(formatPref);
				
				this.AppendFormat(label, key, format, false);
			}
		}
		
		this.UpdateSubmenuControls();
	},
	
	OnAddCustomFormat: function()
	{
		window.openDialog("chrome://colt/content/custom_format.xul", "colt-custom-format-dialog", "centerscreen,chrome,modal", "add");
	
		if(this.CustomFormatLabel && (this.CustomFormatFormat || this.CustomFormatRichText))
		{
			this.AppendFormat(this.CustomFormatLabel, this.CustomFormatAccessKey, 
							  (this.CustomFormatRichText ? this.RichTextFormatLabel : this.CustomFormatFormat), true);
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
	
				if(this.CustomFormatLabel && this.CustomFormatFormat)
				{
					var childElements = selectedItem.childNodes;
					while(childElements.length > 0)
					{
						selectedItem.removeChild(childElements[0]);
					}
					
					var listCell = document.createElement("listcell");
	
					listCell.setAttribute("label", this.CustomFormatLabel);
					selectedItem.appendChild(listCell);
					
					listCell = document.createElement("listcell");
					listCell.setAttribute("label", this.CustomFormatAccessKey);
					selectedItem.appendChild(listCell);
	
					listCell = document.createElement("listcell");
					listCell.setAttribute("label", this.CustomFormatFormat);
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
		fp.appendFilters(nsIFilePicker.filterText);
		fp.appendFilters(nsIFilePicker.filterAll);
		fp.defaultExtension = "txt";
		
		var retval = fp.show();
		if(retval == nsIFilePicker.returnOK || retval == nsIFilePicker.returnReplace)
		{
			var file = fp.file;
			var path = fp.file.path;
			
			var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
				createInstance(Components.interfaces.nsIFileOutputStream);
			// Open the file for writing (0x02), create if necessary (0x08), and truncate if it exists (0x20)
			foStream.init(fp.file, 0x02 | 0x08 | 0x20, -1, 0);
			
			var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
				createInstance(Components.interfaces.nsIConverterOutputStream);
			converter.init(foStream, "UTF-8", 0, 0);
//  		converter.writeString("\xEF\xBB\xBF"); // Write the BOM
			
			// Write the data from the list box
			var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
			var nl = objCoLT.GetNewLine();
			for(var i=1; i <= listBox.getRowCount(); i++)
			{
				var listItem = listBox.getItemAtIndex(i - 1);
				var string = "---ITEM---" + nl;
				if(listItem.childNodes[0].tagName == "separator")
				{
					string += "s:separator" + nl;
				}
				else
				{
					string += "f:" + listItem.childNodes[2].getAttribute("label") + nl; // Format
					string += "l:" + listItem.childNodes[0].getAttribute("label") + nl; // Label
					string += "a:" + listItem.childNodes[1].getAttribute("label") + nl; // Access Key
				}
				converter.writeString(string);
			}
			
			converter.close(); // Closes foStream
		}
	},
	
	OnImportCustom: function()
	{
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		var stringBundle = document.getElementById("CLT-String-Bundle");
		
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, stringBundle.getString("CLT_ImportTitle"), nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterText);
		fp.appendFilters(nsIFilePicker.filterAll);
		fp.defaultExtension = "txt";
		
		var retval = fp.show();
		if(retval == nsIFilePicker.returnOK)
		{
			var file = fp.file;
			var path = fp.file.path;
			
			var fiStream = Components.classes["@mozilla.org/network/file-input-stream;1"].
				createInstance(Components.interfaces.nsIFileInputStream);
			fiStream.init(fp.file, 0x01, -1, 0); // Open the file for reading (0x01)
			
			var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
				createInstance(Components.interfaces.nsIConverterInputStream);
			is.init(fiStream, "UTF-8", 0, 0);
			is.QueryInterface(Components.interfaces.nsIUnicharLineInputStream);
			
			var importData = new Array();
			
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
							buf['access'] = data;
							break;
						case 'f':
							buf['format'] = data;
							break;
						case 'l':
							buf['label'] = data;
							break;
						case 's':
							buf['separator'] = true;
							break;
						default:
							break;
						}
					}
				} while(c);
				
				importData.push(buf); // Push the last object onto the array
				is.close();
				fiStream.close();
			}
			else
			{
				alert("ERROR: Failed to import file due to invalid nsIConverterInputStream");
				is.close();
				fiStream.close();
				return;
			}
			
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
			for(var i=0; i<importData.length; i++)
			{
				if(importData[i].hasOwnProperty('separator'))
					this.AppendSeparator(false);
				else
					this.AppendFormat(importData[i]['label'], importData[i]['access'], importData[i]['format'], false);
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

	SaveOptions: function()
	{
		const branch = objCoLT.PrefBranch;

		branch.setBoolPref(objCoLT.Prefs.ShowCopyText.name, document.getElementById("CLT-Opt-DisplayCopyText").checked);
		branch.setBoolPref(objCoLT.Prefs.ShowCopyBoth.name, document.getElementById("CLT-Opt-DisplayCopyBoth").checked);
		branch.setBoolPref(objCoLT.Prefs.ShowCopyPage.name, document.getElementById("CLT-Opt-DisplayCopyPage").checked);
	
		// Clean up all the existing custom formats
		var count = branch.getIntPref(objCoLT.Prefs.CustomFormatCount.name);
		
		for(var i=1; i <= count; i++)
		{
			var labelPref = "custom." + i + ".label";
			var keyPref = "custom." + i + ".accesskey";
			var formatPref = "custom." + i + ".format";
			var separatorPref = "custom." + i + ".separator";
	
			if(branch.prefHasUserValue(separatorPref))
				branch.clearUserPref(separatorPref);
			else
			{
				branch.clearUserPref(labelPref);
				branch.clearUserPref(keyPref);
				branch.clearUserPref(formatPref);
			}
		}
	
		// Now store all the current formats
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		for(var i=1; i <= listBox.getRowCount(); i++)
		{
			var listItem = listBox.getItemAtIndex(i - 1);
	
			if(listItem.childNodes[0].tagName == "separator")
			{
				branch.setBoolPref("custom." + i + ".separator", true);
			}
			else
			{
				objCoLT.SetComplexPref("custom." + i + ".label", listItem.childNodes[0].getAttribute("label"));
				objCoLT.SetComplexPref("custom." + i + ".accesskey", listItem.childNodes[1].getAttribute("label"));
				objCoLT.SetComplexPref("custom." + i + ".format", listItem.childNodes[2].getAttribute("label"));
			}
		}
	
		branch.setIntPref(objCoLT.Prefs.CustomFormatCount.name, listBox.getRowCount());
		
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
		} catch (e) { objCoLT.Log("Exception caught while propagating options."); }
	},
	
	Trim: function(text)
	{
		if(text == "")
			return "";
	
		text = text.replace(/^\s+/, '');
		text = text.replace(/\s+$/, '');
		return text;
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

