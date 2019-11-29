#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import re
import sys
import os
import yaml
import cgi

yml = yaml.safe_load(open('../config.yaml').read())
form = cgi.FieldStorage()
pdf = form.getvalue('id')

if re.match(r"^[-a-f0-9]+\.pdf(\.signed)?$", pdf):
    fpath = os.path.join(yml['storage']['pdf'], pdf)
    if os.path.exists(fpath):
        f = open(fpath, 'rb')
        pdfdata = f.read()
        sys.stdout.buffer.write(b"Status: 200 Okay\r\nContent-Type: application/pdf\r\nContent-Length: %u\r\n\r\n" % len(pdfdata))
        sys.stdout.buffer.write(pdfdata)
