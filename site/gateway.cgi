#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import re
import sys
import os
import yaml

yml = yaml.safe_load(open('../config.yaml').read())
js = json.loads(sys.stdin.read())

token = js['token']
recipient = js['recipient']
js = '{"error": "Invalid token or recipient organization. If you have already completed the ICLA process, you will need a new token to redo the process."}'

if re.match(r"^[-a-f0-9]+$", token):
    fpath = os.path.join(yml['storage']['tokens'], token)
    if os.path.exists(fpath):
        pyaml = yaml.safe_load(open('../recipients/%s.yaml' % recipient).read())
        for v in pyaml['questions']:
            if v.get('feed'):
                tmpyml = yaml.safe_load(open('../recipients/%s' % v.get('feed')).read())
                v['list'] = tmpyml
        js = json.dumps(pyaml);

print("Status: 200 Okay")
print("Content-Type: application/json")
print("")
print(js)
