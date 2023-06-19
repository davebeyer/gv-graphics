let im    = require('gm').subClass({imageMagick: true});
let async = require('async');
let fs    = require('fs-extra');

import {GraphicLayer}  from './layer';

//
// Graphic wrapper class for IM/GM library
//

export class Graphic {
    layers  : GraphicLayer[];
    logger  : any;
    options : any;

    width   : number;
    height  : number;

    imgType : string;
    imgDir  : string;
    imgName : string;

    constructor(width:number, height:number, logger:any, imgDir:string, options?:any) {
        if (!options) { options = {}; }

        this.logger  = logger;
        this.options = options;

        this.width   = width;
        this.height  = height;

        this.imgType = options.imgType  ? options.imgType : 'png';
        this.imgDir  = imgDir;
        this.imgName = options.fileName ? options.fileName : null;

        // Init array with first layer
        this.layers = [];
        this.newLayer(width, height, 0, 0, options);
    }

    //
    // Valid commands: 'text', 'pango'
    //

    public simpleText(...args:any[]) {
        let func = this.curLayer()['simpleText'];
        func.apply(this.curLayer(), args);
        return this;
    }

    public text(textLines:any, tOptions:any) {
        if (!tOptions) { tOptions = {}; }

        let xOff   = tOptions.xOffset    ? tOptions.xOffset    : 0;
        let yOff   = tOptions.yOffset    ? tOptions.yOffset    : 0;
        let width  = tOptions.textWidth  ? tOptions.textWidth  : this.width;
        let height = tOptions.textHeight ? tOptions.textHeight : this.height;

        // Can extend no further than graphic bounds
        width  = Math.min(this.width  - xOff, width);
        height = Math.min(this.height - yOff, height);

        // Need to create a new layer for pango-based text (no bigger than this graphic)
        let layer = this.newLayer(width, height, xOff, yOff, tOptions);

        layer.text(textLines, tOptions);
        return this;
    }

    public write() {
        let self = this;
        let i, promises;

        return new Promise( (resolve, reject) => {
            //
            // First, write out the layer images into their own files
            //

            promises = [];
            for (i = 0; i < this.layers.length; i++) {
                promises.push(this.layers[i].write());
            }

            Promise.all(promises).then( (results:Array<any>) => {
                for (i = 0; i < results.length; i++) {
                    if (results[i].err) {
                        self.logger.error({err : results[i].err}, `Error encountered while writing image ${results[i].imgPath}`);
                    }
                }

                //
                // Then, combine the images into the base (first) layer image
                //

                if (results.length === 1) {
                    return Promise.resolve(results[0].imgPath);
                } else {
                    return self.combineLayers();
                }

            }).then( imgPath => {

                resolve(imgPath);

            }).catch( err => {
                self.logger.error({err : err}, `Error encountered while writing or merging image ${self.layers[0].imgPath}`);
                reject(err);
            });
        });
    }

    private combineLayers() {
        let self = this;
        let baseImagePath = this.layers[0].imgPath;

        // @ts-ignore: ignore unused 'index' argument
        function mergeLayer(layer:any, index:number, cb:any) {
            let imgObj = im().command('composite');

            if (layer.xOff || layer.yOff) {
                imgObj.in('-geometry', `+${layer.xOff}+${layer.yOff}`);
            } else if (layer.options.layerGravity) {
                imgObj.in('-gravity', `${layer.options.layerGravity}`);
            }

            imgObj.out(layer.imgPath);
            imgObj.out(baseImagePath);

            imgObj.write(baseImagePath, err => {
                cb(err);
            });
        }

        function mergeAllLayers() {
            return new Promise<void>( (resolve, reject) => {
                async.eachOfSeries(self.layers.slice(1), mergeLayer, err => {
                    if (err) {
                        let msg = `Error encountered while merging images into ${baseImagePath}`;
                        self.logger.error({err : err}, msg);
                        reject(msg);
                    }
                    return resolve();
                });
            });
        }

        return new Promise( (resolve, reject) => {

            mergeAllLayers().then( () => {

                // Remove the temporary images for layers > 1,
                // so start loop at 1
                let proms = [];
                let imgPath;
                for (let i = 1; i < self.layers.length; i++) {
                    imgPath = self.layers[i].imgPath;
                    proms.push(fs.remove(imgPath));
                }
                return Promise.all(proms);

            }).then( () => {

                resolve(baseImagePath);

            }).catch(err => {
                reject(err);
            });

        });
    }

    //
    // convenience methods
    //

    private newLayer(width:number, height:number, xOff:number, yOff:number, options?:any) {
        let layerNum = this.layers.length;
        let layer    = new GraphicLayer(this, layerNum, width, height, xOff, yOff, options);
        this.layers.push(layer);
        return layer;
    }

    private curLayer() {
        return this.layers[this.layers.length - 1];
    }
}
