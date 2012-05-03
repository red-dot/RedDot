var REDDOT = {
		
	stopRedDot: function stopRedDot(page)
	{
		var text = document.getElementById('redDot').textContent;
		text = text.trim();
					
		if(text != 'Red Dot')
		{	
			this.enableControls();
				
			var canvas = document.getElementById("page" + page);
			document.getElementById('redDot').innerHTML = document.getElementById('redDot').innerHTML.replace(" Stop Red Dot", " Red Dot");			
			canvas.style.cursor = '';
			canvas.onmousemove = function(event){};
			
			socket.emit('stopRedDot', {page: page, key: key, token:token});
		}
	},
	
	redDot: function redDot() 
	{
		var text = document.getElementById('redDot').textContent;
	    text = text.trim();
	    
		if(text == 'Red Dot')
		{
			DRAW.stopDraw();
			this.disableControls();
			
			var canvas = document.getElementById("page" + PDFView.page);
	    
			var posX;
			var posY;
			
			document.getElementById('redDot').innerHTML = document.getElementById('redDot').innerHTML.replace(" Red Dot", " Stop Red Dot");	
				
			canvas.style.cursor = "url(./images/pointRouge.png), auto";
			
			canvas.onmousemove = function(event)
			{
				var canvas = document.getElementById("page" + PDFView.page);
				
				posX = event.layerX;
				posY = event.layerY;				
				posX -= canvas.offsetLeft;
				posY -= canvas.offsetTop;
				
				var width = canvas.width;
				posX = ((posX*100)/width);
				
				var height = canvas.height;
				posY = ((posY*100)/height);
				
				socket.emit('redDot', {page: PDFView.page, x: posX, y: posY, key: key, token:token});	
			};

		}
		else
		{
			REDDOT.stopRedDot(PDFView.page);			
		}
	},
	
	pointRouge: function pointRouge(page, x, y)
	{
		if(document.getElementById("theRedDot") == null)
		{
			this.disableControls();
			
			var theRedDot = document.createElement('div');

			theRedDot.id = 'theRedDot';
			
			var pageContainer = document.getElementById("pageContainer" + page);	
			pageContainer.insertBefore(theRedDot, pageContainer.firstChild);	
		}
	
		
		var theRedDot =  document.getElementById("theRedDot");
		var pageContainer = document.getElementById("pageContainer" + page);	
		
		var decalLeft = (99*100)/parseFloat(pageContainer.style.width);
		var decalTop = (11*100)/parseFloat(pageContainer.style.height);
		theRedDot.style.left = (x-decalLeft)  + '%';
		theRedDot.style.top = (y+decalTop) + '%';
	},
	
	stopPointRouge: function stopPointRouge()
	{
		var theRedDot = document.getElementById('theRedDot');
		
		if(theRedDot != null)
			theRedDot.parentNode.removeChild(theRedDot);
			
		this.enableControls();
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
