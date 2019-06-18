let im         = require('gm').subClass({imageMagick: true});
let path       = require('path');

let LibAbbrev  = 'grph';

//
// Increase drawing density for sharper fonts
//

let densityFactor = 1;
let densityScale  = ((1.0 / densityFactor) * 100.0) + '%';

import {Graphic} from '.';

function DF(num:number) {
    return num * densityFactor;
}

export class GraphicLayer {
    graphic  : Graphic;   // parent graphic
    imgPath  : string;

    width    : number;
    height   : number;
    xOff     : number;
    yOff     : number;
    options  : any;

    imObj    : any;

    constructor(graphic:Graphic, layerNum:number, width:number, height:number, xOff?:number, yOff?:number, options?:any) {
        if (!options) { options = {}; }
        this.graphic  = graphic;
        this.imgPath  = this.imagePath(layerNum);

        this.width    = width;
        this.height   = height;
        this.xOff     = xOff;
        this.yOff     = yOff;
        this.options  = options;

        this.imObj    = im(DF(width), DF(height), 'transparent');

        if (densityFactor !== 1) {
            this.imObj.density(DF(72));  // 72 is the default
        }

        this.imObj.background('transparent');

        //
        // Handle background
        //

        if (options.bkgndColor || options.bkgndOutline) {
            if (options.bkgndColor) {
                this.imObj.fill(options.bkgndColor);
            }

            if (options.bkgndOutline) {
                let bkgndOutlineWidth = 1;
                if (options.bkgndOutlineWidth) {
                    bkgndOutlineWidth = options.bkgndOutlineWidth;
                }

                this.imObj.stroke(options.bkgndOutline, DF(bkgndOutlineWidth));
            }

            if (options.bkgndRounded) {
                if (options.bkgndOutline) {
                    this.imObj.drawRectangle(0, 0, DF(this.width - 1), DF(this.height - 1),
                                             DF(options.bkgndRounded), DF(options.bkgndRounded));
                } else {
                    this.imObj.drawRectangle(0, 0, DF(this.width), DF(this.height),
                                             DF(options.bkgndRounded), DF(options.bkgndRounded));
                }
            } else {
                this.imObj.drawRectangle(0, 0, DF(this.width), DF(this.height), 0, 0);
            }

            // return to transparent
            this.imObj.fill('transparent');
            this.imObj.stroke('transparent');
        }
    }

    //
    // Commands
    //

    public simpleText(x:number, y:number, textStr:string, options?:any) {
        if (options.fontSize)  {
            this.imObj.fontSize(options.fontSize);
        }

        if (options.fontFamily) {
            this.imObj.font(options.fontFamily);
        }

        if (options.fontGravity) {
            this.imObj.gravity(options.fontGravity);
        }

        if (options.fontColor) {
            this.imObj.fill(options.fontColor);
            this.imObj.stroke(options.fontColor, 1);
        }

        this.imObj.drawText(DF(x), DF(y), textStr);
        return this;
    }

    // For Pango text options, see: 
    //   http://www.pygtk.org/docs/pygtk/pango-markup-language.html
    //
    // For specifying custom arguments in node.js gm, see:
    //   https://github.com/aheckmann/gm#custom-arguments

    public text(textLines:any, tOptions:any) {
        if (!tOptions) { tOptions = {}; }

        if (tOptions.fontGravity) {
            this.imObj.in('-gravity', tOptions.fontGravity);
        }

        // Set defaults

        let size    = tOptions.fontSize   ? tOptions.fontSize   : 11;
        let weight  = tOptions.fontWeight ? tOptions.fontWeight : 'normal';
        let color   = tOptions.fontColor  ? tOptions.fontColor  : '#222';
        let family  = tOptions.fontFamily ? tOptions.fontFamily : 'sans';
        let rise    = tOptions.fontRise   ? tOptions.fontRise   : 0;

        let i, j;
        let style, text;

        let pangoStr = "";

        if (! Array.isArray(textLines) ) {
            textLines = [ textLines ];
        }

        for (i = 0; i < textLines.length; i++) {
            if (i > 0) {
                pangoStr += `\n<span size="${size * 1000 / 2.0}">\n</span>`;
            }

            if (! Array.isArray(textLines[i]) ) {
                textLines[i] = [ textLines[i] ];
            }

            for (j = 0; j < textLines[i].length; j++) {
                style = textLines[i][j].style;
                text  = textLines[i][j].text;

                if (style != null) {
                    if (style.size)   { size   = style.size;   }
                    if (style.weight) { weight = style.weight; }
                    if (style.color)  { color  = style.color;  }
                    if (style.family) { family = style.family; }
                    if (style.rise)   { rise   = style.rise;   }
                }

                /* tslint:disable */
                pangoStr += `<span size="${size * 1000}" color="${color}" weight="${weight}" font_family="${family}" rise="${rise * 10000}">${text}</span>`;
                /* tslint:enable */
            }
        }

        this.imObj.out(`pango:${pangoStr}`);
        this.imObj.out('-composite');
        return this;
    }

    //
    // Write out layer
    //

    public write() {
        let self = this;

        return new Promise( (resolve /*, reject */) => {

            if (densityFactor !== 1) {
                this.imObj.scale(densityScale, densityScale);
            }
            this.imObj.write(self.imgPath, err => {
                resolve({err : err, imgPath : self.imgPath});
            });
        });
    }

    private imagePath(layerNum:number) : string {
        let now   = (new Date()).toISOString();
        let rand  = Math.random() * 100000;

        let imgBase = path.join(this.graphic.imgDir, `${LibAbbrev}_${now}_${rand}`);
        if (layerNum === 0) {
            return `${imgBase}.${this.graphic.imgType}`;
        } else {
            return `${imgBase}-${layerNum}.${this.graphic.imgType}`;
        }
    }
}
