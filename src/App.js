import { useEffect, useState } from 'react';
import XLSX from 'xlsx';
import './App.css';
import Blocker from './Blocker';


function App() {
  const [allOrders, setOrders] = useState(null);
  const [qr, setQR] = useState([]);
  const [blocked, setBlocked] = useState(true);
  const [getUsers, setUsers] = useState(null);

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




  const RFID = async () => {
    try {
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
        setQR(oldArr => [...oldArr, m])
        console.log(m)
      } while (m.charCodeAt(0) !== 13)

    } catch (error) {
      console.log(error);
    }
  }

  var bluetoothDevice;

  const conBluetooth = async () => {
    navigator.bluetooth.requestDevice({
      name: "BarCode Bluetooth BLE",
      acceptAllDevices: true
    })
      .then((device) => {
        bluetoothDevice = device;
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
        bluetoothDevice.addEventListener('inputreport', data);
        connect();
      })
      .catch(error => {
        alert('Argh! ' + error);
      });
  }

  function connect() {
    exponentialBackoff(3 /* max retries */, 2 /* seconds delay */,
      function toTry() {
        time('Connecting to Bluetooth Device... ');
        return bluetoothDevice.gatt.connect();
      },
      function success() {
        alert('> Bluetooth Device connected. Try disconnect it now.');
      },
      function fail() {
        time('Failed to reconnect.');
      });
  }

  function data() {
    alert("DATA GOTTEN")
  }

  function onDisconnected() {
    alert('> Bluetooth Device disconnected');
    connect();
  }

  function exponentialBackoff(max, delay, toTry, success, fail) {
    toTry().then(result => success(result))
      .catch(_ => {
        if (max === 0) {
          return fail();
        }
        time('Retrying in ' + delay + 's... (' + max + ' tries left)');
        setTimeout(function () {
          exponentialBackoff(--max, delay * 2, toTry, success, fail);
        }, delay * 1000);
      });
  }

  function time(text) {
    alert('[' + new Date().toJSON().substr(11, 8) + '] ' + text);
  }

  const removeBlocker = () => {
    setBlocked(!blocked)
  }

  const userData = (users) => {
    setUsers(users)
  }

  return (
    <div className="App">
      {blocked ?
        <Blocker remove={() => removeBlocker()} userData={(users) => userData(users)} />
        : null}
      <header className="App-header">
        <h1>EXCEL TO NETTITAULU TEST</h1>
        <input type="file" accept=".xls,.xlsx,.ods" onChange={(e) => handleFile(e)}></input>
        <button onClick={() => createOrdersFromExcel()}>create</button>
        <div>
          <button onClick={() => RFID()}>Read RFID</button>
        </div>
        <div>
          <h3>Scanned codes</h3>
          {qr.map(code => {
            return (
              <div>
                {code}
              </div>
            )
          })}
        </div>
        <div>
          <button onClick={() => conBluetooth()}>Web Bluetooth</button>
        </div>
        {getUsers ? <div>
          <h3>USERS SCANNED BY ID</h3>
          {getUsers.map(user => {
            return (<div key={user}>{user}</div>)
          })}
        </div> : null}
      </header>

    </div>
  );
}

export default App;
