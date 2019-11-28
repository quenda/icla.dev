#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import uuid
import re
import sys
import os
import requests
import yaml
import datetime
from weasyprint import HTML, CSS

yml = yaml.safe_load(open('../config.yaml').read())
js = json.loads(sys.stdin.read())

remoteip = os.environ.get('REMOTE_ADDR', '')
token = js['token']
recipient = js['recipient']
answers = js['answers']

today = datetime.date.today()
answers['date'] = today.strftime('%B %d, %Y')


js = {"error": "Invalid token or recipient organization"}

if re.match(r"^[-a-z0-9]+$", recipient):
    ryml = yaml.safe_load(open('../recipients/%s.yaml' % recipient).read())
else:
    token = ''

if re.match(r"^[-a-f0-9]+$", token):
    fpath = os.path.join(yml['storage']['tokens'], token)
    if os.path.exists(fpath):
        answers['email'] = open(fpath).read().strip()
        os.unlink(fpath)

        html = open("../recipients/%s.template.html" % recipient, encoding='utf-8').read()
        html = re.sub(r"\$([a-z]+)", lambda v: answers.get(v.group(1), u"???"), html)
        
        css = [CSS(string="""@page { size: letter; margin: 1cm }""")]
        pdfid = str(uuid.uuid4()) + ".pdf"
        pdfpath = os.path.join(yml['storage']['pdf'], pdfid);
        HTML(string=html, encoding='utf-8', base_url = './').write_pdf(pdfpath, stylesheets=css)
        
        js = {
            "file": pdfid
        }
        
        pdfdata = open(pdfpath, "rb").read()
        import smtplib
        #from email.message import EmailMessage
        import email.mime.text, email.header
        import email.mime.multipart
        import email.mime.application
        
        body = "Please see attached ICLA.\n With regards,\n%s\n" % yml['server']['whoami']
        msg = email.mime.multipart.MIMEMultipart()
        msg['Subject'] = "[%s] ICLA for %s" % (yml['server']['hostname'], answers['legalname'])
        msg['From'] = yml['email']['sender']
        msg['To'] = ryml['meta']['recipient']
        msg['Reply-To'] = answers['email']
        msg['Message-ID'] = str(email.utils.make_msgid())
        msg.preamble = "This shouldn't show up..."
        msg.attach( email.mime.text.MIMEText( body, 'plain' ) )
        attach =  email.mime.application.MIMEApplication( pdfdata, subtype='pdf')
        attach.add_header('Content-Disposition','attachment',filename='icla.pdf')
        msg.attach(attach)
        
        # Send the message via our own SMTP server.
        s = smtplib.SMTP('localhost')
        s.send_message(msg)
        s.quit()

print("Status: 200 Okay\r\nContent-Type: application/json\r\n\r\n")
print(json.dumps(js))

