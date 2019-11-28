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
        wizard.inject(_p({style: { textAlign: 'center'}}, _a({href: `viewpdf.cgi?id=${json.file}`}, _img({src: 'images/pdf.png', style: {width: '32px'}})) ));
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
    
    wizard.inject(_h4({style: {textAlign: 'center'}}, rdata.agreement.title));
    
    let stepdiv = _div({id: 'steps'});
    wizard.inject(stepdiv);
    make_step_div(questions.length+1, 0);
    
    
    let _question = _div({class: 'question_wrapper', id: 'question_wrapper'});
    wizard.inject(_question);
    
    wizard_step(0);
}

function wizard_step(x) {
    
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
        let t = _h3(question.question);
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
        }
        
        if (question.type == 'multiline') {
            let inp = new HTML('textarea', {id: 'field_'+question.id}, value);
            ff.inject(inp);
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
        cdiv.inject(_div({}, _b("BY SIGNING BELOW YOU ACKNOWLEDGE THE ABOVE LICENSE AGREEMENT:")));
        let canvas =  new HTML('canvas', {id: 'signature'});
        cdiv.inject(canvas);
        cdiv.inject(_div({}, _i("Use your mouse, stylus or finger to sign in the above signature field.")));
        qw.inject(cdiv);
        initCanvas(canvas);
        
        let btn = new HTML('button', { style: { float: 'left'}, onclick: `wizard_step(${x-1});`}, "Previous");
        qw.inject(btn);
        
        let sbtn = new HTML('button', { style: { background: '#2150d1', float: 'right'}, onclick: `wizard_submit();`}, "Submit ICLA");
        qw.inject(sbtn);
    } else {
        if (x > 0) {
            let btn = new HTML('button', { style: { float: 'left'}, onclick: `wizard_step(${x-1});`}, "Previous");
            qw.inject(btn);
        }
        if (x < questions.length) {
            let btn = new HTML('button', { style: { float: 'right'}, onclick: `wizard_step(${x+1});`}, "Next");
            qw.inject(btn);
        }
    }
    
    curstep = x;
}

function icla(rec, token) {
    POST('/gateway.cgi', gateway_callback, {token: token, recipient: rec}, null, {token: token, recipient: rec});
}
