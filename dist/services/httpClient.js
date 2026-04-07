"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const https_1 = __importDefault(require("https"));
const tsyringe_1 = require("tsyringe");
let HttpClient = class HttpClient {
    get(url) {
        return new Promise((resolve, reject) => {
            https_1.default
                .get(url, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk.toString()));
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch {
                        reject(new Error(`Invalid JSON from ${url}`));
                    }
                });
            })
                .on("error", reject);
        });
    }
};
exports.HttpClient = HttpClient;
exports.HttpClient = HttpClient = __decorate([
    (0, tsyringe_1.injectable)()
], HttpClient);
//# sourceMappingURL=httpClient.js.map