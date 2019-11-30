/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
// THIS IS AN AUTOMATICALLY COMBINED FILE. PLEASE EDIT source/*.js!!



/******************************************
 Fetched from source/base-http-extensions.js
******************************************/

// URL calls currently 'in escrow'. This controls the spinny wheel animation
var async_escrow = {}
var async_maxwait = 250; // ms to wait before displaying spinner
var async_status = 'clear';
var async_cache = {}

// Escrow spinner check
async function escrow_check() {
    let now = new Date();
    let show_spinner = false;
    for (var k in async_escrow) {
        if ( (now - async_escrow[k]) > async_maxwait ) {
            show_spinner = true;
            break;
        }
    }
    // Fetch or create the spinner
    let spinner = document.getElementById('spinner');
    if (!spinner) {
        spinner = new HTML('div', { id: 'spinner', class: 'spinner'});
        spinwheel = new HTML('div', {id: 'spinwheel', class: 'spinwheel'});
        spinner.inject(spinwheel);
        spinner.inject(new HTML('h2', {}, "Loading, please wait.."));
        document.body.appendChild(spinner);
    }
    // Show or don't show spinner?
    if (show_spinner) {
        spinner.style.display = 'block';
        if (async_status === 'clear') {
            console.log("Waiting for JSON resource, deploying spinner");
            async_status = 'waiting';
        }
    } else {
        spinner.style.display = 'none';
        if (async_status === 'waiting') {
            console.log("All URLs out of escrow, dropping spinner");
            async_status = 'clear';
        }
    }
}

async function async_snap(error) {
    msg = await error.text();
    msg = (msg||"An unknown error occured, possibly an internal browser issue").replace(/<.*?>/g, ""); // strip HTML tags
    modal("An error occured", "An error code %u occured while trying to fetch %s:\n%s".format(error.status, error.url, msg), "error");
}


// Asynchronous GET call
async function GET(url, callback, state, snap, method, body) {
    method = method || 'get'
    console.log("Fetching JSON resource at %s".format(url))
    let pkey = "GET-%s-%s".format(callback, url);
    let res = undefined;
    let res_json = undefined;
    state = state || {};
    state.url = url;
    if (state && state.cached === true && async_cache[url]) {
        console.log("Fetching %s from cache".format(url));
        res_json = async_cache[url];
    }
    else {
        try {
            let meta = {method: method, credentials: 'include', referrerPolicy: 'unsafe-url', headers: {'x-original-referral': document.referrer}};
            if (body) {
                meta.body = body;
            }
            console.log("putting %s in escrow...".format(url));
            async_escrow[pkey] = new Date(); // Log start of request in escrow dict
            const rv = await fetch(url, meta); // Wait for resource...

            // Since this is an async request, the request may have been canceled
            // by the time we get a response. Only do callback if not.
            if (async_escrow[pkey] !== undefined) {
                delete async_escrow[pkey]; // move out of escrow when fetched
                res = rv;
            }
        }
        catch (e) {
            delete async_escrow[pkey]; // move out of escrow if failed
            console.log("The URL %s could not be fetched: %s".format(url, e));
            if (snap) snap({}, {reason: e});
            else {
                modal("An error occured", "An error occured while trying to fetch %s:\n%s".format(url, e), "error");
            }
        }
    }
    if (res !== undefined || res_json !== undefined) {
        // We expect a 2xx return code (usually 200 or 201), snap otherwise
        if ((res_json) || (res.status >= 200 && res.status < 300)) {
            console.log("Successfully fetched %s".format(url))
            if (res_json) {
                js = res_json;
            } else {
                js = await res.json();
                async_cache[url] = js;
            }
            if (callback) {
                callback(state, js);
            } else {
                console.log("No callback function was registered for %s, ignoring result.".format(url));
            }
        } else {
            console.log("URL %s returned HTTP code %u, snapping!".format(url, res.status));
            try {
                js = await res.json();
                snap(state, js);
                return;
            } catch (e) {}
            if (snap) snap(res);
            else async_snap(res);
        }
    }
}


