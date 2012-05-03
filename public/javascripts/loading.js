function afficher_cacher(bool)
{
    if(bool == true)
    {
        document.getElementById('loading').style.display = "block";
        document.getElementById('upload').style.display = "none";
        document.getElementById('finish').style.display = "none";
    }
    else
    {
        if(document.getElementById('file').innerHTML == "")
        {
            document.getElementById('upload').style.display = "none";
            document.getElementById('finish').style.display = "none";
        }
        else
        {
            document.getElementById('upload').style.display = "block";
            document.getElementById('finish').style.display = "block";
            document.getElementById('loading').style.display = "none";
        }
        
        
    }
    return true;
}

function verifIdHidden()
{
    if(document.getElementById('file').innerHTML == "" || document.getElementById('file').innerHTML == "error")
    {
        document.getElementById('upload').style.display = "none";
        document.getElementById('finish').style.display = "none";
    }
    else
    {
        document.getElementById('loading').style.display = "none";
        document.getElementById('upload').style.display = "block";
        document.getElementById('finish').style.display = "block";
    }
    return true;
}

function eraseFile()
{
    if(document.getElementById('file').innerHTML != "")
    {
        document.getElementById('file').innerHTML = "";
        document.getElementById('upload').style.display = "none";
        document.getElementById('finish').style.display = "none";
        document.getElementById('loading').style.display = "none";
    }
}

function testExtension(file)
{
    var extension = file.elements[1].value.split(".");
    
    if(extension[extension.length -1] != "pdf")
    {
        file.elements[1].value = "";
        alert("Only PDF accepted.");
        return false
    }
    else
    {
        file.submit();
        return true;
    }
}

function verifPDF(file)
{
  if(file == 'error')
  {
    alert('Only PDF accepted');
  }
}

function storeUpload(file, key)
{
  document.location = file;
}
