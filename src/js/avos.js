/* main for howmanyavos */

jQuery(document).ready(function() {

    //   make our datalist
    window.electorateList = Object.keys(window.houseData) ;

    $(window.houseData).each(function() {
        var electorate = this.Electorate ;
        str = electorate  ;
        // window.electorateList.push(str) ;
    }) ;

    /**
     * Add the datalist
     */
    
    var electorateSelector = document.getElementById("electorateSelector");
    var awesome =  new Awesomplete(  electorateSelector  );

    awesome.list = electorateList ;
    
    function showStory() {
        console.log("got to showstory");	
    } ;

    $("button.calculate").on("click", function(){
	showStory() ;
    });
    
});
