var dbPromise = null; 
var exchangeID = null;
var exchangeTite = '';
var toCurrencyID = '';
var fromCurrencyID = '';
var convertButton = document.getElementById("convert-button");

window.addEventListener('load', e => {

    //register service worker
    if('serviceWorker' in navigator){
        try {
            navigator.serviceWorker.register("sw.js");
        } catch (error) {
            console.log("service worker registration failed");
        }
    }

    //setup the database and datastores
    dbPromise = idb.open('ConverterDatabase', 1, upgradeDB => {
        upgradeDB.createObjectStore('CurrencyStore',{keyPath : 'id'});        
        upgradeDB.createObjectStore('ExchangeRateStore',{keyPath : 'id'});
    });   
    
    //populate currency select options
    _fetchCurrencyFromDBOrWeb();

    //convert button handler
    convertButton.onclick = () => {
        const fromCurrencySelector = document.getElementById("from-selector");
        const fromCurrency = fromCurrencySelector.options[fromCurrencySelector.selectedIndex].value;

        const toCurrencySelector = document.getElementById("to-selector");
        const toCurrency = toCurrencySelector.options[toCurrencySelector.selectedIndex].value
        
        exchangeID = `${fromCurrency}_${toCurrency}`;  
        exchangeTitle = `From ${fromCurrency} > To ${toCurrency}`;  
        toCurrencyID = toCurrency;
        fromCurrencyID = fromCurrency;
        const exchangeRateAPIEndPoint = `https://free.currencyconverterapi.com/api/v5/convert?q=${exchangeID}&compact=ultra`;

        const storeName = "ExchangeRateStore";
        dbPromise.then(db => {
            return db.transaction(storeName, 'readwrite')
                   .objectStore(storeName)
                   .get(`${exchangeID}`);            
        }).then(result => {
            /** Calculate from web value data not found in database otherwise use database value */
            if(result == null){
                _calculateFromWebValue(exchangeRateAPIEndPoint);
            }else{
                const exchangeValue = document.getElementById("exchange-value").value;
                _convertCurrency(result.data, exchangeValue);
            }            
        });        
    }
});

function _calculateFromWebValue(exchangeRateAPIEndPoint){
    //fetch exchange rate from web
    fetch(exchangeRateAPIEndPoint)
    .then(response => response.json())
    .then(data => {     
        const exchangeValue = document.getElementById("exchange-value").value;
        _addExchangeRate(data);
        _convertCurrency(data, exchangeValue);
    }).catch((error) => {
        _calculateFromCachedExchangeRate();
    });
}

function _calculateFromCachedExchangeRate(){
    const storeName = "ExchangeRateStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).get(exchangeID);
        return tx.complete;
    }).then(data => {
        const exchangeValue = document.getElementById("exchange-value").value;
        _convertCurrency(data, exchangeValue);
    });
}

function _convertCurrency(data, exchangeValue){

    let totalAmountConverted = 1;

    for (var prop in data) {
        exchangeRate = data[prop];
        totalAmountConverted = exchangeValue * exchangeRate;

        const convertedValueElement = document.getElementById('converted-value');
        const exchangeTitleElement = document.getElementById('exchange-title');
        const exchangeRateElement = document.getElementById('exchange-rate');

        convertedValueElement.innerHTML = `${toCurrencyID} ${totalAmountConverted}`;
        exchangeTitleElement.innerHTML = exchangeTitle;
        exchangeRateElement.innerHTML = `1${fromCurrencyID} = ${exchangeRate}`;
        break;
    }
}

function _appendOption(elementSelector, key, value){
    var options = document.getElementById(elementSelector);
    const newOption = document.createElement('option');
    newOption.value= key;
    newOption.text= value;
    options.appendChild(newOption);
}

function _addCurrency(dbPromise,currencyData){
    const storeName = "CurrencyStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName,'readwrite');
        tx.objectStore(storeName).put(currencyData);
        return tx.complete;
    })
}

function _addExchangeRate(data){
    const storeName = "ExchangeRateStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put({id: exchangeID, data : data});
        return tx.complete;
    })
}

function _fetchCurrencyFromDBOrWeb(){    
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
           
            _appendOption('from-selector', optionValue, optionName);
            _appendOption('to-selector', optionValue, optionName);

            dataFound = true;
        }

        if(dataFound == false){
            _fetchCurrencyDataFromWeb(dbPromise);
        }
    });

}


function _fetchCurrencyDataFromWeb(dbPromise){
    const currenciesAPIURL = 'https://free.currencyconverterapi.com/api/v5/currencies';
    fetch(currenciesAPIURL).then(response => response.json()).then(data => {
        const currencies = data.results;

        for(let currencyIndex in currencies){
            let currencyData = currencies[currencyIndex];

            //save data into the store
            _addCurrency(dbPromise,currencyData);

            //append currency to select options 
            const optionName = `${currencyData.currencyName} - (${currencyData.id})`;
            const optionValue = currencyData.id;
           
            _appendOption('from-selector', optionValue, optionName);
            _appendOption('to-selector', optionValue, optionName);
        }

        console.log(data);
    })
}



