// Components.utils.import('resource://colt/colt-common.js');

var objCoLTFrameScript = {
	GetPageInfo: function(message)
	{
		// CoLTCommon.Func.Log("(fs) Entered CoLT frame script GetPageInfo");
		sendAsyncMessage("{e6c4c3ef-3d4d-42d6-8283-8da73c53a283}:page-info-loaded", {
			pageURL: content.document.location.href,
			pageTitle: content.document.title,
			selection: content.getSelection().toString(),
			dataType: message.data.dataType,
			fmtIndex: message.data.fmtIndex
		});
	},

	Init: function()
	{
		// CoLTCommon.Func.Log("(fs) Entered Init!");
		addMessageListener("{e6c4c3ef-3d4d-42d6-8283-8da73c53a283}:get-page-info", objCoLTFrameScript.GetPageInfo);
	}
};

objCoLTFrameScript.Init();