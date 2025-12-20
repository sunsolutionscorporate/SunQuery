// @method-static
function ajax(options = {}) {
   if (!n.helper.isURL(options?.url)) {
      log.error(`[ajax] parameter 'url' accepts only type 'string'`);
      return;
   };
   options = { ...n.ajax?._global_config, ...options };
   // log(options)
   // return
   const method = (options?.method || "GET").toUpperCase();
   const timeout = options?.timeout || 0;
   const cache = options?.cache !== false;
   const result = { dataType: [], cache: cache, response: null, status: null, statusText: null };
   const crossDomain = options.crossDomain || false;
   const responseType = options?.responseType || "";
   const done_cb = n.helper.isFunction(options?.success, [options.success]) || [];
   const fail_cb = n.helper.isFunction(options?.error, [options.error]) || [];
   const always_cb = n.helper.isFunction(options?.always, [options.always]) || [];
   const serializeData = function (data) {
      if (!data) return null;
      // Kalau sudah FormData, jangan diubah
      if (data instanceof FormData) {
         return data;
      }
      if (n.helper.type(data) === "sQ") data = data[0];
      if (data?.constructor?.name === "NodeList") data = data[0];
      if (n.helper.type(data) === "html" && data.nodeName?.toUpperCase() === "FORM") return n(data).serialize();
      if (n.helper.type(data) === "stringJson") data = JSON.parse(data);
      if (n.helper.type(data) === "object") return Object.keys(data).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`).join("&");
      return data;
   };
   let data = serializeData(options.data);
   const normalizeHeaders = function (headers) {
      const result = {};
      for (let key in headers || {}) {
         result[key.replace(/([a-z])([A-Z])/g, "$1-$2").split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-")] = headers[key];
      }
      if (method !== 'GET') result["Content-Type"] = result["Content-Type"] || options.contentType || "application/x-www-form-urlencoded; charset=UTF-8";
      return result;
   };
   const headers = normalizeHeaders(typeof options.headers === 'function' ? options.headers() : options.headers || {});
   const request = {
      abort: () => xhr.abort(),
      done(cb) { return done_cb.push(cb), this },
      fail(cb) { return fail_cb.push(cb), this },
      always(cb) { return always_cb.push(cb), this },
      then(onFulfilled, onRejected) { return new Promise((resolve, reject) => { this.done(resolve).fail(reject) }).then(onFulfilled, onRejected) },
   };
   const json_parse = function (strJson) {
      try {
         if (!strJson) return strJson;
         return JSON.parse(strJson);
      } catch (err) {
         log.error(`[ajax] json_parse error`, err);
      }
   };
   let errorFired = false;
   const fireFail = function (status) {
      if (!errorFired) {
         errorFired = true;
         const res = json_parse(xhr.responseText);
         // if (res) {
         if (status) { res.status = status }
         result.status = xhr.status;
         result.statusText = xhr.statusText;
         fail_cb.forEach((cb) => cb.call(result, res));
         always_cb.forEach((cb) => cb.call(result, res));
         // }
      }
   };
   if (method === 'GET') {
      const params = [];
      if (data) params.push(data);
      if (!cache) params.push("_=" + Date.now());
      if (params.length) {
         const sep = options.url.includes("?") ? "&" : "?";
         options.url += sep + params.join("&");
      }
   };
   n.helper.isFunction(options?.beforeSend, () => {
      const proceed = options.beforeSend.call(xhr, data);
      if (proceed === false) {
         return { abort: () => xhr.abort(), done: () => this, fail: () => this, always: () => this, then: () => Promise.reject(), };
      }
   });
   n.helper.isFunction(options?.progress, () => xhr.onprogress = event => options.progress(event, xhr));
   n.helper.isFunction(options?.uploadProgress, () => xhr.upload.onprogress = event => options.uploadProgress(event, xhr));
   const xhr = new XMLHttpRequest();
   xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
         if (xhr.status >= 200 && xhr.status < 300) {
            let response = xhr.response;
            const content_type = n.helper.getContentType(xhr.getResponseHeader("Content-Type") || "");

            result.dataType.push(content_type);
            if (content_type === "json") {
               response = json_parse(xhr.responseText);
            }
            result.response = response;
            result.status = xhr.status;
            result.statusText = xhr.statusText;
            done_cb.forEach(cb => cb.call(result, response));
            always_cb.forEach((cb) => cb.call(result, response));
         } else {
            fireFail();
         }
      };
   };
   xhr.onerror = xhr.ontimeout = () => fireFail(xhr.ontimeout && "timeout");
   xhr.open(method, options.url, options.async !== false);
   xhr.timeout = timeout;
   if (crossDomain && "withCredentials" in xhr) xhr.withCredentials = true;
   for (const h in headers) { if (!(data instanceof FormData && h.toLowerCase() === "content-type")) xhr.setRequestHeader(h, headers[h]) };
   try { xhr.responseType = responseType } catch (e) { log.warn("[ajax] Unsupported responseType:", responseType) };
   xhr.send(method === 'GET' ? null : data);
   return request;
}

n.ajax.config = function (options) {
   if (options?.success || options?.done || options?.fail || options?.error || options?.complete) {
      log.warn(`[ajax] GlobalConfig`, `options.success, options.error,  options.complete are deprecated, use options.done, options.fail, options.always, options.done instead`);
   }
   n.ajax._global_config = options || {};
}
