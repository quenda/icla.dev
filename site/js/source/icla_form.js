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
    let wizard = document.getElementById('wizard');
    wizard.innerHTML = '';
    wizard.inject(_h2('Submitting, please wait...'));
    wizard.inject(_img({src: 'images/spinner.gif', style: { display: 'block', margin: '0 auto'}}));
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
        wizard.innerHTML = "Invalid recipient or token presented! If you have already completed the ICLA process once using this token, you will need to re-validate your email address <a href='./'>here</a>.";
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
    let btn = _a({href:'javascript:void();', onclick: `javascript:void(${onclick});`, class: `button button-${color} ${dir}`});
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
    if (x == questions.length) {
        for (let i = 0; i < questions.length; i++) {
            if (questions[i].required && (answers[questions[i].id]||'').length == 0) {
                alert(`Please complete step ${i+1} before you sign`);
                wizard_step(i);
                return false;
            }
        }
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
