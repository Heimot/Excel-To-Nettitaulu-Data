import { useState, useEffect } from 'react';
import XLSX from 'xlsx';
import useFetch from './useFetch';
import './App.css';



function App() {
  const [allOrders, setOrders] = useState(null);

  const handleFile = (e) => {
    try {
      var file = e.target.files[0];
      // input canceled, return
      if (!file) return;

      var FR = new FileReader();
      FR.onload = (e) => {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: "array" });
        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // header: 1 instructs xlsx to create an 'array of arrays'
        var result = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        let i;

        let orders = [];
        for (i = 0; i < result.length; i++) {
          let kukka = result[i]

          let k;
          let woa = [];
          for (k = 0; k < kukka.length; k++) {
            let data = kukka[k];
            woa.push(data)

          }
          orders.push(woa);
          /*
    
          */
        }
        setOrders(orders);
      };
      FR.readAsArrayBuffer(file);
    } catch (error) {
      console.log(error);
    };
  };



  async function createOrdersFromExcel() {
    if (!allOrders) return;
    let i;
    for (i = 1; i < allOrders[0].length; i++) {
      let k;
      let ids = [];
      let orderData = null;
      for (k = 3; k < allOrders.length; k++) {
        if (k !== 0) {
          if (allOrders[k][i] > 0 && !isNaN(allOrders[k][i]) || allOrders[k][i] !== "" && !isNaN(allOrders[k][i])) {
            // This console.log is just for testing purposes!
            console.log({"kukka": allOrders[k][0], "maara": allOrders[k][i]})
            let oneID = await fetch("http://localhost:3002/products/post", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                kukka: allOrders[k][0],
                toimi: allOrders[k][i],
              })
            })
            let json = await oneID.json();
            ids.push(json.createdProduct._id);
          }
        }
      }
      orderData = {tpvm: allOrders[2][i], kpvm: allOrders[3][i], code: allOrders[1][i], kauppa: allOrders[0][i]};
      console.log(orderData)
      if (ids.length !== 0) {
        createOrder(ids, orderData);
      }

    }
  }

  function createOrder(ids, orderData) {
    if (!ids) return;
    if(!orderData) return;
    fetch("http://localhost:3002/orders/post/", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kauppa: orderData.kauppa,
        date: orderData.kpvm,
        toimituspvm: orderData.tpvm,
        orderLisatieto: orderData.code,
        alisatieto: "Excel import works!!!!",
        products: ids

      })
    })
      .then(response => response.json())
      .then(json => {
        console.log(json)
      })
      .catch((error) => {
        console.log(error);
      });

  }


  return (
    <div className="App">
      <header className="App-header">
        <input type="file" accept=".xls,.xlsx,.ods" onChange={(e) => handleFile(e)}></input>
        <button onClick={() => createOrdersFromExcel()}>create</button>
      </header>
    </div>
  );
}

export default App;
