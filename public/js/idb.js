let db;

// establish a connection to IndexedDB
const request = indexedDB.open('budget-tracker', 1);

// // Add object store 
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

// // This function will be executed if there's no internet connection
function saveRecord(record) {
  // new transaction 
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  const transObjectStore = transaction.objectStore('new_transaction');

  // add record to your store with add method.
  transObjectStore.add(record);
}

function uploadTransaction() {
  // open a transaction on your pending db
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // access your pending object store
  const transObjectStore = transaction.objectStore('new_transaction');

  // get all records from store and set to a variable
  const getAll = transObjectStore.getAll();

  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const transObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          transObjectStore.clear();
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);