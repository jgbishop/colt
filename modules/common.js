var EXPORTED_SYMBOLS = ["CoLTCommon"];

Components.utils.import('resource://gre/modules/devtools/Console.jsm');
Components.utils.import('resource://gre/modules/FileUtils.jsm');
Components.utils.import('resource://gre/modules/NetUtil.jsm');

if (typeof(CoLTCommon) === "undefined")
{
	var CoLTCommon = {};
}

CoLTCommon.Data = {
	PrefBranch: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.colt."),
	PrefVersion: 4,
	
	Prefs: {
		ShowCopyText: { name: "showcopytext", value: false },
		ShowCopyBoth: { name: "showcopyboth", value: false },
		ShowCopyPage: { name: "showcopypage", value: false },
	},
	
	CustomFormats: [],
	FormatsFile: "colt-formats.json",
	RichTextFormatLabel: "{RT}",
	TempCustomFormat: {label: null, key: null, format: null, isRichText: false}
};

CoLTCommon.Func = {
	Log: function(aMessage)
	{
		console.log('CoLT: ' + aMessage);
	},
	
	LogRaw: function(data)
	{
		console.log(data);
	},
	
	LoadCustomFormats: function(filePath)
	{
		var file = null;
		if(typeof filePath === "undefined")
		{
			CoLTCommon.Func.Log("Loading formats file: " + CoLTCommon.Data.FormatsFile);
			file = FileUtils.getFile("ProfD", [CoLTCommon.Data.FormatsFile]);
		}
		else
		{
			CoLTCommon.Func.Log("Loading formats file: " + filePath);
			file = new FileUtils.File(filePath);
		}
		
		if(file.exists())
		{
			CoLTCommon.Func.Log(" - File exists!");
			var channel = NetUtil.newChannel(file);
			channel.contentType = "application/json";
			
			NetUtil.asyncFetch(channel, function(inputStream, status) {
				if(!Components.isSuccessCode(status))
				{
					CoLTCommon.Func.Log("ERROR: Failed to open input stream on custom formats file (return code was " + status + ")!");
					return;
				}
				
				var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
				var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
								createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
				converter.charset = "UTF-8";
				var newData = converter.ConvertToUnicode(data);
				if(CoLTCommon.Data.CustomFormats.length > 0)
					CoLTCommon.Data.CustomFormats.length = 0;
				CoLTCommon.Data.CustomFormats = JSON.parse(newData);
				CoLTCommon.Func.Log(" - Count (after file load call): " + CoLTCommon.Data.CustomFormats.length);
			});
		}
		else
		{
			CoLTCommon.Func.Log(" - File does not exist!");
			if(typeof filePath === "undefined")
				CoLTCommon.Func.SetupDefaults();
			else
			{
				// This case should probably never happen, but just in case
				CoLTCommon.Func.Log("ERROR: Failed to open user-specified file (file wasn't found)!");
			}
		}
	},
	
	SetupDefaults: function()
	{
		var stringBundle = document.getElementById("CLT-String-Bundle");
		
		if(CoLTCommon.Data.CustomFormats.length > 0)
			CoLTCommon.Data.CustomFormats.length = 0;
		
		CoLTCommon.Data.CustomFormats.push(
			{label: stringBundle.getString("CLT_DefaultLabelHTMLLink"), key: 'H', format: "<a href=\"%U\">%T</a>"},
			{label: stringBundle.getString("CLT_DefaultLabelPlainText"), key: 'P', format: "%T - %U"},
			{isSep: true},
			{label: "BB Code", key: 'B', format: "[url=%U]%T[/url]"},
			{label: "Markdown", key: 'M', format: "[%T](%U)"},
			{label: "Wikipedia", key: 'W', format: "[%U %T]"},
			{isSep: true},
			{label: "Rich Text HTML", key: 'R', format: "{RT}"}
		);
		
		CoLTCommon.Func.StoreCustomFormats();
	},

	StoreCustomFormats: function(filePath)
	{
		var file = null;
		if(typeof filePath === "undefined")
			file = FileUtils.getFile("ProfD", [CoLTCommon.Data.FormatsFile]);
		else
			file = new FileUtils.File(filePath);
		
		var ostream = FileUtils.openSafeFileOutputStream(file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE);
		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
						createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";
		var istream = converter.convertToInputStream(JSON.stringify(CoLTCommon.Data.CustomFormats));
		NetUtil.asyncCopy(istream, ostream, function(status) {
			// Note that both streams are automatically closed when the copy operation is completed
			if(!Components.isSuccessCode(status))
			{
				CoLTCommon.Func.Log("ERROR: Failed to perform async copy operation (return code was " + status + ")!");
				return;
			}
		});
	},
	
	Trim: function(text)
	{
		if(text == "")
			return "";
	
		text = text.replace(/^\s+/, '');
		text = text.replace(/\s+$/, '');
		return text;
	}
};