// DELETE wrapper
async function DELETE(url, callback, state, snap) {
    return GET(url, callback, state, snap, 'delete');
}

// POST wrapper
async function POST(url, callback, state, snap, json) {
    return GET(url, callback, state, snap, 'post', JSON.stringify(json));
}

// PUT wrapper
async function PUT(url, callback, state, snap, json) {
    return GET(url, callback, state, snap, 'put', JSON.stringify(json));
}

// PATCH wrapper
async function PATCH(url, callback, state, snap, json) {
    return GET(url, callback, state, snap, 'PATCH', JSON.stringify(json));
}

// whatwg fetch for IE
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status === undefined ? 200 : options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);


/******************************************
 Fetched from source/base-js-extensions.js
******************************************/

/**
 * String formatting prototype
 * A'la printf
 */

String.prototype.format = function() {
  let args = arguments;
  let n = 0;
  let t = this;
  let rtn = this.replace(/(?!%)?%([-+]*)([0-9.]*)([a-zA-Z])/g, function(m, pm, len, fmt) {
      len = parseInt(len || '1');
      // We need the correct number of args, balk otherwise, using ourselves to format the error!
      if (args.length <= n) {
        let err = "Error interpolating string '%s': Expected at least %u argments, only got %u!".format(t, n+1, args.length);
        console.log(err);
        throw err;
      }
      let varg = args[n];
      n++;
      switch (fmt) {
        case 's':
          if (typeof(varg) == 'function') {
            varg = '(function)';
          }
          return varg;
        // For now, let u, d and i do the same thing
        case 'd':
        case 'i':
        case 'u':
          varg = parseInt(varg).pad(len); // truncate to Integer, pad if needed
          return varg;
      }
    });
  return rtn;
}


/**
 * Number prettification prototype:
 * Converts 1234567 into 1,234,567 etc
 */

Number.prototype.pretty = function(fix) {
  if (fix) {
    return String(this.toFixed(fix)).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
  }
  return String(this.toFixed(0)).replace(/(\d)(?=(\d{3})+$)/g, '$1,');
};


/**
 * Number padding
 * usage: 123.pad(6) -> 000123
 */

Number.prototype.pad = function(n) {
  var str;
  str = String(this);

  /* Do we need to pad? if so, do it using String.repeat */
  if (str.length < n) {
    str = "0".repeat(n - str.length) + str;
  }
  return str;
};


/* Func for converting a date to YYYY-MM-DD HH:MM */

Date.prototype.ISOBare = function() {
  var M, d, h, m, y;
  y = this.getFullYear();
  m = (this.getMonth() + 1).pad(2);
  d = this.getDate().pad(2);
  h = this.getHours().pad(2);
  M = this.getMinutes().pad(2);
  return y + "-" + m + "-" + d + " " + h + ":" + M;
};


/* isArray: function to detect if an object is an array */

isArray = function(value) {
  return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number' && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
};


/* isHash: function to detect if an object is a hash */

isHash = function(value) {
  return value && typeof value === 'object' && !isArray(value);
};


/* Remove an array element by value */

Array.prototype.remove = function(val) {
  var i, item, j, len;
  for (i = j = 0, len = this.length; j < len; i = ++j) {
    item = this[i];
    if (item === val) {
      this.splice(i, 1);
      return this;
    }
  }
  return this;
};


/* Check if array has value */
Array.prototype.has = function(val) {
  var i, item, j, len;
  for (i = j = 0, len = this.length; j < len; i = ++j) {
    item = this[i];
    if (item === val) {
      return true;
    }
  }
  return false;
};




/******************************************
 Fetched from source/icla_form.js
******************************************/

let questions = [];
let curstep = 0;
let rdata = {};
let answers = {};
let globData = {};
var signaturePad;

function initCanvas(canvas) {
    var ratio =  Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad = new SignaturePad(canvas);
    signaturePad.clear(); // otherwise isEmpty() might return incorrect value
    signaturePad.on();
}

