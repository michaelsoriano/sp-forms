var SpForms = function(formId) {
    
    
      /************PRIVATE***************/
    var $form = $(formId);
    var formIdNoHash = formId.replace("#","");
    var listName = $form.attr('data-list-name');
    var selectorString = '[data-list-name="'+listName+'"]';    
    var allFieldsString = selectorString + ' input, '+selectorString+' select, '+selectorString+' textarea';

    function resetErrors(){
        $(selectorString + " *").removeClass('hasError');
        $(selectorString + ' .error').remove();
    }	
      
    function showError(str){
        removeLoading();
        var html = '';
        html += '<div class="error-msg">';
        html += str + '</div>';
        $(selectorString + ' .error-msg').remove();
        $form.prepend(html);
    }
      
    function parseAjaxError(data){    
        if(typeof data !== 'undefined'){
            var obj = $.parseJSON(data.responseText);
            return obj.error.message.value;
        }else{
            return 'an unknown error occurred';
        }           
    }

    function showSuccess(){
        removeLoading();
        $(allFieldsString).attr('disabled','disabled');
        $(formId + ' .btn-submit').remove();
        $(formId + ' .success-message').show();
    }

    function getFileBuffer(file) { //for file upload
        
        var deferred = $.Deferred();
        var reader = new FileReader();
    
        reader.onload = function(e) {
            deferred.resolve(e.target.result);
        }
    
        reader.onerror = function(e) {
            deferred.reject(e.target.error);
        }
    
        reader.readAsArrayBuffer(file);
    
        return deferred.promise();
    }
      
    function showLoading (){
        $form.addClass('loading');
        $(selectorString + ' *').css({'opacity':'.4'});
    }
      
    function removeLoading(){
        $form.removeClass('loading');
        $(selectorString + ' *').css({'opacity':'1'});
    }

    function insertData (itemObj, listType, listName){        
        if(itemObj === null){
            var item = {
            "__metadata": { "type": listType }      
            }
            var itemData = {};
            var tempCheckBoxes = Array();
            $(allFieldsString).each(function(i,item){  
                    if($(this).attr('type') == 'radio'){                         
                    if($(this).is(":checked")){
                        itemData[$(this).attr('name')] = $(this).val();
                    }
                    }else if($(this).attr('type') == 'checkbox'){
                        var ckbox = $(this).attr('name'); 
                        if($.inArray(ckbox,tempCheckBoxes)=== -1){
                            tempCheckBoxes.push(ckbox);
                        }
                    }else if($(this).attr('type') == 'file'){
                        //removing file uploads
                    }else{
                        itemData[$(this).attr('name')] =  $(this).val();
                    } 
            }); //END MAIN LOOP
            tempCheckBoxesObj = {};
            for(var i=0; i < tempCheckBoxes.length; i++){
                var temp = '';
                $('[name="'+tempCheckBoxes[i]+'"]:checked').each(function(x){
                    temp += $(this).val() + ";"; 
                })
                tempCheckBoxesObj[tempCheckBoxes[i]] = temp;
            }
        
            itemData = $.extend(tempCheckBoxesObj,itemData);
            itemObj = $.extend(item,itemData);
        }

        console.log(itemObj);

        var endpoint = "/_api/web/lists/getbytitle('" + listName + "')/items";
        var ajax = $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + endpoint,
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(itemObj),
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },
            error: function (data) {          
                console.log(parseAjaxError(data));
            }
        });
    
        return ajax;
    }
  
    function validate() {      
          resetErrors();        
          var phonePattern = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
          var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          var urlPattern = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;        
          var valid = false;
          var errors = {};                
          $(allFieldsString).each(function(index) {
                  var item = $(this);
                  var rules = item.data('rules');
                  if (typeof rules !== 'undefined') {
                      var rulesArr = rules.split('|');
                      errors[item.attr("name")] = Array();
                      $.each(rulesArr, function(x, xitem) {
                          switch (xitem) {
                              case 'required':  
                                  if (item.is(":radio") || item.is(":checkbox")) {
                                      if ($(selectorString +' input[name="' + item.attr('name') + '"]:checked').length <= 0) {
                                          errors[item.attr("name")].push("Please choose one");
                                      }
                                  } else {
                                      if (item.val() === '') {
                                          errors[item.attr("name")].push("This cannot be empty");
                                      }
                                  }
                                  break;
                              case 'phone':
                                  if (item.val() !== '') {
                                      if (item.val().match(phonePattern) === null) {
                                          errors[item.attr("name")].push("Not a valid Phone");
                                      }
                                  }
                                  break;
                              case 'email':
                                  if (item.val() !== '') {
                                      if (emailPattern.test(item.val()) === false) {
                                          errors[item.attr("name")].push("Not a valid Email");
                                      }
                                  }
                                  break;  
                              case 'url':
                                  if (item.val() !== '') {
                                      if (urlPattern.test(item.val()) === false) {
                                          errors[item.attr("name")].push("Not a valid URL");
                                      }
                                  }
                                  break;  
                              case 'date':
                                  if (item.val() !== '') {                                    
                                      var timestamp = Date.parse(item.val());
                                      if(isNaN(timestamp) == true){
                                        errors[item.attr("name")].push("Not a valid Date");
                                      }
                                  }
                                  break;
                          }
  
                      }) //end each rules
                      // console.log(item.attr("name") + " has error:");
                      // console.log(errors[item.attr("name")].length);
                      if (errors[item.attr("name")].length === 0) {
                          delete errors[item.attr("name")];
                      }
                  }
              }); //end each input  
  
          //display errors and return valid true / false;
  
          if (Object.keys(errors).length > 0) {
              for (prop in errors) {
                  var msg = String(errors[prop]);
                  $(selectorString + ' [name="' + prop + '"]')
                      .addClass('hasError')
                      .after('<div class="error">' + msg.replace(',', ', ') + '</div>');
              }
              $('.hasError:first').focus();
          } else {
              valid = true;
          }
          return valid;
      } //end validate();
  
    function getListType(){
        var endpoint = "/_api/web/lists/getbytitle('" + listName + "')?$select=ListItemEntityTypeFullName";
        var ajax = $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + endpoint,
            type: "GET",
            contentType: "application/json;odata=verbose", 
            headers: {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },      
            error: function (data) {    
                showError(parseAjaxError(data));
            }
        });
        return ajax;
    } //end getListType()    

    function getRecordById (id){
		var endpoint = "/_api/web/lists/getbytitle('" + listName + "')/Items?";
		endpoint = _spPageContextInfo.webAbsoluteUrl + endpoint;     
		endpoint += "&$filter=(ID eq '" + id + "')";
        endpoint += "&$expand=AttachmentFiles";
		var ajax = $.ajax({
			url: endpoint,
			method: "GET",
			headers: { "Accept": "application/json; odata=verbose" }
		});
		return ajax;
    }

    function updateQueryStringParameter(uri, key, value) {
        var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
          return uri.replace(re, '$1' + key + "=" + value + '$2');
        }
        else {
          return uri + separator + key + "=" + value;
        }
    }

    function updateUrl(id){
        var url = window.location.href + "?" + formIdNoHash + "=" + id; 
        history.pushState({}, "Page", url);
    }
    
    function showRecord(itemFound){        
        $('.btn-submit').remove();
        $(allFieldsString).each(function(i,item){ 
            $(this).attr('disabled','disabled');            
            var n = $(this).attr('name');
            var x = $(this).attr('type');  
            if(itemFound[0][n]){  
                if(x =="radio"){
                    if($(this).attr('value') == itemFound[0][n]){
                        $(this).prop('checked',true);
                    }
                }else if(x == "checkbox"){                    
                    if(itemFound[0][n]){
                        var xArray = itemFound[0][n].split(";"); 
                        $.each(xArray,function(xi,xitem){
                            if($(item).val() == xArray[xi]){
                                $(item).prop("checked",true);
                            }
                        })
                    }
                }else if(x == 'file'){
                    
                }else{
                    $(this).val(stripHtml(itemFound[0][n]));
                }
            }
        }); //END MAIN LOOP
    }
    function stripHtml (html){
        var tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    function uploadFile (file,listName,theId){
        
        var deferred = $.Deferred();
        
        getFileBuffer(file).then(function(buffer) {
    
            var url = _spPageContextInfo.webAbsoluteUrl;
            url += "/_api/web/lists/getbytitle('" + listName + "')/items(" + theId; 
            url += ")/AttachmentFiles/add(FileName='" + file.name + "')";
    
            var header = {
                "Accept": "application/json; odata=verbose",
                "content-type": "application/json; odata=verbose",
                "X-RequestDigest": document.getElementById("__REQUESTDIGEST").value,
                // "content-length": buffer.byteLength
            };
    
             $.ajax({
                url:url,
                method: 'POST',
                data: buffer,
                processData: false,
                headers: header,
                success : function(data){          
                    deferred.resolve();
                }, 
                error : function(data){
                    console.log('error uploading file');
                    console.log(data);
                }
            });
            
        }); //END getFileBuffer
     
      return deferred;
    
    } //END uploadFile
  
    function urlParam (name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null){
           return null;
        }
        else{
           return decodeURI(results[1]) || 0;
        }
    }

    /************END PRIVATE***************/      
      
    /**********PUBLIC METHODS**************/

    function run() {

        if(urlParam(formIdNoHash)){
            var recordId = urlParam(formIdNoHash);
            getRecordById(recordId).done(function(item){
                if(item.d.results.length > 0){
                    showRecord(item.d.results);
                }else{
                    showError("No record has been found");
                }
            }).fail(function(err){          
                showError(parseAjaxError(err));
            });
            
            return false;        //exit out if record is found 
        }       

        //adds href to add another button in success
        var locNoParams = location.protocol + '//' + location.host + location.pathname; 
        $(formId + ' #addAnother').attr('href', locNoParams);

        //bind submit button
        var btn = $form.find('.btn-submit');
        btn.on('click', function() {           
            if(validate() === true){            
                showLoading();
                getListType(listName).done(function(data1){                      
                    var listType = data1.d.ListItemEntityTypeFullName;
                    var ajax = insertData(null,listType, listName); 
                    ajax.done(function(success){  
                        if($(selectorString + ' [name="attachment"]').length > 0){
                        if($(selectorString + ' [name="attachment"]')[0].files[0] 
                            && success.d.ID){ //IF THERE IS A FILE && HAS ID
                            var file =  $(selectorString + ' [name="attachment"]')[0].files[0];
                            var ajaxFromFileUPload = uploadFile(file,listName,success.d.ID)                        
                            ajaxFromFileUPload.done(function(){     
                                updateUrl(success.d.ID);                      
                                showSuccess();
                            })
                            ajaxFromFileUPload.fail(function(err){
                                showError(parseAjaxError(err));
                            })
                            return;
                        }
                        }                        
                        setTimeout(function(){
                            updateUrl(success.d.ID);
                            showSuccess();
                        },1000);
                    });   
                    ajax.fail(function(err){          
                        showError(parseAjaxError(err));
                    });
                });  //end getListType();
            }    
            return false;
        }); //end submit form
    }
    /**********END PUBLIC METHODS**************/
      
    return {
        run: run         
    }
  }
