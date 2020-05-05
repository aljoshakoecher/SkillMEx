"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var RdfElement_1 = require("../RdfElement");
var State = /** @class */ (function (_super) {
    __extends(State, _super);
    function State(iri, connectedWith) {
        var _this = _super.call(this, iri) || this;
        _this.connectedWith = connectedWith;
        return _this;
    }
    return State;
}(RdfElement_1.RdfElement));
exports.State = State;