function submit_callback(state, json) {
    if (json && json.file) {
        let wizard = document.getElementById('wizard');
        wizard.innerHTML = '';
        wizard.inject(_h2("ICLA Submitted!"));
        wizard.inject(_p("Your ICLA PDF has been generated and submitted to the organisation for review. You should receive a receipt via email once when agreement has been properly filed."));
        wizard.inject(_p("You may additionally view or download your ICLA here for safe keeping:"));
        wizard.inject(_p({style: { textAlign: 'center'}}, _a({href: `viewpdf.cgi?id=${json.file}`}, [
            _img({src: 'images/pdf.png', style: {width: '32px'}}),
            txt(` ${json.file}`)
            ]) ));
    } else {
        alert("Something went wrong :(");
    }
}

function wizard_submit() {
    answers.signature = signaturePad.toDataURL();
    globData.answers = answers;
    POST('/generate.cgi', submit_callback, {}, null, globData);
}


function make_step_div(len, at) {
    let stepdiv = document.getElementById('steps');
    stepdiv.innerHTML = '';
    for (let i = 0; i < len; i++) {
        let X = i + 1;
        let _step = _div({class: 'step_circle', onclick: `wizard_step(${i});`}, txt(X));
        if (i == at) {
            _step.className = 'step_circle active';
        }
        if (X != 1) {
            let _divider = _div({class: 'step_divider'});
            stepdiv.inject(_divider);
        }
        stepdiv.inject(_step);
    }
}

function gateway_callback(state, json) {
    globData = state;
    let wizard = document.getElementById('wizard');
    questions = json.questions;
    rdata = json;
    if (!questions) {
        wizard.innerHTML = "Invalid recipient or token presented!";
        return;
    }
    
    wizard.inject(_h4({style: {textAlign: 'center', display: 'none'}, id: 'wtitle'}, rdata.agreement.title));
    let stepdiv = _div({id: 'steps', style: {display: 'none'}});
    wizard.inject(stepdiv);
    
    
    let _question = _div({class: 'question_wrapper', id: 'question_wrapper'});
    wizard.inject(_question);
    
    pre_wizard();
}

function prettybutton(txt, dir, onclick, color = 'green') {
    let btn = _a({href:'#', onclick: `javascript:void(${onclick});`, class: `button button-${color} ${dir}`});
    let span = _span({class: 'btn-text'}, txt);
    if (dir == 'right') {
        let cur = _span({class: 'round'}, _i({class: 'fa fa-chevron-right'}));
        btn.inject(span);
        btn.inject(cur);
    } else {
        let cur = _span({class: 'round'}, _i({class: 'fa fa-chevron-left'}));
        btn.inject(cur);
        btn.inject(span);
    }
    return btn;
}

function pre_wizard() {
    let qw = document.getElementById('question_wrapper');
    let t = _h3(`Submission form for the ${rdata.agreement.title}`);
    qw.inject(t);
    let d = _p(`Great, we've verified your email address and the ICLA process can begin. Once you click the button below you will be guided through the ${questions.length} questions needed before you can sign the ICLA, and finally presented with the agreement to sign. Once completed, a PDF document will be generated and sent to ${rdata.meta.owner}.`);
    qw.inject(d);
    
    let btn = prettybutton('Begin submission process', 'right', 'wizard_step(0)', color = 'blue');
    qw.inject(btn);
}

