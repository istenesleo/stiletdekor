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
      function jsxs2(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx2;
      module.exports.jsxs = jsxs2;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs2 : jsx2)(t, p, k);
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

  // .design-sync/previews/OptionRow.tsx
  var OptionRow_exports = {};
  __export(OptionRow_exports, {
    AddOns: () => AddOns,
    EdgeFinish: () => EdgeFinish
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

  // .design-sync/previews/OptionRow.tsx
  var import_jsx_runtime = __toESM(require_react_shim(), 1);
  var EdgeFinish = () => {
    const [edge, setEdge] = (0, import_react.useState)("hem");
    const options = [
      { id: "cut", label: "Méretre vágás", description: "Egyenesre vágott szél.", rate: 0, amount: 0 },
      { id: "ringli", label: "Ringli 50 cm-enként", description: "Fém fűzőlyuk a szélen, kötözéshez.", rate: 254, amount: 1524 },
      { id: "hem", label: "Szegés + ringli", description: "Megerősített, szegett szél, ringli 50 cm-enként.", rate: 445, amount: 2670 }
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { style: { display: "grid", gap: "var(--space-2)", margin: 0, padding: 0, border: 0 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { className: "sd-caps", style: { marginBottom: "var(--space-3)" }, children: "Szélkidolgozás" }),
      options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ds_exports.OptionRow,
        {
          name: "edge",
          value: o.id,
          label: o.label,
          description: o.description,
          rate: o.rate,
          rateUnit: "fm",
          amount: o.amount,
          checked: edge === o.id,
          onChange: () => setEdge(o.id)
        },
        o.id
      ))
    ] });
  };
  var AddOns = () => {
    const [contour, setContour] = (0, import_react.useState)(true);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: "var(--space-2)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ds_exports.OptionRow,
        {
          type: "checkbox",
          label: "Kontúrvágás",
          description: "A grafika körvonala mentén vágjuk.",
          rate: 2540,
          rateUnit: "m²",
          amount: 635,
          checked: contour,
          onChange: (e) => setContour(e.target.checked)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.OptionRow, { type: "checkbox", label: "Telepítés", description: "A helyszínen felszereljük.", amountText: "egyedi" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.OptionRow, { type: "checkbox", label: "UV-laminálás", description: "Most nem rendelhető.", disabled: true })
    ] });
  };
  return __toCommonJS(OptionRow_exports);
})();
