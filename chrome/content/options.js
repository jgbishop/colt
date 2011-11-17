var objCoLTOptions = {
	CustomFormatLabel : null,
	CustomFormatFormat : null,
	CustomFormatRichText : null,
	
	RichTextFormatLabel : "{RT}",
	
	_selectItem: function(item)
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		listBox.clearSelection(); // Clear all selected elements
		listBox.ensureElementIsVisible(item); // Make sure it's visible (first!)
		listBox.selectItem(item); // Select the incoming item
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
			var formatPref = "custom." + i + ".format";
			var separatorPref = "custom." + i + ".separator";
			
			var listItem = document.createElement("listitem");
			var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
			
			if(branch.prefHasUserValue(separatorPref))
			{
				var separatorElement = document.createElement("separator");
				separatorElement.setAttribute("class", "groove");
				listItem.appendChild(separatorElement);
	
				separatorElement = document.createElement("separator");
				separatorElement.setAttribute("class", "groove");
				listItem.appendChild(separatorElement);
	
				listBox.appendChild(listItem);
			}
			else
			{
				var label = objCoLT.GetComplexPref(labelPref);
				var format = objCoLT.GetComplexPref(formatPref);
				
				var listCell = document.createElement("listcell");
	
				listCell.setAttribute("label", label);
				listItem.appendChild(listCell);
	
				listCell = document.createElement("listcell");
				listCell.setAttribute("label", format);
				
				listItem.appendChild(listCell);
				listBox.appendChild(listItem);
			}
		}
		
		this.UpdateSubmenuControls();
	},
	
	OnAddCustomFormat: function()
	{
		window.openDialog("chrome://colt/content/custom_format.xul", "colt-custom-format-dialog", "centerscreen,chrome,modal", "add");
	
		if(this.CustomFormatLabel && (this.CustomFormatFormat || this.CustomFormatRichText))
		{
			var listCell = document.createElement("listcell");
			var listItem = document.createElement("listitem");
			var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
	
			listCell.setAttribute("label", this.CustomFormatLabel);
			listItem.appendChild(listCell);
	
			listCell = document.createElement("listcell");
			if(this.CustomFormatRichText)
				listCell.setAttribute("label", this.RichTextFormatLabel);
			else
				listCell.setAttribute("label", this.CustomFormatFormat);
			
			listItem.appendChild(listCell);
			this._selectItem(listBox.appendChild(listItem));
		}
	},

	OnAddSeparator: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var listItem = document.createElement("listitem");
		var separator = document.createElement("separator");
	
		separator.setAttribute("class", "groove");
		listItem.appendChild(separator);
	
		separator = document.createElement("separator");
		separator.setAttribute("class", "groove");
		listItem.appendChild(separator);

		this._selectItem(listBox.appendChild(listItem));
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
								  selectedItem.childNodes[1].getAttribute("label"));
	
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
					listCell.setAttribute("label", this.CustomFormatFormat);
					selectedItem.appendChild(listCell);

					this._selectItem(selectedItem);
				}
			}
		}
	},
	
	OnListBoxSelected: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var selectedIndex = listBox.selectedIndex;
	
		var addButton = document.getElementById("CLT-Opt-Add-Format");
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
			var formatPref = "custom." + i + ".format";
			var separatorPref = "custom." + i + ".separator";
	
			if(branch.prefHasUserValue(separatorPref))
				branch.clearUserPref(separatorPref);
			else
			{
				branch.clearUserPref(labelPref);
				branch.clearUserPref(formatPref);
			}
		}
	
		// Now store all the current formats
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		for(var i=1; i <= listBox.getRowCount(); i++)
		{
			var listItem = listBox.getItemAtIndex(i - 1);
			var listCell = listItem.childNodes[0];
	
			if(listCell.tagName == "separator")
			{
				branch.setBoolPref("custom." + i + ".separator", true);
			}
			else
			{
				objCoLT.SetComplexPref("custom." + i + ".label", listCell.getAttribute("label"));
				objCoLT.SetComplexPref("custom." + i + ".format", listItem.childNodes[1].getAttribute("label"));
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
		document.getElementById("CLT-Opt-Add-Format").disabled = disabled;
		document.getElementById("CLT-Opt-Edit-Format").disabled = disabled;
		document.getElementById("CLT-Opt-Remove-Format").disabled = disabled;
		document.getElementById("CLT-Opt-Add-Separator").disabled = disabled;
	
		this.OnListBoxSelected();
	}
};

