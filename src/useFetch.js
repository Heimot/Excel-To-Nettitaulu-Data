import { useEffect, useState } from 'react';

const useFetch = (url, options) => {
    const [res, setRes] = useState(null);
    useEffect(() => {
        async function getData() {
            const res = await fetch(url, options);
            const json = await res.json();
            setRes(json);
        }
        getData();
    }, []);
    return res;
};

export default useFetch;