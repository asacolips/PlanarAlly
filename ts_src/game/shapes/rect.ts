import store from "../store";
import BaseRect from "./baserect";

import { ServerRect } from "../api_types";
import { GlobalPoint } from "../geom";
import { g2l } from "../units";
import { getFogColour } from "../utils";

export default class Rect extends BaseRect {
    type = "rect";
    border: string;
    constructor(topleft: GlobalPoint, w: number, h: number, fill?: string, border?: string, uuid?: string) {
        super(topleft, w, h, uuid);
        this.fill = fill || "#000";
        this.border = border || "rgba(0, 0, 0, 0)";
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            border: this.border,
        });
    }
    fromDict(data: ServerRect) {
        super.fromDict(data);
        if (data.border) this.border = data.border;
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        if (this.fill === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fill;
        const z = store.state.zoomFactor;
        const loc = g2l(this.refPoint);
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.border;
            ctx.lineWidth = 5;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
    }
}
