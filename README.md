# GroupVine Graphics

Library for creating simple graphics with ImageMagick with the Pango
extension.

## Installation

Installation requires that ImageMagick is installed, along with the
'pango' extension (i.e., compiled with '--with-pango' flag), so pango
must be installed before installing/building ImageMagick.  See
[ImageMagick installation
page](https://www.imagemagick.org/script/binary-releases.php), and
[Pango download page](http://www.pango.org/Download), and see below
for specific OS-X instructions.

To test that pango is properly integrated with ImageMagick, run the
following and expect output like this:

```
bash-3.2$ convert -list format | grep PANGO
    PANGO* PANGO     r--   Pango Markup Language (Pangocairo 1.40.3)
```

... and not this:

```
bash-3.2$ convert -list format | grep PANGO
    PANGO* PANGO     ---   Pango Markup Language
```



### ImageMagick for OS-X

To install pango (if needed):

```
sudo port install pango
```

(The ```port``` command is from MacPorts, see
[here](https://www.macports.org/install.php) if needed.)

To uninstall and reinstall on OS-X (e.g., to re-install with pango,
note the '+pango' variant option added to the install command):

```
sudo port uninstall ImageMagick
sudo port install ImageMagick +pango
```

### ImageMagick for AWS Linux

Possibly first:

```
sudo yum upgrade
```

```
sudo yum install cairo cairo-devel libxml2-devel pango-devel pango libpng-devel freetype freetype-devel libart_lgpl-devel
```

Rebuild ImageMagick (download from
[here](http://www.imagemagick.org/script/install-source.php#unix):

```
sudo yum remove ImageMagick   # Remove old one
tar xvf ImageMagick...
cd ImageMagick...
./configure --with-pango
sudo make install
```

