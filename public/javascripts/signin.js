function displayForm()
{
  $(".login-form").toggle("slow");
}

function createAccount()
{
  document.getElementById('account-form').innerHTML="<input id=\"login-pseudo\" class=\"element-form\" type=\"text\" tabindex=\"1\" name=\"accountPseudo\" value=\"Login\" onfocus=\"inputFocus('Login', 'login-pseudo')\" onblur=\"inputBlur('Login', 'login-pseudo')\">\n<input id=\"login-name\" class=\"element-form\" type=\"text\" tabindex=\"1\" name=\"accountName\" value=\"Name\" onfocus=\"inputFocus('Name', 'login-name')\" onblur=\"inputBlur('Name', 'login-name')\">\n<input id=\"login-firstname\" class=\"element-form\" type=\"text\" tabindex=\"2\" name=\"accountFirstname\" value=\"First name\" onfocus=\"inputFocus('First name', 'login-firstname')\" onblur=\"inputBlur('First name', 'login-firstname')\">\n<input id=\"login-email\" class=\"element-form\" type=\"text\" tabindex=\"3\" name=\"accountEmail\" value=\"Email\" onfocus=\"inputFocus('Email', 'login-email')\" onblur=\"inputBlur('Email', 'login-email')\">\n<input id=\"login-password\" class=\"element-form\" type=\"password\" tabindex=\"4\" name=\"accountPassword\" value=\"Password\" onfocus=\"inputFocus('Password', 'login-password')\" onblur=\"inputBlur('Password', 'login-password')\">\n<a id=\"login-submit\" class=\"button-form\" tabindex=\"5\" class=\"button\" onclick=\"validateAccount()\">Validate</a>";
}

function inputFocus(text, id)
{
  if(text == document.getElementById(id).value)
    document.getElementById(id).value = "";
}

function inputBlur(text, id)
{
  if(document.getElementById(id).value == "")
    document.getElementById(id).value = text;
}

function validateAccount()
{
  for(i =0; i < document.forms[0].elements.length; i++)
  {
    if(document.forms[0].elements[i].value == "")
      document.forms[0].elements[i].id = "miss";
  }
  
  if(document.forms[0].elements[0].value == "Login")
    document.forms[0].elements[0].id = "miss";
  else
    document.forms[0].elements[0].id = "login-pseudo";
    
  if(document.forms[0].elements[1].value == "Name")
    document.forms[0].elements[1].id = "miss";
  else
    document.forms[0].elements[1].id = "login-name";  
    
  if(document.forms[0].elements[2].value == "First name")
    document.forms[0].elements[2].id = "miss";
  else
    document.forms[0].elements[2].id = "login-firstname";
    
  if(document.forms[0].elements[3].value == "Email")
    document.forms[0].elements[3].id = "miss";
  else if(!document.forms[0].elements[3].value.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/))
    document.forms[0].elements[3].id = "miss";
  else
    document.forms[0].elements[3].id = "login-email";
    
  if(document.forms[0].elements[4].value == "Password")
    document.forms[0].elements[4].id = "miss";
  else
    document.forms[0].elements[4].id = "login-password";
    
  var bool = true;
  for(i =0; i < document.forms[0].elements.length; i++)
  {
    if(document.forms[0].elements[i].id == "miss")
    {
      bool = false;
      break;
    }
  }
  
  if(bool)
    document.forms[0].submit();
}

function login()
{
  document.forms[0].submit();
}

function verifLogin()
{
  //alert(document.getElementById("login-hidden").getAttribute("value"));
  if(document.getElementById("login-hidden").getAttribute("value") == "" || document.getElementById("login-hidden").getAttribute("value") == "@@status@@"
    || storage.getItem('pseudo') == null || storage.getItem('pseudo') == undefined)
  {
    //delete localStorage['isConnected'];
    document.getElementById("login-hidden").style.display = "none";
  } 
  else if(document.getElementById("login-hidden").getAttribute("value") == "Invalid login or password")
  {
    document.getElementById("login-hidden").style.display = "block"; 
    $(".login-form").show();     
    document.forms[0].elements[1].value = localStorage['pseudo'];   
    document.forms[0].elements[1].id = "miss";   
    document.forms[0].elements[2].id = "miss";
  }
  else if(document.getElementById("login-hidden").getAttribute("value") == "Login already used")
  {
    document.getElementById("login-hidden").style.display = "block";
    $(".login-form").show();
  }
  else if(document.getElementById("login-hidden").getAttribute("value") == "Successful registration")
  {
    document.getElementById("login-hidden").style.display = "block";
    $(".login-form").show();
    document.getElementById("login-hidden").style.color = "#24AA22";
  }
  else
  {
    document.getElementById('account-form').innerHTML="<input id=\"login-hidden\" name=\"status\" value=\"Welcome " + storage.getItem('pseudo') + "\"><a id=\"pdfs\" class=\"button-form\" tabindex=\"1\" class=\"button\" onclick=\"askServer()\">My PDFs</a><a id=\"logout\" class=\"button-form\" tabindex=\"2\" class=\"button\" onclick=\"logout()\">Logout</a>";
    document.getElementById("login-hidden").style.color = "#000000";
    document.getElementById("login-hidden").style.display = "block";
    document.getElementById("login-link").style.display = "none";
    storage.setItem('isConnected', 'true');
  }
  
  if(document.getElementsByClassName('login-form')[0].style.visibility == "hidden" && document.getElementById("login-hidden").getAttribute("value") != "@@status@@")
    document.getElementsByClassName('login-form')[0].style.display = "block";
  
  if(document.getElementById("login-hidden").getAttribute("value") == "@@status@@")
    document.getElementById("login-hidden").style.display = "none"; 
}

function isConnected()
{
  if(storage.getItem('isConnected') == 'true')
  {
    document.getElementById('account-form').innerHTML="<input id=\"login-hidden\" name=\"status\" value=\"Welcome " + storage.getItem('pseudo') + "\"><a id=\"pdfs\" class=\"button-form\" tabindex=\"1\" class=\"button\" onclick=\"askServer()\">My PDFs</a><a id=\"logout\" class=\"button-form\" tabindex=\"2\" class=\"button\" onclick=\"logout()\">Logout</a>";
    document.getElementById("login-hidden").style.color = "#000000";
    document.getElementById("login-hidden").style.display = "block";
    document.getElementById("login-link").style.display = "none";
    document.getElementsByClassName('login-form')[0].style.display = "block";
  }
  
}

function logout()
{
  storage.removeItem('pseudo');
  storage.removeItem('isConnected');
  location.assign(location.href);
}

function askServer()
{
	 document.forms[0].submit();
}

