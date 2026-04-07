"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoonPhaseProvider = void 0;
const tsyringe_1 = require("tsyringe");
const moonPhase_1 = require("../types/moonPhase");
const SYNODIC_MONTH = 29.53059;
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z");
let MoonPhaseProvider = class MoonPhaseProvider {
    getPhase(date) {
        const d = new Date(date);
        d.setHours(12, 0, 0, 0);
        const daysSinceRef = (d.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
        const cycleProgress = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
        const age = cycleProgress;
        const illumination = Math.round(((1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2) * 100);
        let phase;
        if (age < 1.85)
            phase = moonPhase_1.MoonPhase.NewMoon;
        else if (age < 7.38)
            phase = moonPhase_1.MoonPhase.WaxingCrescent;
        else if (age < 9.23)
            phase = moonPhase_1.MoonPhase.FirstQuarter;
        else if (age < 14.77)
            phase = moonPhase_1.MoonPhase.WaxingGibbous;
        else if (age < 16.61)
            phase = moonPhase_1.MoonPhase.FullMoon;
        else if (age < 22.15)
            phase = moonPhase_1.MoonPhase.WaningGibbous;
        else if (age < 23.99)
            phase = moonPhase_1.MoonPhase.LastQuarter;
        else if (age < 27.68)
            phase = moonPhase_1.MoonPhase.WaningCrescent;
        else
            phase = moonPhase_1.MoonPhase.NewMoon;
        return { phase, illumination, age: Math.round(age * 10) / 10 };
    }
    getPhasesForDays(startDate, numDays) {
        const phases = {};
        const d = new Date(startDate);
        for (let i = 0; i < numDays; i++) {
            const dateStr = d.toISOString().split("T")[0];
            phases[dateStr] = this.getPhase(d);
            d.setDate(d.getDate() + 1);
        }
        return phases;
    }
};
exports.MoonPhaseProvider = MoonPhaseProvider;
exports.MoonPhaseProvider = MoonPhaseProvider = __decorate([
    (0, tsyringe_1.injectable)()
], MoonPhaseProvider);
//# sourceMappingURL=moonPhaseProvider.js.map