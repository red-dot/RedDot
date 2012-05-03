var PAGE = {

	tabThumbnail: new Array,
	
	historyDraw: new Array,
	
	selectPage: function selectPage(numPage)
	{	
		if(token != null)
		{
			REDDOT.stopRedDot(PDFView.page);		
			DRAW.stopDraw(PDFView.page);
			
			this.updateCurPageIndicator(numPage);
			this.updateCurPageThumbnail();
			
			PDFView.page = numPage;

			socket.emit('show', { page: PDFView.page, key:key, token: token});
		}
		else
		{
			PDFView.page = numPage;
		}
		
		if(document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen)
		{
			FULLSCREEN.selectPage(PDFView.page);
		}
	},
	
	updateCurPageIndicator: function updateCurPageIndicator(numPage)
	{
		document.getElementById('chefNumPage').textContent = numPage;
	},
	
	updateCurPageThumbnail: function updateCurPageThumbnail()
	{
		var display = 'block';
		
		if(document.getElementById('thumbnailPageIndicator') != null)
		{
			display = document.getElementById('thumbnailPageIndicator').style.display;
			document.getElementById('thumbnailPageIndicator').parentNode.removeChild(document.getElementById('thumbnailPageIndicator'));
		}
		
		var page = Number(document.getElementById('chefNumPage').textContent);
		
		if(this.tabThumbnail[page] != null)
		{
			document.getElementById('chefPage').appendChild(this.tabThumbnail[page]);
			document.getElementById('chefPage').style.width = this.tabThumbnail[page].width;
			this.tabThumbnail[page].style.display = display;
		}
	},
	
	createThumbnail: function createThumbnail(numPage)
	{	
		document.getElementById('page' + numPage).cloneNode(true);
		
		var thumbnail = document.getElementById('page' + numPage).cloneNode(true);
		thumbnail.getContext("2d").drawImage(document.getElementById('page' + numPage),0,0);
		
		thumbnail.id = 'thumbnailPageIndicator';
			
		var temp = document.createElement('canvas');
		temp.width = thumbnail.width;
		temp.height = thumbnail.height;
			
		temp.getContext('2d').drawImage(thumbnail, 0, 0);
		
		var heightThumbnail = 200;
		
		thumbnail.width = thumbnail.width * heightThumbnail / thumbnail.height;
		thumbnail.height = heightThumbnail;

		thumbnail.getContext('2d').drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, thumbnail.width, thumbnail.height);
		
		if(token == null)
		{
			thumbnail.style.cursor = 'pointer';
		
			thumbnail.addEventListener('click', function(event)
			{
				PAGE.selectPage(Number(document.getElementById('chefNumPage').textContent));
			}, true);
		}
		
		this.tabThumbnail[numPage] = thumbnail;
	},
	
	toggleCurPageIndicator: function toggleCurPageIndicator()
	{
		if(document.getElementById('thumbnailPageIndicator').style.display == "none")
		{
			$('#thumbnailPageIndicator').fadeIn('slow');
			document.getElementById('toggleChefPage').src = './images/minus.gif';
		}
		else
		{
			$('#thumbnailPageIndicator').fadeOut('slow');
			document.getElementById('toggleChefPage').src = './images/plus.gif';
		}
	},
	
	loadPage: function loadPage(page)
	{
		var pageToDraw;

		var pageObj = PDFView.pages[page-1];
		pageToDraw |= pageObj.drawingRequired();
		renderingQueue.enqueueDraw(pageObj);
	},
	
	isLoaded: function isLoaded(page)
	{
		var isloaded = false;
		
		if(document.getElementById('pageContainer' + page).getAttribute('data-loaded') != null)
			isloaded = true;
			
		return isloaded;
	}
};

window.addEventListener('pageloaded', function(evt)
{	
	
	if (token != null)
	{
		socket.emit("chefLoadDraw", {page: evt.pageLoaded});
	}
	
	PAGE.createThumbnail(evt.pageLoaded);
	
	if(evt.pageLoaded == PDFView.page)
	{
		PAGE.updateCurPageThumbnail();
	}
	
	if (PAGE.historyDraw[evt.pageLoaded][0] != null)
	{
		
		for (var i = 0; i < PAGE.historyDraw[evt.pageLoaded].length; i++)
		{
			if (PAGE.historyDraw[evt.pageLoaded][i] == "STOP")
			{
				DRAW.ctxRecvPoint = null;
			}
			else {
				var coor = PAGE.historyDraw[evt.pageLoaded][i].split(" ");
				
				DRAW.point(evt.pageLoaded, coor[0], coor[1]);
			}
		}
		//PAGE.historyDraw[evt.pageLoaded] = new Array;
	
	}
	
}, false);
