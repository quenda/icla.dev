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
