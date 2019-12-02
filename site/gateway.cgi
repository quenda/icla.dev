#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import re
import sys
import os
import yaml
import requests
import time
import tempfile

def url_cached(url):
    xurl = url.replace('https://', '').replace('/', '_')
    fpath = os.path.join(tempfile.gettempdir(), xurl)
    if os.path.exists(fpath):
        now = time.time()
        if os.path.getctime(fpath) > (now - 1800):
            return open(fpath).read()
    data = requests.get(url).text
    with open(fpath, "w") as f:
        f.write(data)
        f.close()
    return data

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
                feed = v['feed']
                tmpyml = []
                if feed.startswith('https://'):
                    feed_data = url_cached(feed)
                else:
                    feed_data = open('../recipients/%s' % feed).read()
                if feed.endswith('.yaml') or feed.endswith('.yml'):
                    tmpyml = yaml.safe_load(feed_data)
                elif feed.endswith('.json'):
                    tmpyml = json.loads(feed_data)
                v['list'] = tmpyml
        js = json.dumps(pyaml);

print("Status: 200 Okay")
print("Content-Type: application/json")
print("")
print(js)
