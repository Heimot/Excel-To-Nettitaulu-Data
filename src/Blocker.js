import { useEffect, useState } from 'react';
import './Blocked.css';

let touchId = "";
let scan = false;
let timeOut = null;

// SCANNING USERS USING IDENTIV KBD WEDGE AND UTRUST 4701F

function Blocker({ remove, userData }) {
    const [ids, setIds] = useState([]);
    const [id, setId] = useState(null)
    const [users, setUsers] = useState([{ id: "196C68B3", name: "Pertti Venäläinen" }, { id: "09485AB3", name: "Kalle Testaaja" }, { id: "89B75CB3", name: "Jorma Ajaja" }])
    const [fading, setFading] = useState({ fClass: "fade", text: "PRESS ME TO START SCANNING" });

    /*
    WITHOUT CLICK
    useEffect(() => {
        //   document.querySelector('#div').addEventListener("keyup", touchHandler);
        document.documentElement.addEventListener('keyup', touchHandler)
        return () => { window.removeEventListener('keyup', touchHandler) }
    }, [])*/

    const touchHandler = (e) => {
        var key = e.keyCode || e.which;
        if (e.key.length === 1) {
            touchId = touchId + e.key;
        } else if (key === 13) {
            if (touchId.length > 3) {
                setId(touchId);
            }
            touchId = "";
        }
        setTimeout(() => {
            touchId = "";
        }, 500)
    }

    const scanRFIDS = () => {
        if (!scan) {
            scan = true;
            setFading({ fClass: "fading", text: "SCANNING" });
            document.documentElement.addEventListener('keyup', touchHandler)
            timeOut = setTimeout(() => {
                setFading({ fClass: "fade", text: "SCANNING STOPPED PRESS ME AGAIN TO SCAN" });
                document.documentElement.removeEventListener('keyup', touchHandler)
                scan = false;
            }, 20000)
        }

    }

    const readyNext = () => {
        clearTimeout(timeOut);
        document.documentElement.removeEventListener('keyup', touchHandler);
        userData(ids)
        remove();
    }

    useEffect(() => {
        if (!ids.includes(id) && id) {
            setIds(oldData => [...oldData, id])
        }
    }, [id])

    return (
        <div id="MaDiv" tabIndex="0" className="blocked">
            <div>
                <h1 onClick={() => scanRFIDS()} className={fading.fClass}>{fading.text}</h1>
            </div>
            <div style={{ backgroundColor: "white", borderRadius: "10px", marginTop: "10px", width: "300px", minHeight: "50px", height: "auto" }}>
                {ids.map(userId => {
                    let userName = users.filter(user => {
                        return (user.id).toLowerCase() === userId.toLowerCase()
                    })
                    let userExists = users.some(user => {
                        return (user.id).toLowerCase() === userId.toLowerCase()
                    })
                    if (userExists) {
                        return (
                            <div key={userId}>{userName[0].name}</div>
                        )
                    } else {
                        return (
                            <div key={userId}>User doesnt exist with id: {userId}</div>
                        )
                    }
                })}
            </div>
            <button onClick={() => readyNext()} disabled={ids.length !== 0 ? false : true} style={{ marginTop: "10px", borderRadius: "5px", height: "30px" }}>USERS HAVE BEEN SCANNED</button>
        </div>
    )
}

export default Blocker;