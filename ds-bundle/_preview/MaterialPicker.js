"use strict";
var __dsPreview = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:import.meta.env>
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      init_define_import_meta_env();
      var R = window.React;
      function np(p, k) {
        var o = {};
        for (var x in p) if (x !== "children") o[x] = p[x];
        if (k !== void 0) o.key = k;
        return o;
      }
      function jsx2(t, p, k) {
        var c = p && p.children;
        return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
      }
      function jsxs(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx2;
      module.exports.jsxs = jsxs;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs : jsx2)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // ds-raw:__ds_raw__
  var require_ds_raw = __commonJS({
    "ds-raw:__ds_raw__"(exports, module) {
      init_define_import_meta_env();
      module.exports = window.StiletUI;
    }
  });

  // .design-sync/previews/MaterialPicker.tsx
  var MaterialPicker_exports = {};
  __export(MaterialPicker_exports, {
    Banner: () => Banner,
    Board: () => Board
  });
  init_define_import_meta_env();
  var import_react = __toESM(require_react_shim(), 1);

  // ds-shim:ds
  var ds_exports = {};
  __export(ds_exports, {
    default: () => ds_default
  });
  init_define_import_meta_env();
  __reExport(ds_exports, __toESM(require_ds_raw()));
  var g = window.StiletUI;
  var ds_default = "default" in g ? g.default : g;

  // .design-sync/previews/MaterialPicker.tsx
  var import_jsx_runtime = __toESM(require_react_shim(), 1);
  var Banner = () => {
    const [material, setMaterial] = (0, import_react.useState)("standard");
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MaterialPicker,
      {
        materials: [
          {
            id: "standard",
            name: "Standard frontlit molinó",
            price: 5067,
            unit: "m2",
            texture: "frontlit",
            specs: [
              ["Súly", "440–510 g/m²"],
              ["Felhasználás", "kül- és beltér"],
              ["Élettartam", "≈ 1–3 év kültéren*"]
            ]
          },
          {
            id: "mesh",
            name: "Hálós (mesh) molinó",
            price: 5702,
            unit: "m2",
            texture: "mesh",
            specs: [
              ["Felhasználás", "kültér"],
              ["Élettartam", "≈ 1–3 év kültéren*"]
            ]
          },
          {
            id: "blockout",
            name: "Blockout molinó",
            price: 8877,
            unit: "m2",
            texture: "blockout",
            specs: [
              ["Felhasználás", "kül- és beltér"],
              ["Élettartam", "≈ 1–3 év kültéren*"]
            ]
          },
          { id: "textil", name: "Textil (zászlóanyag)", price: 6972, unit: "m2", texture: "textile", specs: [["Felhasználás", "beltér"]] }
        ],
        value: material,
        onChange: setMaterial
      }
    );
  };
  var Board = () => {
    const [material, setMaterial] = (0, import_react.useState)("dibond-3mm");
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MaterialPicker,
      {
        legend: "Lemez",
        materials: [
          { id: "pvc-3mm", name: "PVC habtábla 3 mm", price: 12687, unit: "m2", texture: "foam", specs: [["Vastagság", "3 mm"], ["Felhasználás", "beltér"]] },
          { id: "dibond-3mm", name: "Dibond (alu kompozit) 3 mm", price: 25387, unit: "m2", texture: "dibond", specs: [["Vastagság", "3 mm"], ["Felhasználás", "kül- és beltér"]] },
          { id: "plexi-3mm", name: "Plexi 3 mm", price: 31737, unit: "m2", texture: "plexi", specs: [["Vastagság", "3 mm"], ["Felhasználás", "kül- és beltér"]] }
        ],
        value: material,
        onChange: setMaterial
      }
    );
  };
  return __toCommonJS(MaterialPicker_exports);
})();
