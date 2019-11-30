#!/usr/bin/env python3

import os
import time
import yaml

now = time.time()
cutoff = now - 86400 # One day ago
yml = yaml.safe_load(open('config.yaml').read())

pdfdir = yml['storage']['pdf']
tokdir = yml['storage']['tokens']
rm = 0

if os.path.exists(pdfdir):
    for file in [x for x in os.listdir(pdfdir) if os.path.isfile(os.path.join(pdfdir, x))]:
        fpath = os.path.join(pdfdir, file)
        if os.path.getctime(fpath) < cutoff:
            print("Removing %s" % fpath)
            os.unlink(fpath)
            rm += 1

if os.path.exists(tokdir):
    for file in [x for x in os.listdir(tokdir) if os.path.isfile(os.path.join(tokdir, x))]:
        fpath = os.path.join(tokdir, file)
        if os.path.getctime(fpath) < cutoff:
            print("Removing %s" % fpath)
            os.unlink(fpath)
            rm += 1

print("Done! Removed %u files." % rm)
