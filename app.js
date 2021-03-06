var dbPromise = null; 
var exchangeID = null;
var exchangeTite = '';
var toCurrencyID = '';
var fromCurrencyID = '';
var convertButton = document.getElementById("convert-button");

window.addEventListener('load', e => {

    //setup the database and datastores
    dbPromise = idb.open('ConverterDatabase', 1, upgradeDB => {
        upgradeDB.createObjectStore('CurrencyStore',{keyPath : 'id'});        
        upgradeDB.createObjectStore('ExchangeRateStore',{keyPath : 'id'});
    });   
    
    //populate currency select options
    fetchCurrencyFromDBOrWeb();

    //convert button handler
    convertButton.onclick = () => {
        const errorSelector = document.getElementById("error-div");
        const fromCurrencySelector = document.getElementById("from-selector");
        const fromCurrency = fromCurrencySelector.options[fromCurrencySelector.selectedIndex].value;

        const toCurrencySelector = document.getElementById("to-selector");
        const toCurrency = toCurrencySelector.options[toCurrencySelector.selectedIndex].value;

        //clear error 
        errorSelector.setAttribute("style", "display:none");
        
        exchangeID = `${fromCurrency}_${toCurrency}`;  
        exchangeTitle = `From ${fromCurrency} > To ${toCurrency}`;  
        toCurrencyID = toCurrency;
        fromCurrencyID = fromCurrency;
        const exchangeRateAPIEndPoint = `https://free.currencyconverterapi.com/api/v5/convert?q=${exchangeID}&compact=ultra`;
        const exchangeVal = document.getElementById("exchange-value").value;

        /**
         * Process converstion request if input is valid 
         * otherwise display error message
         */
        if((parseInt(exchangeVal) > 0) && (fromCurrency.length > 0) && (toCurrency.length > 0)){
            const storeName = "ExchangeRateStore";
            dbPromise.then(db => {
                return db.transaction(storeName, 'readwrite')
                       .objectStore(storeName)
                       .get(`${exchangeID}`);            
            }).then(result => {
                
                /** Calculate from web value data not found in database
                 *  otherwise use database value 
                 **/
                if(result == null){
                    calculateFromWebValue(exchangeRateAPIEndPoint);
                }else{
                    const exchangeValue = document.getElementById("exchange-value").value;
                    convertCurrency(result.data, exchangeValue);
                }            
            });        
        }else{
            //display error message
            errorSelector.setAttribute("style", "display:block");
        }
    }
});

function calculateFromWebValue(exchangeRateAPIEndPoint){
    //fetch exchange rate from web
    fetch(exchangeRateAPIEndPoint)
    .then(response => response.json())
    .then(data => {     
        const exchangeValue = document.getElementById("exchange-value").value;
        addExchangeRate(data);
        convertCurrency(data, exchangeValue);
    }).catch((error) => {
        calculateFromCachedExchangeRate();
    });
}

function calculateFromCachedExchangeRate(){
    const storeName = "ExchangeRateStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).get(exchangeID);
        return tx.complete;
    }).then(data => {
        const exchangeValue = document.getElementById("exchange-value").value;
        convertCurrency(data, exchangeValue);
    });
}

function convertCurrency(data, exchangeValue){

    let totalAmountConverted = 1;

    for (var prop in data) {
        exchangeRate = data[prop];
        totalAmountConverted = (exchangeValue * exchangeRate).toFixed(5);

        const convertedValueElement = document.getElementById('converted-value');
        const exchangeTitleElement = document.getElementById('exchange-title');
        const exchangeRateElement = document.getElementById('exchange-rate');

        convertedValueElement.innerHTML = `${toCurrencyID} ${totalAmountConverted}`;
        exchangeTitleElement.innerHTML = exchangeTitle;
        exchangeRateElement.innerHTML = `1${fromCurrencyID} = ${toCurrencyID} ${exchangeRate}`;
        break;
    }
}

function appendOption(elementSelector, key, value){
    var options = document.getElementById(elementSelector);
    const newOption = document.createElement('option');
    newOption.value= key;
    newOption.text= value;
    options.appendChild(newOption);
}

function addCurrency(dbPromise,currencyData){
    const storeName = "CurrencyStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName,'readwrite');
        tx.objectStore(storeName).put(currencyData);
        return tx.complete;
    })
}

function addExchangeRate(data){
    const storeName = "ExchangeRateStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put({id: exchangeID, data : data});
        return tx.complete;
    })
}

function fetchCurrencyFromDBOrWeb(){    
    let dataFound = false;

    dbPromise.then(db => {
        return db.transaction('CurrencyStore')
                 .objectStore('CurrencyStore')
                 .getAll();
    }).then(currencies => {

        for(let currencyData of currencies){

            //append currency to select options 
            const optionName = `${currencyData.currencyName} - (${currencyData.id})`;
            const optionValue = currencyData.id;
           
            appendOption('from-selector', optionValue, optionName);
            appendOption('to-selector', optionValue, optionName);

            dataFound = true;
        }

        if(dataFound == false){
            fetchCurrencyDataFromWeb(dbPromise);
        }
    });

}


function fetchCurrencyDataFromWeb(dbPromise){
    const currenciesAPIURL = 'https://free.currencyconverterapi.com/api/v5/currencies';
    fetch(currenciesAPIURL).then(response => response.json()).then(data => {
        const currencies = data.results;

        for(let currencyIndex in currencies){
            let currencyData = currencies[currencyIndex];

            //save data into the store
            addCurrency(dbPromise,currencyData);

            //append currency to select options 
            const optionName = `${currencyData.currencyName} - (${currencyData.id})`;
            const optionValue = currencyData.id;
           
            appendOption('from-selector', optionValue, optionName);
            appendOption('to-selector', optionValue, optionName);
        }

        console.log(data);
    })
}



