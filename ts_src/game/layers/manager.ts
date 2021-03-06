import gameManager from "../manager";
import Asset from "../shapes/asset";
import Shape from "../shapes/shape";
import store from "../store";

import { GlobalPoint } from "../geom";
import { l2gx, l2gy, l2gz } from "../units";
import { GridLayer } from "./grid";
import { Layer } from "./layer";

export class LayerManager {
    layers: Layer[] = [];
    width = window.innerWidth;
    height = window.innerHeight;

    UUIDMap: Map<string, Shape> = new Map();

    // Refresh interval and redraw setter.
    interval = 30;

    constructor() {
        const lm = this;
        setInterval(() => {
            for (let i = lm.layers.length - 1; i >= 0; i--) {
                lm.layers[i].draw();
            }
        }, this.interval);
    }

    setWidth(width: number): void {
        this.width = width;
        for (const layer of this.layers) {
            layer.canvas.width = width;
            layer.width = width;
        }
    }

    setHeight(height: number): void {
        this.height = height;
        for (const layer of this.layers) {
            layer.canvas.height = height;
            layer.height = height;
        }
    }

    addLayer(layer: Layer): void {
        this.layers.push(layer);
        if (layer.selectable) store.commit("addLayer", layer.name);
    }

    hasLayer(name: string): boolean {
        return this.layers.some(l => l.name === name);
    }

    getLayer(name?: string) {
        name = name === undefined ? store.getters.selectedLayer : name;
        for (const layer of this.layers) {
            if (layer.name === name) return layer;
        }
    }

    // TODO: Rename to selectLayer
    setLayer(name: string): void {
        let found = false;
        for (const layer of this.layers) {
            if (!layer.selectable) continue;
            if (found && layer.name !== "fow") layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                store.commit("selectLayer", name);
                found = true;
            }

            layer.clearSelection();
            layer.invalidate(true);
        }
    }

    getGridLayer(): GridLayer | undefined {
        return <GridLayer>this.getLayer("grid");
    }

    hasSelection() {
        const selection = this.getSelection();
        return selection !== undefined && selection.length > 0;
    }

    // THIS INCLUDES POTENTIALLY THE SelectTool.SelectionHelper !!!
    getSelection() {
        const layer = this.getLayer();
        if (layer === undefined) return undefined;
        return layer.selection;
    }

    invalidate(): void {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].invalidate(true);
        }
    }

    invalidateLight() {
        for (let i = this.layers.length - 1; i >= 0; i--)
            if (this.layers[i].isVisionLayer) this.layers[i].invalidate(true);
    }

    dropAsset(event: DragEvent) {
        const layer = gameManager.layerManager.getLayer();
        if (layer === undefined) return;
        const image = document.createElement("img");
        image.src = event.dataTransfer.getData("text/plain");
        const asset = new Asset(
            image,
            new GlobalPoint(l2gx(event.clientX), l2gy(event.clientY)),
            l2gz(image.width),
            l2gz(image.height),
        );
        asset.src = new URL(image.src).pathname;

        if (store.state.useGrid) {
            const gs = store.state.gridSize;
            asset.refPoint.x = Math.round(asset.refPoint.x / gs) * gs;
            asset.refPoint.y = Math.round(asset.refPoint.y / gs) * gs;
            asset.w = Math.max(Math.round(asset.w / gs) * gs, gs);
            asset.h = Math.max(Math.round(asset.h / gs) * gs, gs);
        }

        layer.addShape(asset, true);
    }
}
