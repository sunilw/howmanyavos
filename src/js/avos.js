/* main for howmanyavos */

jQuery(document).ready(function() {

    //   make our datalist
    window.electorateList = [] ;
     
    $(window.houseData).each(function() {
        var electorate = this.Electorate ;
        str = electorate  ;
        window.electorateList.push(str) ;
    }) ;

        /**
     * Add the datalist
     */
    var electorateSelector = document.getElementById("electorateSelector");
    var awesome =  new Awesomplete(  input  );

    awesome.list = electorateList ;

    function showStory() {

	electorateSelector.on("focus", function() {
	    console.log("haz focus");
	} ) ;	
    }

    
    
});