function wizard_step(x) {
    document.getElementById('wtitle').style.display = 'block';
    document.getElementById('steps').style.display = 'block';
    if (curstep != x && curstep < questions.length) {
        let q = questions[curstep];
        let val = document.getElementById('field_' + q.id).value;
        answers[q.id] = val;
        console.log(val);
    }
    
    make_step_div(questions.length+1, x);
    let qw = document.getElementById('question_wrapper');
    qw.innerHTML = ''; // reset question wrapper
    
    
    if (x < questions.length) {
        let question = questions[x];
        let t = _h3(`Question ${x+1} of ${questions.length}: ${question.question}`);
        qw.inject(t);
        
        let ff = _div({style: {textAlign: 'center'}});
        qw.inject(ff);
        
        let value = answers[question.id]||'';
        if (value.length == 0 && question.copyfrom) {
            value = answers[question.copyfrom]||'';
        }
        
        if (question.type == 'string') {
            let inp = _input({type: 'text', id: 'field_'+question.id, value: value});
            inp.addEventListener("keyup", function(event) {
                if (event.keyCode === 13) {
                    wizard_step(x+1);
                }
            });
            ff.inject(inp);
            inp.focus();
        }
        
        if (question.type == 'multiline') {
            let inp = new HTML('textarea', {id: 'field_'+question.id}, value);
            ff.inject(inp);
            inp.focus();
        }
        
        if (question.type == 'select') {
            let inp = new HTML('select', {id: 'field_'+question.id});
            let vals = question.list||[];
            let xopt = new HTML('option', {value: ''}, '');
            inp.inject(xopt);
            for (let n = 0; n < vals.length; n++) {
                let opt = new HTML('option', {value: vals[n], selected: (vals[n] ==  value) ? 'selected' : null}, vals[n]);
                inp.inject(opt);
            }
            ff.inject(inp);
        }
    
    
        let d = _p(question.description);
        qw.inject(d);
        
        
    }
    
    if (x == questions.length) {
        qw.inject(_b("Please read the below agreement and sign at the bottom to signify you will follow it."));
        
        qw.inject(_h3(rdata.agreement.title));
        let agreement = new HTML('p', {id: 'agreement'});
        agreement.innerHTML = rdata.agreement.body;
        qw.inject(agreement);
        
        let cdiv = _div({style: {textAlign: 'center'}});
        cdiv.inject(_div({}, _b("BY SIGNING BELOW YOU ACKNOWLEDGE AND WILL OBEY THE ABOVE LICENSE AGREEMENT:")));
        let canvas =  new HTML('canvas', {id: 'signature'});
        cdiv.inject(canvas);
        cdiv.inject(_div({}, _i("Use your mouse, stylus or finger to sign in the above signature field.")));
        qw.inject(cdiv);
        initCanvas(canvas);
        
        let btn = prettybutton('Previous', 'left', `wizard_step(${x-1})`, color = 'green');
        qw.inject(btn);
        
        let sbtn = prettybutton('Submit ICLA', 'right', `wizard_submit()`, color = 'blue');
        qw.inject(sbtn);
    } else {
        if (x > 0) {
            let btn = prettybutton('Previous', 'left', `wizard_step(${x-1})`, color = 'green');
            qw.inject(btn);
        }
        if (x < questions.length) {
            let btn = prettybutton('Next', 'right', `wizard_step(${x+1})`, color = 'green');
            qw.inject(btn);
        }
    }
    
    curstep = x;
}

function icla(rec, token) {
    POST('/gateway.cgi', gateway_callback, {token: token, recipient: rec}, null, {token: token, recipient: rec});
}


/******************************************
 Fetched from source/init.js
******************************************/

let recaptcha = 'foo';

function primer() {
    grecaptcha.ready(function() {
        grecaptcha.execute('6LfW_8QUAAAAAFNWlzyGvviJPp_neNruOBH8v2J8', {action: 'homepage'}).then(function(token) {
           recaptcha = token;
        });
    });
}

function verify_callback(state, json) {
    document.getElementById('wizard').innerHTML = "<h5>An email with instructions on how to continue has been sent to your email address. Be sure to check your spam folder.</h5>";
}

function verify(recipient)  {
    let email = document.getElementById('field_email').value;
    if (!email.match(/^\S+@\S+?\.\S+?$/)) {
        alert("Please enter a valid email adress!");
        return
    }
    POST('/validate.cgi', verify_callback, {email: email}, null, {token: recaptcha, email: email, recipient: recipient});
}


/******************************************
 Fetched from source/scaffolding-html.js
******************************************/

/**
 * HTML: DOM creator class
 * args:
 * - type: HTML element type (div, table, p etc) to produce
 * - params: hash of element params to add (class, style etc)
 * - children: optional child or children objects to insert into the new element
 * Example:
 * div = new HTML('div', {
 *    class: "footer",
 *    style: {
 *        fontWeight: "bold"
 *    }
#}, "Some text inside a div")
 */

