import superagent from "superagent";
import store from "@/store";

function _getURL(options) {
    let currentUrl = parent['getCurrentNetSuiteUrl'] ? parent.getCurrentNetSuiteUrl() : window.location.href;
    let [baseUrl, queryString] = currentUrl.split('?');
    const params = new Proxy(new URLSearchParams(`?${queryString}`), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    let essentialParams = {script: options?.script || params['script'], deploy: options?.deploy || params['deploy']};
    let postEndpoint = baseUrl + '?' + new URLSearchParams(essentialParams).toString();

    return {baseUrl, essentialParams, postEndpoint}
}

export default {
    async get(operation, requestParams, options) {
        let {baseUrl, essentialParams} = _getURL(options);

        return new Promise((resolve, reject) => {
            superagent.get(baseUrl)
                .set("Content-Type", "application/json")
                .query({...essentialParams, requestData: JSON.stringify({operation, requestParams})})
                .end((err, res) => { _handle(err, res, reject, resolve); });
        });
    },
    async post(operation, requestParams, options) {
        let {postEndpoint} = _getURL(options);

        return new Promise((resolve, reject) => {
            superagent.post(postEndpoint)
                .set("Content-Type", "application/json")
                .set("Accept", "json")
                .send({operation, requestParams})
                .end((err, res) => { _handle(err, res, reject, resolve); });
        });
    },
    getBase64PDF(url, params) {
        return new Promise((resolve, reject) => {
            superagent.get(url)
                .set("Accept", "application/pdf")
                .responseType('blob')
                .query(params)
                .end((err, res) => {
                    let errorMessage = err || (res.body?.error || null);
                    if (errorMessage) reject(errorMessage);
                    else {
                        let reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                resolve(event.target.result.split(',')[1]);
                            } catch (e) {reject(e);}
                        }
                        reader.onerror = (e) => {
                            reject(e);
                        }
                        reader.readAsDataURL(res.body);
                    }
                });
        });
    }
}

function _handle(err, res, reject, resolve, noErrorPopup = false) {
    let errorMessage = err || (res.body?.error || null);

    if (errorMessage) {
        if (!noErrorPopup) store.dispatch('handleException',
            {title: 'An error occurred', message: errorMessage}, {root: true}).then();

        reject(errorMessage);
    } else resolve(res.body);
}