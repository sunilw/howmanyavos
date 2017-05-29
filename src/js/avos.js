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
	price = parseFloat(price.replace( /,/g,'.' )) ;
	valueHousePrice = price ;
	

	valueAvocado = parseFloat(valueAvocado.replace( /,/g,'.' )) ;
	
        valueElectorate = document.getElementById("electorateSelector") ;
        valueElectorate = document.getElementById("avoPrice") ;

	/*
	 * About to run calculations. Inspect figures
	 */

	console.log("About to run numbers...");
	console.log("Avo price: ");
	console.log(price);
	
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

    /**
     * Validation
     */
    function avoInputValidation() {
        if ($("#electorateSelector").val() == '')  {
            console.log("no electorate provided");
            $(".error-electorateSelector").show() ;
            $(".error-electorateSelector").css("display", "inline") ;
            return 1 ;
        } else {
            console.log("electorate provided. we are fine to continue");
        }

        if ($("#avoPrice").val() ==''  ) {
            console.log("no avocado price provided");
            $(".error-avoprice").show() ;
            $(".error-avoprice").css("display", "inline") ;
            return 1 ;
        } else {
            console.log("Avocado price provided. continue as normal");
            return 0 ;
        }

    }

    /*
     * After input validation errors show, we want to hide them when user clicks on input
     */
    $("#electorateSelector,  #avoPrice").on("click", function() {
        $("span.error").fadeOut('fast') ;
    }) ;
    

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
        if ( avoInputValidation()  == 0) {
            getValues() ;
            updateStoryDetails() ;
            showStory() ;
        } else {
            console.log("failed validation");
        }

    });

});
