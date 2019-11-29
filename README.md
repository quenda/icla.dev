## icla.dev - easy, online submission of Individual Contributor License Agreements for Open Source communities.
icla.dev is a simple submission service for gathering information and turning that into an ICLA document, that is then sent to the community requesting it. 

the `recipients` directory in this dir contains the various configured recipients and their templates, pull requests are most welcome!


## How to install and run
To run this yourself, you'll need:

- a web server with CGI
- python3 installed, plus the mods in `requirements.txt`
- postfix or similar mail server
- a google captcha API key-set

To install:
- Clone the repo, get the python deps with `pip3 install -r requirements.txt`
- Set up web server (for instance apache2 with mod_cgid), point docroot at the `site/` directory.
- Set up postfix
- Get the google API keys, add them and any other settings to config.yaml
- Install your recipients into the `recipients` directory.

And that should be it!
If pip3 fails on pymupdf, and you use a debian based OS, install the libmupdf-dev package first; `apt install libmupdf-dev`
