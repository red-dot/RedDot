var DRAW = {
	
	copyCanvas: new Array,
	
	kCssUnits: kCssUnits = 96.0 / 72.0,
	kScrollbarPadding: kScrollbarPadding = 40,	
	
	showTools: function showTools()
	{
		$("#toolsHidden").toggle("slow");
	},
    
	activateDraw : function activateDraw()
	{	
	    var text = document.getElementById('draw').textContent;
	    text = text.trim();
	    
		if(text == 'Draw on current page')
		{
			REDDOT.stopRedDot(PDFView.page);
			
			this.disableControls();
			
			var canvas = document.getElementById("page" + PDFView.page);
			var ctx = canvas.getContext("2d");

			canvas.style.cursor = 'crosshair';
		
			if(this.copyCanvas[PDFView.page-1] == null)
			{
				this.copyCanvas[PDFView.page-1] = canvas.cloneNode(true);
				this.copyCanvas[PDFView.page-1].getContext("2d").drawImage(canvas,0,0);
			}
			
			document.getElementById('draw').innerHTML = document.getElementById('draw').innerHTML.replace("Draw on current page", " Stop drawing");
			
			ctx.strokeStyle = "rgba(255,35,35,0.5)";
			ctx.lineWidth = "3";
			ctx.beginPath();

			var x;
			var y;
			
			var select = document.getElementById('scaleSelect');
			var currentPage = document.getElementById('pageContainer' +  PDFView.page);
			var zoom;		

			var currentPage = PDFView.pages[PDFView.page-1];
			
			var pageWidthScale = (window.innerWidth - this.kScrollbarPadding) /
							  parseFloat(currentPage.width) / this.kCssUnits;
			var pageHeightScale = (window.innerHeight - this.kScrollbarPadding) /
							   parseFloat(currentPage.height) / this.kCssUnits;
			
			if(select.value == "custom")
			{
				var custom = document.getElementById('customScaleOption');
				zoom = parseFloat(custom.textContent);
				zoom = zoom/100;
			}
			else if (select.value == "page-width")
				zoom = pageWidthScale;  
			else if (select.value == "page-height")
				zoom = pageHeightScale;
			else if (select.value == "page-fit")
				zoom = Math.min(pageWidthScale, pageHeightScale);
			else if (select.value == "auto")
				zoom = Math.min(1.0, pageWidthScale);
			else
				zoom = select.value;

			canvas.onmousedown = function(e)
			{			
				x = e.layerX;
				y = e.layerY;
				ctx.moveTo(x, y);
				
				socket.emit('drawFirstPoint', {page: PDFView.page, x: x/zoom, y: y/zoom, key: key, token:token});
			}

			canvas.onmouseup = function(e)
			{
				x = null;
				y = null;
				
				PAGE.createThumbnail(PDFView.page);
				PAGE.updateCurPageThumbnail();
				
				socket.emit('stopdraw', {key: key, token: token, page: PDFView.page});
			}

			canvas.onmousemove = function(e)
			{			
				if (x == null || y == null)
				{
					return;
				}
							
				x = e.layerX;
				y = e.layerY;
				
				x -= canvas.offsetLeft;
				y -= canvas.offsetTop;
				
				ctx.lineTo(x, y);
				
				ctx.stroke();
				
				ctx.moveTo(x, y);
				
				socket.emit('draw', {page: PDFView.page, x: x/zoom, y: y/zoom, key: key, token:token});
			}
		}
		else
		{
			this.stopDraw(PDFView.page);
		}
	},
	
	stopDraw: function stopDraw(numPage)
	{
		this.enableControls();
                
        document.getElementById('draw').innerHTML = document.getElementById('draw').innerHTML.replace("Stop drawing","Draw on current page");
             
		var canvas = document.getElementById('page' + numPage);
		
		if(canvas != null)
		{
			canvas.style.cursor = '';
			
			canvas.onmousedown = function(e) {}
			canvas.onmouseup = function(e) {}
			canvas.onmousemove = function(e) {}
		}
		
		if(this.copyCanvas[numPage-1] != null)
			socket.emit('stopdraw', {key: key, token: token, page: PDFView.page});
	},

	eraseDraw: function eraseDraw(page)
	{
		this.stopDraw(page);
		
		if(this.copyCanvas[page-1] != null)
		{
			var pageContainer = document.getElementById('pageContainer' + page);
			var pageCanvas = document.getElementById('page' + page);
			
			this.copyCanvas[page-1].style.cursor = '';

			pageContainer.insertBefore(this.copyCanvas[page-1], pageCanvas);
			pageContainer.removeChild(pageCanvas);
				
			this.copyCanvas[page-1] = null;	
			
			if(token != null)
			{
				socket.emit('erase', {page: page, key: key, token: token});
			}
			
			PAGE.createThumbnail(page);
			PAGE.updateCurPageThumbnail();
		}
		
	},
	
	ctxRecvPoint: null,

	point: function point(page, x, y)
	{
		var select = document.getElementById('scaleSelect');
		var currentPage = document.getElementById('page' +  PDFView.page);
		var zoom;	
		var pages = PDFView.pages;
		var currentPage = pages[PDFView.page-1];	
		var pageWidthScale = (window.innerWidth - this.kScrollbarPadding) / currentPage.width / this.kCssUnits;
		var pageHeightScale = (window.innerHeight - this.kScrollbarPadding) / currentPage.height / this.kCssUnits;
		
		
		if (select.value == "custom")
		{
			var custom = document.getElementById('customScaleOption');
			zoom = parseFloat(custom.textContent);
			zoom = zoom/100;
		}
		else if (select.value == "page-width")
			zoom = pageWidthScale;  
		else if (select.value == "page-height")
			zoom = pageHeightScale;
		else if (select.value == "page-fit")
			zoom = Math.min(pageWidthScale, pageHeightScale);		
		else if (select.value == "auto")
			zoom = Math.min(1.0, pageWidthScale);
		else
			zoom = select.value;	
				
		x = x*zoom;
		y = y*zoom;

		if(this.copyCanvas[page-1] == null)
		{
			this.copyCanvas[page-1] = document.getElementById("page" + page).cloneNode(true);
			this.copyCanvas[page-1].getContext("2d").drawImage(document.getElementById("page" + page),0,0);
		}
		
		if(this.ctxRecvPoint == null)
		{		
			this.ctxRecvPoint = document.getElementById("page" + page).getContext("2d");
			this.ctxRecvPoint.strokeStyle = "rgba(255,35,35,0.5)";
			this.ctxRecvPoint.lineWidth = "3";
			this.ctxRecvPoint.beginPath();
		}	
		
		this.ctxRecvPoint.lineTo(x, y);	
		this.ctxRecvPoint.stroke();
		this.ctxRecvPoint.moveTo(x, y);
	},
	
	disableControls: function disableControls()
	{
		document.getElementById('zoomIn').disabled = true;
		document.getElementById('zoomOut').disabled = true;
		document.getElementById('scaleSelect').disabled = true;
		document.getElementById('fullscreen').disabled = true;
	},
	
	enableControls: function enableControls()
	{
		if(!document.fullScreen && !document.mozFullScreen && !document.webkitIsFullScreen)
		{
			document.getElementById('zoomIn').disabled = false;
			document.getElementById('zoomOut').disabled = false;
			document.getElementById('scaleSelect').disabled = false;
		}
		
		document.getElementById('fullscreen').disabled = false;
	}
};







