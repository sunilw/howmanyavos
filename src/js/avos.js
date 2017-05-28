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

    /*
     * Placeholders for ultimate values
     */
    var avocadosTotal ;
    var avocadosPerMonth ;
    var avocadosPerWeek ;
    var breakfastCost = "14.99" ;

    /**
     * Get the values that we need
     */
    var valueElectorate ;
    var valueHousePrice ;
    var valueAvocado ;
    var valueLostBreakfasts ;
    /*
     *  update the values
     */
    function getValues() {
	valueAvocado = $("#avoPrice").val() ;
	electorateName =  $("#electorateSelector") .val() ;

	var price = window.houseData[electorateName]["House Price"] ;

	// clean string: remove $
	while(price.charAt(0) === '$') {
	    price = price.substr(1);
	}
	avocadosTotal = price ;
	// clean string: remove commas
	price = parseFloat(price .replace( /,/g,'' )) ;	
	valueHousePrice = price ;
	
        valueElectorate = document.getElementById("electorateSelector") ;
        valueElectorate = document.getElementById("avoPrice") ;	
	
	/*
	 * How many avos would we have to spare per year?
	 */
	avocadosTotal  =  Math.round( valueHousePrice / valueAvocado) ;

	/*
	 * How many avos would we have to spare per month?
	 */
	avocadosPerMonth = Math.round(avocadosTotal / 12) ;
	avocadosPerWeek  = Math.round(avocadosTotal / 52) ;

	/*
	 * How many breakfast would we have to sacrifice?
	 */
	var brekky = breakfastCost ;
	lostBreakfasts = Math.round(valueHousePrice / brekky) ;
    }


    function updateStoryDetails () {
	$(".avo-total-avos").text(avocadosTotal) ;
	$(".avo-months").text(avocadosPerMonth) ;
	$(".avo-week").text(avocadosPerWeek) ;
	$(".avo-breakfast-freq-week").text(lostBreakfasts) ;
    } ;

    function showStory() {
	var storyContainer = $(".story-container") ;
	if (storyContainer.hasClass("hidden")) {
	    storyContainer.fadeIn() ;
	    storyContainer.removeClass("hidden") ;
	}
	
    } ;

    $("button.calculate").on("click", function(){
        getValues() ;
	updateStoryDetails() ;
        showStory() ;
    });

});
