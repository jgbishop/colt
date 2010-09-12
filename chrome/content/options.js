var objCoLTOptions = {
	CustomFormatLabel : null,
	CustomFormatFormat : null,
	CustomFormatRichText : null,
	
	RichTextFormatLabel : "{RT}",
		
	LoadOptions: function()
	{
		const branch = objCoLT.PrefBranch;
	
		document.getElementById("CLT-Opt-DisplayCopyText").checked = branch.getBoolPref(objCoLT.PrefName_ShowCopyText);
		document.getElementById("CLT-Opt-DisplayCopyBoth").checked	= branch.getBoolPref(objCoLT.PrefName_ShowCopyBoth);
		document.getElementById("CLT-Opt-DisplayCopyPage").checked	= branch.getBoolPref(objCoLT.PrefName_ShowCopyPage);
	
		var count = branch.getIntPref(objCoLT.PrefName_CustomFormatCount);
		for(var i=1; i <= count; i++)
		{
			var labelPref = "custom." + i + ".label";
			var formatPref = "custom." + i + ".format";
			var separatorPref = "custom." + i + ".separator";
//  		var richTextPref = "custom." + i + ".richtext";
	
			var label = "";
			var format = "";
			var separator = false;
//  		var richText = false;
	
			if(objCoLT.IsPreferenceSet(labelPref))
				label = branch.getCharPref(labelPref);
	
			if(objCoLT.IsPreferenceSet(formatPref))
				format = branch.getCharPref(formatPref);
	
			if(objCoLT.IsPreferenceSet(separatorPref))
				separator = branch.getBoolPref(separatorPref);
	
//  		if(objCoLT.IsPreferenceSet(richTextPref))
//  			richText = branch.getBoolPref(richTextPref);
			
			var listItem = document.createElement("listitem");
			var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
	
			if(separator)
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
				var listCell = document.createElement("listcell");
	
				listCell.setAttribute("label", label);
				listItem.appendChild(listCell);
	
				listCell = document.createElement("listcell");
//  			if(richText)
//  				listCell.setAttribute("label", this.RichTextFormatLabel);
//  			else
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
			listBox.selectItem(listBox.appendChild(listItem));
			listBox.ensureElementIsVisible(listBox.selectedItem);
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
	
		listBox.selectItem(listBox.appendChild(listItem));
		listBox.ensureElementIsVisible(listBox.selectedItem);
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
					listBox.ensureElementIsVisible(selectedItem);
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
		var selItem = listBox.selectedItem;
	
		if(selItem && listBox.selectedIndex != listBox.getRowCount() - 1)
			listBox.selectItem(listBox.insertBefore(selItem, listBox.getNextItem(selItem, 2)));
	},
	
	OnMoveUp: function()
	{
		var listBox = document.getElementById("CLT-Opt-Custom-Format-List");
		var selItem = listBox.selectedItem;
	
		if(selItem && listBox.selectedIndex != 0)
			listBox.selectItem(listBox.insertBefore(selItem, listBox.getPreviousItem(selItem, 1)));
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

			// Select the item at the index
			listBox.selectItem(newItem);
			listBox.ensureElementIsVisible(newItem);
		}
	},

	SaveOptions: function()
	{
		const branch = objCoLT.PrefBranch;

		branch.setBoolPref(objCoLT.PrefName_ShowCopyText, document.getElementById("CLT-Opt-DisplayCopyText").checked);
		branch.setBoolPref(objCoLT.PrefName_ShowCopyBoth, document.getElementById("CLT-Opt-DisplayCopyBoth").checked);
		branch.setBoolPref(objCoLT.PrefName_ShowCopyPage, document.getElementById("CLT-Opt-DisplayCopyPage").checked);
	
		// Clean up all the existing custom formats
		var count = branch.getIntPref(objCoLT.PrefName_CustomFormatCount);
		
		for(var i=1; i <= count; i++)
		{
			var labelPref = "custom." + i + ".label";
			var formatPref = "custom." + i + ".format";
			var separatorPref = "custom." + i + ".separator";
//  		var richTextPref = "custom." + i + ".richtext";
	
			if(objCoLT.IsPreferenceSet(labelPref))
				branch.clearUserPref(labelPref);
	
			if(objCoLT.IsPreferenceSet(formatPref))
				branch.clearUserPref(formatPref);
	
			if(objCoLT.IsPreferenceSet(separatorPref))
				branch.clearUserPref(separatorPref);
	
//  		if(objCoLT.IsPreferenceSet(richTextPref))
//  			branch.clearUserPref(richTextPref);
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
				var formatLabel = listItem.childNodes[1].getAttribute("label");
				
				branch.setCharPref("custom." + i + ".label", listCell.getAttribute("label"));
				branch.setCharPref("custom." + i + ".format", formatLabel);
				branch.setBoolPref("custom." + i + ".separator", false);
	
//  			if(formatLabel == this.RichTextFormatLabel)
//  				branch.setBoolPref("custom." + i + ".richtext", true);
//  			else
//  				branch.setBoolPref("custom." + i + ".richtext", false);
			}
		}
	
		branch.setIntPref(objCoLT.PrefName_CustomFormatCount, listBox.getRowCount());
		
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

