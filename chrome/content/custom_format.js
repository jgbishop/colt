Components.utils.import('resource://colt/colt-common.js');

var objCoLTCustomFormat = {
	CustomFormatBuffer : null,
	
	ClearCustomFormat: function()
	{
		CoLTCommon.Data.TempCustomFormat.label = null;
		CoLTCommon.Data.TempCustomFormat.key = null;
		CoLTCommon.Data.TempCustomFormat.format = null;
		CoLTCommon.Data.TempCustomFormat.isRichText = false;
	},

	InitCustomFormat: function()
	{
		var stringBundle = document.getElementById("CLT-String-Bundle");
	
		if(window.arguments[0] == "add")
			document.title = stringBundle.getString("CLT_AddCustomFormat");
		else
		{
			document.title = stringBundle.getString("CLT_EditCustomFormat");
	
			document.getElementById("CLT-Custom-Format-Label").value = window.arguments[1];
			document.getElementById("CLT-Custom-Format-AccessKey").value = window.arguments[2];
			document.getElementById("CLT-Custom-Format-Format").value = window.arguments[3];
	
			if(window.arguments[3] == CoLTCommon.Data.RichTextFormatLabel)
				document.getElementById("CLT-Custom-Format-RichText").checked = true;
		}
	
		this.UpdateCustomFormatControls();
	},
	
	OnCustomFormatLink: function()
	{
		var url = "http://www.borngeek.com/firefox/colt/custom-formats/";
		
		var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var currentWindow = windowMediator.getMostRecentWindow("navigator:browser");
		if (currentWindow)
		{
			try
			{
				currentWindow.delayedOpenTab(url);
			}
			catch(e)
			{
				currentWindow.loadURI(url);
			}
		}
		else
		{
			var protocolService = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
																			.getService(Components.interfaces.nsIExternalProtocolService);
			var uri = Components.classes["@mozilla.org/network/io-service;1"]
													.getService(Components.interfaces.nsIIOService)
													.newURI(url, null, null);
			protocolService.loadURI(uri, null);
		}
	},

	SaveCustomFormat: function()
	{
		var stringBundle = document.getElementById("CLT-String-Bundle");
		
		var label = CoLTCommon.Func.Trim(document.getElementById("CLT-Custom-Format-Label").value);
		var key = document.getElementById("CLT-Custom-Format-AccessKey").value;
		var format = CoLTCommon.Func.Trim(document.getElementById("CLT-Custom-Format-Format").value);
		var richText = document.getElementById("CLT-Custom-Format-RichText").checked;
		var errors = "";
	
		if(!label)
			errors += stringBundle.getString("CLT_EmptyLabel") + "\n";
	
		if(!richText && !format)
			errors += stringBundle.getString("CLT_EmptyFormat") + "\n";
	
		if(errors)
		{
			Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService).alert(null, stringBundle.getString("CLT_ErrorMessage"), errors);
			return false;
		}
		else
		{
			CoLTCommon.Data.TempCustomFormat.label = label;
			CoLTCommon.Data.TempCustomFormat.key = key;
			CoLTCommon.Data.TempCustomFormat.format = format;
			CoLTCommon.Data.TempCustomFormat.isRichText = richText;
			return true;
		}
	},

	UpdateCustomFormatControls: function()
	{
		if(this.CustomFormatBuffer == null)
			this.CustomFormatBuffer = document.getElementById("CLT-Custom-Format-Format").value;
	
		if(document.getElementById("CLT-Custom-Format-RichText").checked)
		{
			document.getElementById("CLT-Custom-Format-Format").disabled = true;
			document.getElementById("CLT-Custom-Format-Format").value = CoLTCommon.Data.RichTextFormatLabel;
		}
		else
		{
			document.getElementById("CLT-Custom-Format-Format").disabled = false;
	
			if(this.CustomFormatBuffer == CoLTCommon.Data.RichTextFormatLabel)
				document.getElementById("CLT-Custom-Format-Format").value = "";
			else
				document.getElementById("CLT-Custom-Format-Format").value = this.CustomFormatBuffer;
		}
	}
};

