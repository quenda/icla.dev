#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import uuid
import re
import sys
import os
import asfpy.messaging
import requests
import yaml

LETTER = """Hi there,
You (or someone else) is trying to sign a contributor license agreement
using %(hostname)s. In order to verify the integrity of the email
address associated with the ICLA, we have sent this verification email,
as this email address will act as the primary means of communication
between you and %(recipient)s.
If this is you, please visit the following URL to continue your process:
%(url)s/icla.html?%(lid)s

If this was not you, you can safely ignore this email.

With regards,
%(whoami)s
https://%(hostname)s
"""

yml = yaml.safe_load(open('../config.yaml').read())
js = json.loads(sys.stdin.read())

remoteip = os.environ.get('REMOTE_ADDR', '')
response = js['token']
email = js['email']
recipient = js['recipient']

rv = requests.post('https://www.google.com/recaptcha/api/siteverify', data = {
    'secret': yml['captcha']['secret'],
    'response': response,
    'remoteip': remoteip
});

success = False
if rv.status_code == 200:
    rjson = rv.json()
    success = rjson['success']
    if rjson['score'] < 0.75:
        sucess = False

if re.match(r"^[-a-z0-9]+$", recipient):
    ryml = yaml.safe_load(open('../recipients/%s.yaml' % recipient).read())
else:
    success = False

if success:
    lid = str(uuid.uuid4())
    with open(os.path.join(yml['storage']['tokens'], lid), "w") as f:
        f.write(email)
        f.close()

    varlist = {
        'lid': lid,
        'recipient': ryml['meta']['owner'],
        'hostname': yml['server']['hostname'],
        'whoami': yml['server']['whoami'],
        'url': os.environ.get('HTTP_HOST', yml['server']['url']),
    }
    
    asfpy.messaging.mail(
        host = 'localhost',
        sender = yml['email']['sender'],
        recipient = email,
        subject = "[%s] Please verify your email address" % yml['server']['hostname'],
        message = LETTER % varlist
    )

print("Status: 200 Okay")
print("Content-Type: application/json")
print("")
print(json.dumps({'success': success}))