var txt = (msg) => document.createTextNode(msg);

var HTML = (function() {
  function HTML(type, params, children) {

    /* create the raw element, or clone if passed an existing element */
    var child, j, len, val;
    if (typeof type === 'object') {
      this.element = type.cloneNode();
    } else {
      this.element = document.createElement(type);
    }

    /* If params have been passed, set them */
    if (isHash(params)) {
      for (var key in params) {
        val = params[key];

        /* Standard string value? */
        if (typeof val === "string" || typeof val === 'number') {
          this.element.setAttribute(key, val);
        } else if (isArray(val)) {

          /* Are we passing a list of data to set? concatenate then */
          this.element.setAttribute(key, val.join(" "));
        } else if (isHash(val)) {

          /* Are we trying to set multiple sub elements, like a style? */
          for (var subkey in val) {
            let subval = val[subkey];
            if (!this.element[key]) {
              throw "No such attribute, " + key + "!";
            }
            this.element[key][subkey] = subval;
          }
        }
      }
    } else {
      if (!children) { children = params } // shortcut!
    }

    /* If any children have been passed, add them to the element */
    if (children) {

      /* If string, convert to textNode using txt() */
      if (typeof children === "string") {
        this.element.inject(txt(children));
      } else {

        /* If children is an array of elems, iterate and add */
        if (isArray(children)) {
          for (j = 0, len = children.length; j < len; j++) {
            child = children[j];

            /* String? Convert via txt() then */
            if (typeof child === "string") {
              this.element.inject(txt(child));
            } else {

              /* Plain element, add normally */
              this.element.inject(child);
            }
          }
        } else {

          /* Just a single element, add it */
          this.element.inject(children);
        }
      }
    }
    return this.element;
  }

  return HTML;

})();

/**
 * prototype injector for HTML elements:
 * Example: mydiv.inject(otherdiv)
 */

HTMLElement.prototype.inject = function(child) {
  var item, j, len;
  if (isArray(child)) {
    for (j = 0, len = child.length; j < len; j++) {
      item = child[j];
      if (typeof item === 'string') {
        item = txt(item);
      }
      this.appendChild(item);
    }
  } else {
    if (typeof child === 'string') {
      child = txt(child);
    }
    this.appendChild(child);
  }
  return child;
};



/**
 * prototype for emptying an html element
 */

HTMLElement.prototype.empty = function() {
  var ndiv;
  ndiv = this.cloneNode();
  this.parentNode.replaceChild(ndiv, this);
  return ndiv;
};

function toggleView(id) {
  let obj = document.getElementById(id);
  if (obj) {
    obj.style.display = (obj.style.display == 'block') ? 'none' : 'block';
  }
}

function br() {
  return new HTML('br');
}

// construction shortcuts for various elements
let _a = (a,b) => new HTML('a', a,b);
let _b = (a,b) => new HTML('b', a,b);
let _p = (a,b) => new HTML('p', a,b);
let _i = (a,b) => new HTML('i', a, b);
let _div = (a,b) => new HTML('div', a, b);
let _input = (a,b) => new HTML('input', a, b);
let _select = (a,b) => new HTML('select', a, b);
let _option = (a,b) => new HTML('option', a, b);
let _h1 = (a,b) => new HTML('h1', a, b);
let _h2 = (a,b) => new HTML('h2', a, b);
let _h3 = (a,b) => new HTML('h3', a, b);
let _h4 = (a,b) => new HTML('h4', a, b);
let _h5 = (a,b) => new HTML('h5', a, b);
let _kbd = (a,b) => new HTML('kbd', a, b);
let _pre = (a,b) => new HTML('pre', a, b);
let _hr = (a,b) => new HTML('hr', a, b);
let _span = (a,b) => new HTML('span', a, b);
let _img = (a,b) => new HTML('img', a, b);
let _textarea = (a,b) => new HTML('textarea', a, b);
let _get = (a) => document.getElementById(a);
