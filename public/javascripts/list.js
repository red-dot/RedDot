function presentation(file)
{
  document.location = file;
}

function Delete(doc)
{
  var result = confirm("Are you sure ?");
  if(result == true)
  {
    doc.submit();
  }
}

function Edit(title, doc)
{
  var Title = prompt('Edit title', title);
  if(Title !=null && Title!="")
  {
    doc.EditTitle.value = Title;
    doc.submit();
  }
  else
  {
    alert("Please put a title.");
  }
}
