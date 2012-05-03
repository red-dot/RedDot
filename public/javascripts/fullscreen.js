var FULLSCREEN = {

	toggle: function toggle()
	{
		if(!document.fullScreen && !document.mozFullScreen && !document.webkitIsFullScreen)
		{
			this.activate();
		}
		else
		{
			this.exit();
		}
	},
	
	activate: function activate()
	{	
		$("#toolsHidden").hide("slow");
		
		PDFView.parseScale('page-fit');
			
		if(document.getElementById('body').requestFullScreen)
		{  
			document.getElementById('body').requestFullScreen();  
		}
		else if(document.getElementById('body').mozRequestFullScreen)
		{  
			document.getElementById('body').mozRequestFullScreen();  
		}
		else if(document.getElementById('body').webkitRequestFullScreen)
		{  
			document.getElementById('body').webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}
		
		this.hideAllPage();
		
		this.selectPage(1);
		
		this.disableControlsZoom();
		
		socket.emit('show', { page: 1, key:key, token: token});
	},
	
	exit: function exit()
	{	
		if(document.cancelFullScreen)
		{  
			document.cancelFullScreen();  
		}
		else if(document.mozCancelFullScreen)
		{  
			document.mozCancelFullScreen();  
		}
		else if(document.webkitCancelFullScreen)
		{  
			document.webkitCancelFullScreen();  
		}
		
		this.activateControlsZoom();
		
		this.showAllPage();
		
		PAGE.selectPage(1);
		
		PAGE.loadPage(1);
	},

	selectPage: function selectPage(page)
	{	
		if(!PAGE.isLoaded(page))
			PAGE.loadPage(page);
			
		if(page < PDFView.pages.length)
			PAGE.loadPage(page+1);
		
		this.hideAllPage();
		this.showPage(page);
		
		this.disableControlsZoom();
	},
	
	hideAllPage: function hideAllPage()
	{
		for(var i = 1; i <= PDFView.pages.length; ++i)
		{		
			document.getElementById('pageContainer' + i).style.display = 'none';
		}
	},
	
	showAllPage: function showAllPage()
	{
		for(var i = 1; i <= PDFView.pages.length; ++i)
		{		
			document.getElementById('pageContainer' + i).style.display = 'block';
		}
	},
	
	showPage: function showPage(page)
	{	
		document.getElementById('pageContainer' + page).style.display = 'block';
	},
	
	disableControlsZoom: function disableControlsZoom()
	{
		document.getElementById('zoomIn').disabled = true;
		document.getElementById('zoomOut').disabled = true;
		document.getElementById('scaleSelect').disabled = true;
	},
	
	activateControlsZoom: function activateControlsZoom()
	{
		document.getElementById('zoomIn').disabled = false;
		document.getElementById('zoomOut').disabled = false;
		document.getElementById('scaleSelect').disabled = false;
	}
};

document.addEventListener("fullscreenchange", function ()
{
	if(!document.fullScreen)
	{
		FULLSCREEN.exit();
	}
}, false);

document.addEventListener("mozfullscreenchange", function ()
{
	if(!document.mozFullScreen)
	{
		FULLSCREEN.exit();
	}
}, false);

document.addEventListener("webkitfullscreenchange", function ()
{
	if(!document.webkitIsFullScreen)
	{
		FULLSCREEN.exit();
	}
}, false);


