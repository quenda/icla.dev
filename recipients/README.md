# Directory structure:

Where `foo.icla.online` is accessed, `foo` has the following data:

* `foo.yaml`: The meta-data and questions for ICLAs for organization foo. This feeds into the template
* `foo.template.html`: The PDF template for ICLAs for organization foo.
* `foo_bar.yaml`: Any additional feed documents for the questions.

It is also possible to interpolate from an existing PDF, `foo.template.pdf` using annotations. If mapping from the questions is needed, it can be specified as a bare key/value list in `foo.template.pdf.map.yaml`.

See the ASF files for good examples.
