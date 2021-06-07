import { useEffect, useState } from 'react';
import XLSX from 'xlsx';
import './App.css';



function App() {
  const [allOrders, setOrders] = useState(null);
  const [qr, setQR] = useState("");

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
      console.log(allOrders[i]);
      let k;
      let ids = [];
      let orderData = null;
      for (k = 3; k < allOrders.length; k++) {
        if (k !== 0) {
          if ((allOrders[k][i] > 0 && !isNaN(allOrders[k][i])) || (allOrders[k][i] !== "" && !isNaN(allOrders[k][i]))) {
            // This console.log is just for testing purposes!
            console.log({ "kukka": allOrders[k][0], "maara": allOrders[k][i], "kerayspaikka": allOrders[k][1] })
            let oneID = await fetch("http://localhost:3002/products/post", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                kukka: allOrders[k][0],
                toimi: allOrders[k][i],
                kerays: allOrders[k][1],
              })
            })
            let json = await oneID.json();
            ids.push(json.createdProduct._id);
          }
        }
      }
      orderData = { tpvm: allOrders[2][i], kpvm: allOrders[3][i], code: allOrders[1][i], kauppa: allOrders[0][i] };
      console.log(orderData)
      if (ids.length !== 0) {
        createOrder(ids, orderData);
      }

    }
  }

  function createOrder(ids, orderData) {
    if (!ids) return;
    if (!orderData) return;
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

  const readCard = async (e) => {
    setQR(e.target.value)

  }

  const testerrr = (e) => {
    var key = e.keyCode || e.which;
    if (key == 13) {
      console.log(qr)
      setQR("");
    }
  }

  const RFID = async() => {
    try {

      // LATAA LAITTEILLE ZADIGILLA WINUSB!!!!!!!!!! ETTÄ TOIMII

      const filters = [{
        vendorId: 0x1A86
      }];
      const device = await navigator.usb.requestDevice({ filters })

      const configuration_number = 1  // device.configuration.configurationValue
      const interface_number = 0      // device.configuration.interfaces[1].interfaceNumber
      const interface_class = 255      // device.configuration.interfaces[1].alternates[0].interfaceClass
      console.log(device);
      console.log(`configuration number :  ${configuration_number}`);
      console.log(`interface number : ${interface_number} `);
      console.log(`interface class : ${interface_class} `);

      await device.open();
      await device.selectConfiguration(configuration_number);
      await device.claimInterface(interface_number);
      await device.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x10,
        index: interface_number
      });

      const read = async (device) => {
        const result = await device.transferIn(2, 64);
        const decoder = new TextDecoder();
        const message = decoder.decode(result.data);
        return message
      }

      var m
      do {
        m = await read(device)
        console.log(m);
      } while (m.charCodeAt(0) !== 13)

    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>EXCEL TO NETTITAULU TEST</h1>
        <input type="file" accept=".xls,.xlsx,.ods" onChange={(e) => handleFile(e)}></input>
        <button onClick={() => createOrdersFromExcel()}>create</button>
        <div>
          <h4>JUU</h4>
          <input onKeyPress={(e) => testerrr(e)} value={qr} id="wa" onChange={(e) => readCard(e)}></input>
          <button onClick={() => readCard()}>Cardreader</button>
        </div>
        <div>
          <button onClick={() => RFID()}>Read RFID</button>
        </div>
      </header>
    </div>
  );
}

export default App;
