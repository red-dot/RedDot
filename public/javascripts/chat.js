var CHAT = {
	
	pseudo: null,

	pinChatSideBar: function pinChatSideBar()
	{
		document.getElementById('chat').classList.toggle('pinned');
	},

	send: function send(e)
	{
		if(e.keyCode == 13 && document.getElementById("textToSay").value != '')
		{
			var textToSend = this.pseudo + ": " + document.getElementById("textToSay").value;
			
			document.getElementById("textToSay").value = '';
			
			socket.emit('chat', { chat: textToSend, key: key });
		}
	},

	write: function write(toWrite)
	{
		document.getElementById("chatHistory").value += toWrite + "\n";
		document.getElementById("chatHistory").scrollTop = document.getElementById("chatHistory").scrollHeight;
	},

	validatePseudo: function validatePseudo()
	{
		var pseudo = document.getElementById("pseudo").value;
		if(pseudo != '' && pseudo.search(' ') == -1 && pseudo.length < 10)
		{
			socket.emit('changeName', {oldName: this.pseudo, newName: document.getElementById("pseudo").value, key: key});
		}
		else
		{
			alert("Pseudonyme invalide.");
		}
	},

	updateRoom: function updateRoom(room)
	{
		var pC = document.getElementById("peopleConnected");
		
		pC.innerHTML = "";
		
		for(var i = 0; i < room.length; ++i)
		{
			var newSpan = document.createElement("span");
			
			newSpan.id = room[i];
					
			newSpan.textContent = room[i];
			
			if(token != null && room[i] != this.pseudo)
			{
				newSpan.addEventListener("click", function(event)
				{
					if(window.confirm("Are you sure to nominate " + this.innerHTML + " as conference leader ?")) 
					{
						socket.emit('changeLeader', {newLeaderName: this.innerHTML, from: 'user', key: key, token: token});
						socket.emit('updateRoom', {key: key});
						socket.emit('chat', { chat: '# ' + this.innerHTML + ' is now the new conference leader #', key: key });
					}

				}, true);
			}
			
			pC.appendChild(newSpan);
			pC.appendChild(document.createElement("br"));			
		}
			
	}
};



