let im    = require('gm').subClass({imageMagick: true});
let path  = require('path');

//
// Image manipulation
//
// See: https://www.npmjs.com/package/gm#methods
// for (long!) list of conversion options
//

export class ImageObj {
    origPath: string;

    dirPath: string;
    extStr: string;
    origName: string;

    constructor(origPath:string, options?:any) {
        if (!options) { options = {}; }

        this.origPath = origPath;

        this.dirPath  = path.dirname(origPath);
        this.extStr   = path.extname(origPath);                // e.g., ".png"
        this.origName = path.basename(origPath, this.extStr);  // e.g., "logo"
    }

    imgInfo() {
        return new Promise( (resolve, reject) => {
            im(this.origPath).
                identify( (err, value) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(value);
                    }
                });
        });
    }

    fileSize() {
        return new Promise( (resolve, reject) => {
            im(this.origPath).
                filesize( (err, value) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(value);
                    }
                });
        });
    }

    imgSize() {
        return new Promise( (resolve, reject) => {
            im(this.origPath).
                size( (err, value) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(value);
                    }
                });
        });
    }

    // E.g., resize(300, 100, 90, newPath)
    resize(width:number, height:number, qual:number, newSuffix:string) {
        return new Promise( (resolve, reject) => {
            let newName = this.origName + newSuffix + this.extStr;
            let newPath = path.join(this.dirPath, newName);

            im(this.origPath).
                // "^" resize option resizes until either width
                // or height is reached (other is allowed to be greater)
                // See -convert and -geometry here: http://www.graphicsmagick.org/GraphicsMagick.html#details-resize
                // resize(width, height, "^").
                resize(width, height, ">").   // resize to fit while maintaining proportions, but only shrink, never enlarge
                quality(qual).
                write(newPath, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(newName);
                    }
                });
        });
    }
}
