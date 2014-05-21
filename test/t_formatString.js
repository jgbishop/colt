// There's probably a much nicer way to do this kind of testing, but this hack
// should do the job for now.

var testCore = {
	LinkData: {
		linkURL: '',
		linkText: '',
		linkTitle: '',
		pageTitle: '',
		pageURL: '',
		selection: ''
	},
	
	append: function(string)
	{
		var out = document.getElementById("output");
		out.value += string + "\n";
	},
	
	clearOutput: function()
	{
		var out = document.getElementById("output");
		out.value = "";
	},
	
	DoSubs: function(string, dParam, tParam)
	{
		switch(string.toUpperCase())
		{
			case "%A": // User-specified URL parameter
				this.append(dParam + ", " + tParam);
				var l = document.createElement("a");
				if(tParam == 'link')
				{
					l.href = this.LinkData.linkURL;
				}
				else
				{
					l.href = this.LinkData.pageURL;
				}
				console.log(l);
				return l[dParam];
				break;
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
				return '\n';
//				return this.GetNewLine();
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
						var conditional = this.GobbleBrackets(string, i+1);
//						var conditional = "";
//						var j=i+1;
//						var obraces = 0;
//						for(j; j<string.length; j++) // Eat up everything in the conditional
//						{
//							conditional += string.charAt(j);
//							if(string.charAt(j) == '[')
//								obraces++;
//
//							if(string.charAt(j) == ']')
//							{
//								obraces--;
//								if(obraces <= 0)
//									break;
//							}
//						}
//						conditional = conditional.replace(/^\[/, ''); // Replace leading [
//						conditional = conditional.replace(/\]$/, ''); // Replace trailing ]
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
					else if(buffer == "%A") // Handle the URL parameter case
					{
						var param = this.GobbleBrackets(string, i+1);
						result += this.DoSubs(buffer, param, type);
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
	
	GobbleBrackets: function(string, startPos)
	{
		var result = "";
		var obraces = 0;
		for(j=startPos; j<string.length; j++)
		{
			result += string.charAt(j);
			if(string.charAt(j) == '[')
				obraces++;

			if(string.charAt(j) == ']')
			{
				obraces--;
				if(obraces <= 0)
					break;
			}
		}
		
		result = result.replace(/^\[/, ''); // Trim leading [
		result = result.replace(/\]$/, ''); // Trim trailing ]
		return result;
	},
	
	LoadTestData: function(itemArray)
	{
		this.LinkData.linkURL = itemArray[0];
		this.LinkData.linkText = itemArray[1];
		this.LinkData.linkTitle = itemArray[2];
		this.LinkData.pageTitle = itemArray[3];
		this.LinkData.pageURL = itemArray[4];
		this.LinkData.selection = itemArray[5];
	}
};
