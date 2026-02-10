// ==UserScript==
// @name           ac-predictor-cn-ez
// @namespace      http://ac-predictor.azurewebsites.net/
// @version        2.0.12.4
// @description    ac-predictor最新完美汉化版，在 AtCoder 比赛进行中进行rating变化预测，移除了准确性低下的侧栏，并进行了美化，优化了错误处理
// @author         keymoon & Gary0
// @license        MIT
// @match          https://atcoder.jp/*
// @exclude        /^https://atcoder\.jp/[^#?]*/json/
// @supportURL     https://github.com/Gary-0925/ac-predictor-cn-ez/issues
// @grant          none
// ==/UserScript==

console.log("ac-predictor-cn-ez启动");

var config_header_text = "ac-predictor设置";
var config_hideDuringContest_label = "在赛时隐藏预测";
var config_hideUntilFixed_label = "在perf计算完成之前隐藏预测";
var config_useFinalResultOnVirtual_label = "在虚拟参赛时以真实比赛最终结果进行预测";
var config_useFinalResultOnVirtual_description = "如果启用，则会按照比赛已经结束来进行预测";
var config_dropdown = "ac-predictor设置";
var standings_performance_column_label = "perf⭐";
var standings_rate_change_column_label = "rating🏆";
var standings_click_to_compute_label = "计算";
var standings_not_provided_label = "未知";
var cnJson = {
	config_header_text: config_header_text,
	config_hideDuringContest_label: config_hideDuringContest_label,
	config_hideUntilFixed_label: config_hideUntilFixed_label,
	config_useFinalResultOnVirtual_label: config_useFinalResultOnVirtual_label,
	config_useFinalResultOnVirtual_description: config_useFinalResultOnVirtual_description,
	config_dropdown: config_dropdown,
	standings_performance_column_label: standings_performance_column_label,
	standings_rate_change_column_label: standings_rate_change_column_label,
	standings_click_to_compute_label: standings_click_to_compute_label,
	standings_not_provided_label: standings_not_provided_label
};

// should not be here
function getCurrentLanguage() {
    const elems = document.querySelectorAll("#navbar-collapse .dropdown > a");
    if (elems.length == 0)
        return "JA";
    for (let i = 0; i < elems.length; i++) {
        if (elems[i].textContent?.includes("English"))
            return "EN";
        if (elems[i].textContent?.includes("日本語"))
            return "JA";
    }
    console.warn("语言获取失败，默认切换为English");
    return "EN";
}
const language = getCurrentLanguage();
const currentJson = cnJson;
function getTranslation(label) {
    return currentJson[label];
}
function substitute(input) {
    for (const key in currentJson) {
        // @ts-ignore
        input = input.replaceAll(`{${key}}`, currentJson[key]);
    }
    return input;
}

const configKey = "ac-predictor-config";
const defaultConfig = {
    useResults: true,
    hideDuringContest: false,
    isDebug: false,
    hideUntilFixed: false,
    useFinalResultOnVirtual: false,
    compareComputations: false
};
function getConfigObj() {
    const val = localStorage.getItem(configKey) ?? "{}";
    let config;
    try {
        config = JSON.parse(val);
    }
    catch {
        console.warn("非法设置", val);
        config = {};
    }
    return { ...defaultConfig, ...config };
}
function storeConfigObj(config) {
    localStorage.setItem(configKey, JSON.stringify(config));
}
function getConfig(configKey) {
    return getConfigObj()[configKey];
}
function setConfig(key, value) {
    const config = getConfigObj();
    config[key] = value;
    storeConfigObj(config);
}

const isDebug = location.hash.includes("ac-predictor-debug") || getConfig("isDebug");
function isDebugMode() {
    return isDebug;
}

var modalHTML = "<div id=\"modal-ac-predictor-settings\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\">\n\t<div class=\"modal-dialog\" role=\"document\">\n\t<div class=\"modal-content\">\n\t\t<div class=\"modal-header\">\n\t\t\t<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">×</span></button>\n\t\t\t<h4 class=\"modal-title\">{config_header_text}</h4>\n\t\t</div>\n\t\t<div class=\"modal-body\">\n\t\t\t<div class=\"container-fluid\">\n\t\t\t\t<div class=\"settings-row\" class=\"row\">\n\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class=\"modal-footer\">\n\t\t\t<button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">关闭</button>\n\t\t</div>\n\t</div>\n</div>\n</div>";

var newDropdownElem = "<li><a id=\"ac-predictor-settings-dropdown-button\" data-toggle=\"modal\" data-target=\"#modal-ac-predictor-settings\" style=\"cursor : pointer;\"><i class=\"a-icon a-icon-setting\"></i> {config_dropdown}</a></li>\n";

var legacyDropdownElem = "<li><a id=\"ac-predictor-settings-dropdown-button\" data-toggle=\"modal\" data-target=\"#modal-ac-predictor-settings\" style=\"cursor : pointer;\"><span class=\"glyphicon glyphicon-wrench\" aria-hidden=\"true\"></span> {config_dropdown}</a></li>\n";

class ConfigView {
    modalElement;
    constructor(modalElement) {
        this.modalElement = modalElement;
    }
    addCheckbox(label, val, description, handler) {
        const settingsRow = this.getSettingsRow();
        const div = document.createElement("div");
        div.classList.add("checkbox");
        const labelElem = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = val;
        labelElem.append(input);
        labelElem.append(label);
        if (description) {
            const descriptionDiv = document.createElement("div");
            descriptionDiv.append(description);
            descriptionDiv.classList.add("small");
            descriptionDiv.classList.add("gray");
            labelElem.append(descriptionDiv);
        }
        div.append(labelElem);
        settingsRow.append(div);
        input.addEventListener("change", () => {
            handler(input.checked);
        });
    }
    addHeader(level, content) {
        const settingsRow = this.getSettingsRow();
        const div = document.createElement(`h${level}`);
        div.textContent = content;
        settingsRow.append(div);
    }
    getSettingsRow() {
        return this.modalElement.querySelector(".settings-row");
    }
    static Create() {
        document.querySelector("body")?.insertAdjacentHTML("afterbegin", substitute(modalHTML));
        document.querySelector(".header-mypage_list li:nth-last-child(1)")?.insertAdjacentHTML("beforebegin", substitute(newDropdownElem));
        document.querySelector(".navbar-right .dropdown-menu .divider:nth-last-child(2)")?.insertAdjacentHTML("beforebegin", substitute(legacyDropdownElem));
        const element = document.querySelector("#modal-ac-predictor-settings");
        if (element === null) {
            throw new Error("设置模态框未找到");
        }
        return new ConfigView(element);
    }
}

class ConfigController {
    register() {
        const configView = ConfigView.Create();
        // TODO: 流石に処理をまとめたい
        configView.addCheckbox(getTranslation("config_useFinalResultOnVirtual_label"), getConfig("useFinalResultOnVirtual"), getTranslation("config_useFinalResultOnVirtual_description"), val => setConfig("useFinalResultOnVirtual", val));
        configView.addCheckbox(getTranslation("config_hideDuringContest_label"), getConfig("hideDuringContest"), null, val => setConfig("hideDuringContest", val));
        configView.addCheckbox(getTranslation("config_hideUntilFixed_label"), getConfig("hideUntilFixed"), null, val => setConfig("hideUntilFixed", val));
        if (isDebugMode()) {
            configView.addCheckbox("[DEBUG] enable debug mode", getConfig("isDebug"), null, val => setConfig("isDebug", val));
            configView.addCheckbox("[DEBUG] use results", getConfig("useResults"), null, val => setConfig("useResults", val));
            configView.addCheckbox("[DEBUG] compare", getConfig("compareComputations"), null, val => setConfig("compareComputations", val));
        }
    }
}

async function getAPerfs(contestScreenName) {
    const result = await fetch(`https://data.ac-predictor.com/aperfs/${contestScreenName}.json`);
    if (!result.ok) {
        throw new Error(`aperfs获取失败: ${result.status}`);
    }
    return await result.json();
}

// [start, end]
class Range {
    start;
    end;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    contains(val) {
        return this.start <= val && val <= this.end;
    }
    hasValue() {
        return this.start <= this.end;
    }
}

class ContestDetails {
    contestName;
    contestScreenName;
    contestType;
    startTime;
    duration;
    ratedrange;
    constructor(contestName, contestScreenName, contestType, startTime, duration, ratedRange) {
        this.contestName = contestName;
        this.contestScreenName = contestScreenName;
        this.contestType = contestType;
        this.startTime = startTime;
        this.duration = duration;
        this.ratedrange = ratedRange;
    }
    get endTime() {
        return new Date(this.startTime.getTime() + this.duration * 1000);
    }
    get defaultAPerf() {
        if (this.contestType == "heuristic") {
            return 1000;
        }
        else { // algo
            if (!this.ratedrange.hasValue()) {
                throw new Error("unrated比赛");
            }
            if (!this.ratedrange.contains(0)) {
                return 0; // value is not relevant as it is never used
            }
            // ref: https://atcoder.jp/posts/1591
            const DEFAULT_CHANGED_TO_1200 = new Date("2025-11-01");
            if (DEFAULT_CHANGED_TO_1200 < this.startTime) {
                return 1200;
            }
            // TODO: find default value; it should have changed when the new ABC was introduced
            // const FIRST_DEFAULT_CHANGES = new Date("2019-05-25");
            // if (FIRST_DEFAULT_CHANGES < this.startTime) { ... }
            // ref: AtCoder Rating System ver. 1.00
            // APerf of newcomers are set to Center, where Center = 1200 for AGC,
            // Center = 1000 for ARC and Center = 800 for ABC
            // old ABC
            if (this.ratedrange.end == 1199) {
                return 800;
            }
            // new ABC
            if (this.ratedrange.end == 1999) {
                return 800;
            }
            // ARC
            if (this.ratedrange.end == 2799) {
                return 1000;
            }
            // AGC
            return 1200;
        }
    }
    get performanceCap() {
        if (this.contestType == "heuristic")
            return Infinity;
        if (!this.ratedrange.hasValue()) {
            throw new Error("unrated比赛");
        }
        if (4000 <= this.ratedrange.end)
            return Infinity;
        return this.ratedrange.end + 1 + 400;
    }
    beforeContest(dateTime) {
        return dateTime < this.startTime;
    }
    duringContest(dateTime) {
        return this.startTime < dateTime && dateTime < this.endTime;
    }
    isOver(dateTime) {
        return this.endTime < dateTime;
    }
}

async function getContestDetails() {
    const result = await fetch(`https://data.ac-predictor.com/contest-details.json`);
    if (!result.ok) {
        throw new Error(`比赛信息获取失败: ${result.status}`);
    }
    const parsed = await result.json();
    const res = [];
    for (const elem of parsed) {
        if (typeof elem !== "object")
            throw new Error("非法元素");
        if (typeof elem.contestName !== "string")
            throw new Error("非法元素");
        const contestName = elem.contestName;
        if (typeof elem.contestScreenName !== "string")
            throw new Error("非法元素");
        const contestScreenName = elem.contestScreenName;
        if (elem.contestType !== "algorithm" && elem.contestType !== "heuristic")
            throw new Error("非法元素");
        const contestType = elem.contestType;
        if (typeof elem.startTime !== "number")
            throw new Error("非法元素");
        const startTime = new Date(elem.startTime * 1000);
        if (typeof elem.duration !== "number")
            throw new Error("非法元素");
        const duration = elem.duration;
        if (typeof elem.ratedrange !== "object" || typeof elem.ratedrange[0] !== "number" || typeof elem.ratedrange[1] !== "number")
            throw new Error("非法元素");
        const ratedRange = new Range(elem.ratedrange[0], elem.ratedrange[1]);
        res.push(new ContestDetails(contestName, contestScreenName, contestType, startTime, duration, ratedRange));
    }
    return res;
}

class Cache {
    cacheDuration;
    cacheExpires = new Map();
    cacheData = new Map();
    constructor(cacheDuration) {
        this.cacheDuration = cacheDuration;
    }
    has(key) {
        return this.cacheExpires.has(key) || Date.now() <= this.cacheExpires.get(key);
    }
    set(key, content) {
        const expire = Date.now() + this.cacheDuration;
        this.cacheExpires.set(key, expire);
        this.cacheData.set(key, content);
    }
    get(key) {
        if (!this.has(key)) {
            throw new Error(`非法钥: ${key}`);
        }
        return this.cacheData.get(key);
    }
}

const handlers = [];
function addHandler(handler) {
    handlers.push(handler);
}
// absurd hack to steal ajax response data for caching
// @ts-ignore
$(document).on("ajaxComplete", (_, xhr, settings) => {
    if (xhr.status == 200) {
        for (const handler of handlers) {
            handler(xhr.responseText, settings.url);
        }
    }
});

let StandingsWrapper$2 = class StandingsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRanks(onlyRated = false, contestType = "algorithm") {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            if (onlyRated && !this.isRated(data, contestType))
                continue;
            const userScreenName = typeof (data.Additional["standings.extendedContestRank"]) == "undefined" ? `extended:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, data.Rank);
        }
        return res;
    }
    toRatedUsers(contestType) {
        const res = [];
        for (const data of this.data.StandingsData) {
            if (this.isRated(data, contestType)) {
                res.push(data.UserScreenName);
            }
        }
        return res;
    }
    toScores() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            const userScreenName = typeof (data.Additional["standings.extendedContestRank"]) == "undefined" ? `extended:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, { score: data.TotalResult.Score, penalty: data.TotalResult.Elapsed });
        }
        return res;
    }
    isRated(data, contestType) {
        if (contestType === "algorithm") {
            return data.IsRated && typeof (data.Additional["standings.extendedContestRank"]) != "undefined";
        }
        else {
            return data.IsRated && typeof (data.Additional["standings.extendedContestRank"]) != "undefined" && data.TotalResult.Count !== 0;
        }
    }
};
const STANDINGS_CACHE_DURATION$2 = 10 * 1000;
const cache$4 = new Cache(STANDINGS_CACHE_DURATION$2);
async function getExtendedStandings(contestScreenName) {
    if (!cache$4.has(contestScreenName)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/standings/extended/json`);
        if (!result.ok) {
            throw new Error(`扩展排行榜获取失败: ${result.status}`);
        }
        cache$4.set(contestScreenName, await result.json());
    }
    return new StandingsWrapper$2(cache$4.get(contestScreenName));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/standings\/extended\/json$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    cache$4.set(contestScreenName, JSON.parse(content));
});

class EloPerformanceProvider {
    ranks;
    ratings;
    cap;
    rankMemo = new Map();
    constructor(ranks, ratings, cap) {
        this.ranks = ranks;
        this.ratings = ratings;
        this.cap = cap;
    }
    availableFor(userScreenName) {
        return this.ranks.has(userScreenName);
    }
    getPerformance(userScreenName) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`用户${userScreenName}未找到`);
        }
        const rank = this.ranks.get(userScreenName);
        return this.getPerformanceForRank(rank);
    }
    getPerformances() {
        const performances = new Map();
        for (const userScreenName of this.ranks.keys()) {
            performances.set(userScreenName, this.getPerformance(userScreenName));
        }
        return performances;
    }
    getPerformanceForRank(rank) {
        let upper = 6144;
        let lower = -2048;
        while (upper - lower > 0.5) {
            const mid = (upper + lower) / 2;
            if (rank > this.getRankForPerformance(mid))
                upper = mid;
            else
                lower = mid;
        }
        return Math.min(this.cap, Math.round((upper + lower) / 2));
    }
    getRankForPerformance(performance) {
        if (this.rankMemo.has(performance))
            return this.rankMemo.get(performance);
        const res = this.ratings.reduce((val, APerf) => val + 1.0 / (1.0 + Math.pow(6.0, (performance - APerf) / 400.0)), 0.5);
        this.rankMemo.set(performance, res);
        return res;
    }
}

function getRankToUsers(ranks) {
    const rankToUsers = new Map();
    for (const [userScreenName, rank] of ranks) {
        if (!rankToUsers.has(rank))
            rankToUsers.set(rank, []);
        rankToUsers.get(rank).push(userScreenName);
    }
    return rankToUsers;
}
function getMaxRank(ranks) {
    return Math.max(...ranks.values());
}
class InterpolatePerformanceProvider {
    ranks;
    maxRank;
    rankToUsers;
    baseProvider;
    constructor(ranks, baseProvider) {
        this.ranks = ranks;
        this.maxRank = getMaxRank(ranks);
        this.rankToUsers = getRankToUsers(ranks);
        this.baseProvider = baseProvider;
    }
    availableFor(userScreenName) {
        return this.ranks.has(userScreenName);
    }
    getPerformance(userScreenName) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`用户${userScreenName}未找到`);
        }
        if (this.performanceCache.has(userScreenName))
            return this.performanceCache.get(userScreenName);
        let rank = this.ranks.get(userScreenName);
        while (rank <= this.maxRank) {
            const perf = this.getPerformanceIfAvailable(rank);
            if (perf !== null) {
                return perf;
            }
            rank++;
        }
        this.performanceCache.set(userScreenName, -Infinity);
        return -Infinity;
    }
    performanceCache = new Map();
    getPerformances() {
        let currentPerformance = -Infinity;
        const res = new Map();
        for (let rank = this.maxRank; rank >= 0; rank--) {
            const users = this.rankToUsers.get(rank);
            if (users === undefined)
                continue;
            const perf = this.getPerformanceIfAvailable(rank);
            if (perf !== null)
                currentPerformance = perf;
            for (const userScreenName of users) {
                res.set(userScreenName, currentPerformance);
            }
        }
        this.performanceCache = res;
        return res;
    }
    cacheForRank = new Map();
    getPerformanceIfAvailable(rank) {
        if (!this.rankToUsers.has(rank))
            return null;
        if (this.cacheForRank.has(rank))
            return this.cacheForRank.get(rank);
        for (const userScreenName of this.rankToUsers.get(rank)) {
            if (!this.baseProvider.availableFor(userScreenName))
                continue;
            const perf = this.baseProvider.getPerformance(userScreenName);
            this.cacheForRank.set(rank, perf);
            return perf;
        }
        return null;
    }
}

function normalizeRank(ranks) {
    const rankValues = [...new Set(ranks.values()).values()];
    const rankToUsers = new Map();
    for (const [userScreenName, rank] of ranks) {
        if (!rankToUsers.has(rank))
            rankToUsers.set(rank, []);
        rankToUsers.get(rank).push(userScreenName);
    }
    rankValues.sort((a, b) => a - b);
    const res = new Map();
    let currentRank = 1;
    for (const rank of rankValues) {
        const users = rankToUsers.get(rank);
        const averageRank = currentRank + (users.length - 1) / 2;
        for (const userScreenName of users) {
            res.set(userScreenName, averageRank);
        }
        currentRank += users.length;
    }
    return res;
}

//Copyright © 2017 koba-e964.
//from : https://github.com/koba-e964/atcoder-rating-estimator
const finf = bigf(400);
function bigf(n) {
    let pow1 = 1;
    let pow2 = 1;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; ++i) {
        pow1 *= 0.81;
        pow2 *= 0.9;
        numerator += pow1;
        denominator += pow2;
    }
    return Math.sqrt(numerator) / denominator;
}
function f(n) {
    return ((bigf(n) - finf) / (bigf(1) - finf)) * 1200.0;
}
/**
 * calculate unpositivized rating from performance history
 * @param {Number[]} [history] performance history with ascending order
 * @returns {Number} unpositivized rating
 */
function calcAlgRatingFromHistory(history) {
    const n = history.length;
    let pow = 1;
    let numerator = 0.0;
    let denominator = 0.0;
    for (let i = n - 1; i >= 0; i--) {
        pow *= 0.9;
        numerator += Math.pow(2, history[i] / 800.0) * pow;
        denominator += pow;
    }
    return Math.log2(numerator / denominator) * 800.0 - f(n);
}
/**
 * calculate unpositivized rating from last state
 * @param {Number} [last] last unpositivized rating
 * @param {Number} [perf] performance
 * @param {Number} [ratedMatches] count of participated rated contest
 * @returns {number} estimated unpositivized rating
 */
function calcAlgRatingFromLast(last, perf, ratedMatches) {
    if (ratedMatches === 0)
        return perf - 1200;
    last += f(ratedMatches);
    const weight = 9 - 9 * 0.9 ** ratedMatches;
    const numerator = weight * 2 ** (last / 800.0) + 2 ** (perf / 800.0);
    const denominator = 1 + weight;
    return Math.log2(numerator / denominator) * 800.0 - f(ratedMatches + 1);
}
/**
 * calculate the performance required to reach a target rate
 * @param {Number} [targetRating] targeted unpositivized rating
 * @param {Number[]} [history] performance history with ascending order
 * @returns {number} performance
 */
function calcRequiredPerformance(targetRating, history) {
    let valid = 10000.0;
    let invalid = -10000.0;
    for (let i = 0; i < 100; ++i) {
        const mid = (invalid + valid) / 2;
        const rating = Math.round(calcAlgRatingFromHistory(history.concat([mid])));
        if (targetRating <= rating)
            valid = mid;
        else
            invalid = mid;
    }
    return valid;
}
/**
 * Gets the weight used in the heuristic rating calculation
 * based on its start and end dates
 * @param {Date} startAt - The start date of the contest.
 * @param {Date} endAt - The end date of the contest.
 * @returns {number} The weight of the contest.
 */
function getWeight(startAt, endAt) {
    const isShortContest = endAt.getTime() - startAt.getTime() < 24 * 60 * 60 * 1000;
    if (endAt < new Date("2025-01-01T00:00:00+09:00")) {
        return 1;
    }
    return isShortContest ? 0.5 : 1;
}
/**
 * calculate unpositivized rating from performance history
 * @param {RatingMaterial[]} [history] performance histories
 * @returns {Number} unpositivized rating
 */
function calcHeuristicRatingFromHistory(history) {
    const S = 724.4744301;
    const R = 0.8271973364;
    const qs = [];
    for (const material of history) {
        const adjustedPerformance = material.Performance + 150 - 100 * material.DaysFromLatestContest / 365;
        for (let i = 1; i <= 100; i++) {
            qs.push({ q: adjustedPerformance - S * Math.log(i), weight: material.Weight });
        }
    }
    qs.sort((a, b) => b.q - a.q);
    let r = 0.0;
    let s = 0.0;
    for (const { q, weight } of qs) {
        s += weight;
        r += q * (R ** (s - weight) - R ** s);
    }
    return r;
}
/**
 * (-inf, inf) -> (0, inf)
 * @param {Number} [rating] unpositivized rating
 * @returns {number} positivized rating
 */
function positivizeRating(rating) {
    if (rating >= 400.0) {
        return rating;
    }
    return 400.0 * Math.exp((rating - 400.0) / 400.0);
}
/**
 * (0, inf) -> (-inf, inf)
 * @param {Number} [rating] positivized rating
 * @returns {number} unpositivized rating
 */
function unpositivizeRating(rating) {
    if (rating >= 400.0) {
        return rating;
    }
    return 400.0 + 400.0 * Math.log(rating / 400.0);
}
const colorNames = ["unrated", "gray", "brown", "green", "cyan", "blue", "yellow", "orange", "red"];
function getColor(rating) {
    const colorIndex = rating > 0 ? Math.min(Math.floor(rating / 400) + 1, 8) : 0;
    return colorNames[colorIndex];
}

const PATH_PREFIX = "/contests/";
function getContestScreenName() {
    const location = document.location.pathname;
    if (!location.startsWith(PATH_PREFIX)) {
        throw Error("not on the contest page");
    }
    return location.substring(PATH_PREFIX.length).split("/")[0];
}

function hasOwnProperty(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

class StandingsLoadingView {
    element;
    pendingHooks;
    constructor(element) {
        this.element = element;
        this.pendingHooks = [];
        new MutationObserver(() => this.resolveHooksIfPossible()).observe(this.element, { attributes: true });
    }
    onLoad(hook) {
        if (this.isStandingsLoaded()) {
            hook();
        }
        else {
            this.pendingHooks.push(hook);
        }
    }
    resolveHooksIfPossible() {
        if (this.pendingHooks.length === 0)
            return;
        if (!this.isStandingsLoaded())
            return;
        const hooks = this.pendingHooks;
        this.pendingHooks = [];
        hooks.forEach(f => f());
    }
    ;
    isStandingsLoaded() {
        return this.element.style.display === "none";
    }
    static Get() {
        const loadingElem = document.querySelector("#vue-standings .loading-show");
        if (loadingElem === null) {
            throw new Error("加载框未找到");
        }
        return new StandingsLoadingView(loadingElem);
    }
}

function toSignedString (n) {
    return `${n >= 0 ? "+" : "-"}${Math.abs(n)}`;
}

function addStyle(styleSheet) {
    const styleElem = document.createElement("style");
    styleElem.textContent = styleSheet;
    document.getElementsByTagName("head")[0].append(styleElem);
}

function getSpan(innerElements, classList) {
    const span = document.createElement("span");
    span.append(...innerElements);
    span.classList.add(...classList);
    return span;
}

function getRatingSpan(rate) {
    return getSpan([rate.toString()], ["bold", "user-" + getColor(rate)]);
}

var style = "/* Tooltip container */\n.my-tooltip {\n  position: relative;\n  display: inline-block;\n}\n\n/* Tooltip text */\n.my-tooltip .my-tooltiptext {\n  visibility: hidden;\n  width: 120px;\n  background-color: black;\n  color: #fff;\n  text-align: center;\n  padding: 5px 0;\n  border-radius: 6px;\n  /* Position the tooltip text - see examples below! */\n  position: absolute;\n  top: 50%;\n  right: 100%;\n  z-index: 1;\n}\n\n/* Show the tooltip text when you mouse over the tooltip container */\n.my-tooltip:hover .my-tooltiptext {\n  visibility: visible;\n}";

addStyle(style);
function getFadedSpan(innerElements) {
    return getSpan(innerElements, ["grey"]);
}
function getRatedRatingElem(result) {
    const elem = document.createElement("div");
    if (result.oldRating != result.newRating) {
        elem.style = "display: flex; gap: 1px; justify-content: center; align-items: center;";
        elem.append(getRatingSpan(result.oldRating));
        if (result.oldRating < result.newRating) elem.innerHTML += `<div><small class="grey">${toSignedString(result.newRating - result.oldRating)}</small><div style="transform: translateY(-35%);"><big class="grey">↗</big></div></div>`;
        else elem.innerHTML += `<div><small class="grey">${toSignedString(result.newRating - result.oldRating)}</small><div style="transform: translateY(-35%);"><big class="grey">↘</big></div></div>`;
        elem.append(getRatingSpan(result.newRating));
    }
    else elem.append(getRatingSpan(result.oldRating), " ", getFadedSpan("±0"));
    /*if (result.oldRating < result.newRating)
        elem.append(getRatingSpan(result.oldRating), " ↗ ", getRatingSpan(result.newRating), " ", getFadedSpan([`(${toSignedString(result.newRating - result.oldRating)})`]));
    else if (result.oldRating > result.newRating)
        elem.append(getRatingSpan(result.oldRating), " ↘ ", getRatingSpan(result.newRating), " ", getFadedSpan([`(${toSignedString(result.newRating - result.oldRating)})`]));
    else elem.append(getRatingSpan(result.oldRating), " ", getFadedSpan([`(${toSignedString(result.newRating - result.oldRating)})`]));*/
    return elem;
}
function getUnratedRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getRatingSpan(result.oldRating), " ", getFadedSpan(["(unrated)"]));
    return elem;
}
function getDefferedRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getRatingSpan(result.oldRating), " → ", getSpan(["???"], ["bold"]), document.createElement("br"), getFadedSpan([`(${getTranslation("standings_click_to_compute_label")})`]));
    async function listener() {
        elem.removeEventListener("click", listener);
        elem.replaceChildren(getFadedSpan(["加载中..."]));
        let newRating;
        try {
            newRating = await result.newRatingCalculator();
        }
        catch (e) {
            elem.append(getSpan(["加载失败"], []), document.createElement("br"), getSpan(["(悬停以查看更多)"], ["grey", "small"]), getSpan([e.toString()], ["my-tooltiptext"]));
            elem.classList.add("my-tooltip");
            return;
        }
        const newElem = getRatedRatingElem({ type: "rated", performance: result.performance, oldRating: result.oldRating, newRating: newRating });
        elem.replaceChildren(newElem);
    }
    elem.addEventListener("click", listener);
    return elem;
}
function getPerfOnlyRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getFadedSpan([`(${getTranslation("standings_not_provided_label")})`]));
    return elem;
}
function getErrorRatingElem(result) {
    const elem = document.createElement("div");
    elem.append(getSpan(["加载失败"], []), document.createElement("br"), getSpan(["(悬停以查看更多)"], ["grey", "small"]), getSpan([result.message], ["my-tooltiptext"]));
    elem.classList.add("my-tooltip");
    return elem;
}
function getRatingElem(result) {
    if (result.type == "rated")
        return getRatedRatingElem(result);
    if (result.type == "unrated")
        return getUnratedRatingElem(result);
    if (result.type == "deffered")
        return getDefferedRatingElem(result);
    if (result.type == "perfonly")
        return getPerfOnlyRatingElem();
    if (result.type == "error")
        return getErrorRatingElem(result);
    throw new Error("unreachable");
}
function getPerfElem(result) {
    if (result.type == "error")
        return getSpan(["-"], []);
    return getRatingSpan(result.performance);
}
const headerHtml = `<th class="ac-predictor-standings-elem" style="width:84px;min-width:84px;">${getTranslation("standings_performance_column_label")}</th><th class="ac-predictor-standings-elem" style="width:168px;min-width:168px;">${getTranslation("standings_rate_change_column_label")}</th>`;
function modifyHeader(header) {
    header.insertAdjacentHTML("beforeend", headerHtml);
}
function isFooter(row) {
    return row.firstElementChild?.classList.contains("colspan");
}
async function modifyStandingsRow(row, results) {
    const rankText = row.children[0].textContent;
    const usernameSpan = row.querySelector(".standings-username .username span");
    let userScreenName = usernameSpan?.textContent ?? null;
    // unratedかつ順位が未表示ならば参加者でない、というヒューリスティック（お気に入り順位表でのエラー解消用）
    if (usernameSpan?.className === "user-unrated" && rankText === "-") {
        userScreenName = null;
    }
    // TODO: この辺のロジックがここにあるの嫌だね……
    if (userScreenName !== null && row.querySelector(".standings-username .username img[src='//img.atcoder.jp/assets/icon/ghost.svg']")) {
        userScreenName = `ghost:${userScreenName}`;
    }
    if (userScreenName !== null && row.classList.contains("info") && 3 <= row.children.length && row.children[2].textContent == "-") {
        // 延長線順位表用
        userScreenName = `extended:${userScreenName}`;
    }
    const perfCell = document.createElement("td");
    perfCell.classList.add("ac-predictor-standings-elem", "standings-result");
    const ratingCell = document.createElement("td");
    ratingCell.classList.add("ac-predictor-standings-elem", "standings-result");
    if (userScreenName === null) {
        perfCell.append("-");
        ratingCell.append("-");
    }
    else {
        const result = await results(userScreenName);
        perfCell.append(getPerfElem(result));
        ratingCell.append(getRatingElem(result));
    }
    row.insertAdjacentElement("beforeend", perfCell);
    row.insertAdjacentElement("beforeend", ratingCell);
}
function modifyFooter(footer) {
    footer.insertAdjacentHTML("beforeend", '<td class="ac-predictor-standings-elem" colspan="2">-</td>');
}
class StandingsTableView {
    element;
    provider;
    refreshHooks = [];
    constructor(element, resultDataProvider) {
        this.element = element;
        this.provider = resultDataProvider;
        this.initHandler();
    }
    onRefreshed(hook) {
        this.refreshHooks.push(hook);
    }
    update() {
        this.removeOldElement();
        const header = this.element.querySelector("thead tr");
        if (!header)
            console.warn("头部元素未找到", this.element);
        else
            modifyHeader(header);
        this.element.querySelectorAll("tbody tr").forEach((row) => {
            if (isFooter(row))
                modifyFooter(row);
            else
                modifyStandingsRow(row, this.provider);
        });
    }
    removeOldElement() {
        this.element.querySelectorAll(".ac-predictor-standings-elem").forEach((elem) => elem.remove());
    }
    initHandler() {
        new MutationObserver(() => this.update()).observe(this.element.tBodies[0], {
            childList: true,
        });
        const statsRow = this.element.querySelector(".standings-statistics");
        if (statsRow === null) {
            throw new Error("状态行未找到");
        }
        const acElems = statsRow.querySelectorAll(".standings-ac");
        const refreshObserver = new MutationObserver((records) => {
            if (isDebugMode())
                console.log("fire refreshHooks", records);
            this.refreshHooks.forEach(f => f());
        });
        acElems.forEach(elem => refreshObserver.observe(elem, { childList: true }));
    }
    static Get(resultDataProvider) {
        const tableElem = document.querySelector(".table-responsive table");
        return new StandingsTableView(tableElem, resultDataProvider);
    }
}

class ExtendedStandingsPageController {
    contestDetails;
    performanceProvider;
    standingsTableView;
    async register() {
        const loading = StandingsLoadingView.Get();
        loading.onLoad(() => this.initialize());
    }
    async initialize() {
        const contestScreenName = getContestScreenName();
        const contestDetailsList = await getContestDetails();
        const contestDetails = contestDetailsList.find(details => details.contestScreenName == contestScreenName);
        if (contestDetails === undefined) {
            throw new Error("比赛信息缺失");
        }
        this.contestDetails = contestDetails;
        this.standingsTableView = StandingsTableView.Get(async (userScreenName) => {
            if (!this.performanceProvider)
                return { "type": "error", "message": "perf获取器缺失" };
            if (!this.performanceProvider.availableFor(userScreenName))
                return { "type": "error", "message": `${userScreenName}的perf不可用` };
            const originalPerformance = this.performanceProvider.getPerformance(userScreenName);
            const positivizedPerformance = Math.round(positivizeRating(originalPerformance));
            return { type: "perfonly", performance: positivizedPerformance };
        });
        this.standingsTableView.onRefreshed(async () => {
            await this.updateData();
            this.standingsTableView.update();
        });
        await this.updateData();
        this.standingsTableView.update();
    }
    async updateData() {
        if (!this.contestDetails)
            throw new Error("比赛信息缺失");
        const extendedStandings = await getExtendedStandings(this.contestDetails.contestScreenName);
        const aperfsObj = await getAPerfs(this.contestDetails.contestScreenName);
        const defaultAPerf = this.contestDetails.defaultAPerf;
        const normalizedRanks = normalizeRank(extendedStandings.toRanks(true, this.contestDetails.contestType));
        const aperfsList = extendedStandings.toRatedUsers(this.contestDetails.contestType).map(userScreenName => hasOwnProperty(aperfsObj, userScreenName) ? aperfsObj[userScreenName] : defaultAPerf);
        const basePerformanceProvider = new EloPerformanceProvider(normalizedRanks, aperfsList, this.contestDetails.performanceCap);
        const ranks = extendedStandings.toRanks();
        this.performanceProvider = new InterpolatePerformanceProvider(ranks, basePerformanceProvider);
    }
}

class HistoriesWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRatingMaterials(latestContestDate, contestDurationSecondProvider) {
        const toUtcDate = (date) => Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
        const results = [];
        for (const history of this.data) {
            if (!history.IsRated)
                continue;
            const endTime = new Date(history.EndTime);
            const startTime = new Date(endTime.getTime() - contestDurationSecondProvider(history.ContestScreenName) * 1000);
            results.push({
                Performance: history.Performance,
                Weight: getWeight(startTime, endTime),
                DaysFromLatestContest: toUtcDate(latestContestDate) - toUtcDate(endTime),
            });
        }
        return results;
    }
}
const HISTORY_CACHE_DURATION = 60 * 60 * 1000;
const cache$3 = new Cache(HISTORY_CACHE_DURATION);
async function getHistory(userScreenName, contestType = "algorithm") {
    const key = `${userScreenName}:${contestType}`;
    if (!cache$3.has(key)) {
        const result = await fetch(`https://atcoder.jp/users/${userScreenName}/history/json?contestType=${contestType}`);
        if (!result.ok) {
            throw new Error(`历史记录获取失败: ${result.status}`);
        }
        cache$3.set(key, await result.json());
    }
    return new HistoriesWrapper(cache$3.get(key));
}

// @ts-nocheck
var dom$1 = "<div id=\"estimator-alert\"></div>\n<div class=\"row\">\n\t<div class=\"input-group\">\n\t\t<span class=\"input-group-addon\" id=\"estimator-input-desc\"></span>\n\t\t<input type=\"number\" class=\"form-control\" id=\"estimator-input\">\n\t</div>\n</div>\n<div class=\"row\">\n\t<div class=\"input-group\">\n\t\t<span class=\"input-group-addon\" id=\"estimator-res-desc\"></span>\n\t\t<input class=\"form-control\" id=\"estimator-res\" disabled=\"disabled\">\n\t\t<span class=\"input-group-btn\">\n\t\t\t<button class=\"btn btn-default\" id=\"estimator-toggle\">入替</button>\n\t\t</span>\n\t</div>\n</div>\n<div class=\"row\" style=\"margin: 10px 0px;\">\n\t<a class=\"btn btn-default col-xs-offset-8 col-xs-4\" rel=\"nofollow\" onclick=\"window.open(encodeURI(decodeURI(this.href)),'twwindow','width=550, height=450, personalbar=0, toolbar=0, scrollbars=1'); return false;\" id=\"estimator-tweet\">ツイート</a>\n</div>";
class EstimatorModel {
    inputDesc;
    resultDesc;
    perfHistory;
    constructor(inputValue, perfHistory) {
        this.inputDesc = "";
        this.resultDesc = "";
        this.perfHistory = perfHistory;
        this.updateInput(inputValue);
    }
    inputValue;
    resultValue;
    updateInput(value) {
        this.inputValue = value;
        this.resultValue = this.calcResult(value);
    }
    toggle() {
        return null;
    }
    calcResult(input) {
        return input;
    }
}
class CalcRatingModel extends EstimatorModel {
    constructor(inputValue, perfHistory) {
        super(inputValue, perfHistory);
        this.inputDesc = "パフォーマンス";
        this.resultDesc = "到達レーティング";
    }
    // @ts-ignore
    toggle() {
        return new CalcPerfModel(this.resultValue, this.perfHistory);
    }
    calcResult(input) {
        return positivizeRating(calcAlgRatingFromHistory(this.perfHistory.concat([input])));
    }
}
class CalcPerfModel extends EstimatorModel {
    constructor(inputValue, perfHistory) {
        super(inputValue, perfHistory);
        this.inputDesc = "目標レーティング";
        this.resultDesc = "必要パフォーマンス";
    }
    // @ts-ignore
    toggle() {
        return new CalcRatingModel(this.resultValue, this.perfHistory);
    }
    calcResult(input) {
        return calcRequiredPerformance(unpositivizeRating(input), this.perfHistory);
    }
}
function GetEmbedTweetLink(content, url) {
    return `https://twitter.com/share?text=${encodeURI(content)}&url=${encodeURI(url)}`;
}
function getLS(key) {
    const val = localStorage.getItem(key);
    return (val ? JSON.parse(val) : val);
}
function setLS(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    }
    catch (error) {
        console.log(error);
    }
}
const models = [CalcPerfModel, CalcRatingModel];
function GetModelFromStateCode(state, value, history) {
    let model = models.find((model) => model.name === state);
    if (!model)
        model = CalcPerfModel;
    return new model(value, history);
}
function getPerformanceHistories(history) {
    const onlyRated = history.filter((x) => x.IsRated);
    onlyRated.sort((a, b) => {
        return new Date(a.EndTime).getTime() - new Date(b.EndTime).getTime();
    });
    return onlyRated.map((x) => x.Performance);
}
function roundValue(value, numDigits) {
    return Math.round(value * Math.pow(10, numDigits)) / Math.pow(10, numDigits);
}
class EstimatorElement {
    id;
    title;
    document;
    constructor() {
        this.id = "estimator";
        this.title = "Estimator";
        this.document = dom$1;
    }
    async afterOpen() {
        const estimatorInputSelector = document.getElementById("estimator-input");
        const estimatorResultSelector = document.getElementById("estimator-res");
        let model = GetModelFromStateCode(getLS("sidemenu_estimator_state"), getLS("sidemenu_estimator_value"), getPerformanceHistories((await getHistory(userScreenName)).data));
        updateView();
        document.getElementById("estimator-toggle").addEventListener("click", () => {
            model = model.toggle();
            updateLocalStorage();
            updateView();
        });
        estimatorInputSelector.addEventListener("keyup", () => {
            updateModel();
            updateLocalStorage();
            updateView();
        });
        /** modelをinputの値に応じて更新 */
        function updateModel() {
            const inputNumber = estimatorInputSelector.valueAsNumber;
            if (!isFinite(inputNumber))
                return;
            model.updateInput(inputNumber);
        }
        /** modelの状態をLSに保存 */
        function updateLocalStorage() {
            setLS("sidemenu_estimator_value", model.inputValue);
            setLS("sidemenu_estimator_state", model.constructor.name);
        }
        /** modelを元にviewを更新 */
        function updateView() {
            const roundedInput = roundValue(model.inputValue, 2);
            const roundedResult = roundValue(model.resultValue, 2);
            document.getElementById("estimator-input-desc").innerText = model.inputDesc;
            document.getElementById("estimator-res-desc").innerText = model.resultDesc;
            estimatorInputSelector.value = String(roundedInput);
            estimatorResultSelector.value = String(roundedResult);
            const tweetStr = `AtCoderのハンドルネーム: ${userScreenName}\n${model.inputDesc}: ${roundedInput}\n${model.resultDesc}: ${roundedResult}\n`;
            document.getElementById("estimator-tweet").href = GetEmbedTweetLink(tweetStr, "https://greasyfork.org/ja/scripts/369954-ac-predictor");
        }
    }
    ;
    GetHTML() {
        return `<div class="menu-wrapper">
<div class="menu-header">
    <h4 class="sidemenu-txt">${this.title}<span class="glyphicon glyphicon-menu-up" style="float: right"></span></h4>
</div>
<div class="menu-box"><div class="menu-content" id="${this.id}">${this.document}</div></div>
</div>`;
    }
}
const estimator = new EstimatorElement();

class ResultsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toPerformanceMaps() {
        const res = new Map();
        for (const result of this.data) {
            if (!result.IsRated)
                continue;
            res.set(result.UserScreenName, result.Performance);
        }
        return res;
    }
    toIsRatedMaps() {
        const res = new Map();
        for (const result of this.data) {
            res.set(result.UserScreenName, result.IsRated);
        }
        return res;
    }
    toOldRatingMaps() {
        const res = new Map();
        for (const result of this.data) {
            res.set(result.UserScreenName, result.OldRating);
        }
        return res;
    }
    toNewRatingMaps() {
        const res = new Map();
        for (const result of this.data) {
            res.set(result.UserScreenName, result.NewRating);
        }
        return res;
    }
}
const RESULTS_CACHE_DURATION = 10 * 1000;
const cache$2 = new Cache(RESULTS_CACHE_DURATION);
async function getResults(contestScreenName) {
    if (!cache$2.has(contestScreenName)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/results/json`);
        if (!result.ok) {
            throw new Error(`比赛结果获取失败: ${result.status}`);
        }
        cache$2.set(contestScreenName, await result.json());
    }
    return new ResultsWrapper(cache$2.get(contestScreenName));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/results\/json$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    cache$2.set(contestScreenName, JSON.parse(content));
});

let StandingsWrapper$1 = class StandingsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRanks(onlyRated = false, contestType = "algorithm") {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            if (onlyRated && !this.isRated(data, contestType))
                continue;
            res.set(data.UserScreenName, data.Rank);
        }
        return res;
    }
    toRatedUsers(contestType) {
        const res = [];
        for (const data of this.data.StandingsData) {
            if (this.isRated(data, contestType)) {
                res.push(data.UserScreenName);
            }
        }
        return res;
    }
    toIsRatedMaps(contestType) {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            res.set(data.UserScreenName, this.isRated(data, contestType));
        }
        return res;
    }
    toOldRatingMaps(unpositivize = false) {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            const rating = this.data.Fixed ? data.OldRating : data.Rating;
            res.set(data.UserScreenName, unpositivize ? unpositivizeRating(rating) : rating);
        }
        return res;
    }
    toCompetitionMaps() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            res.set(data.UserScreenName, data.Competitions);
        }
        return res;
    }
    toScores() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            res.set(data.UserScreenName, { score: data.TotalResult.Score, penalty: data.TotalResult.Elapsed });
        }
        return res;
    }
    isRated(data, contestType = "algorithm") {
        if (contestType === "algorithm") {
            return data.IsRated;
        }
        if (contestType === "heuristic") {
            return data.IsRated && data.TotalResult.Count !== 0;
        }
        throw new Error("unreachable");
    }
};
const STANDINGS_CACHE_DURATION$1 = 10 * 1000;
const cache$1 = new Cache(STANDINGS_CACHE_DURATION$1);
async function getStandings(contestScreenName) {
    if (!cache$1.has(contestScreenName)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/standings/json`);
        if (!result.ok) {
            throw new Error(`排行榜获取失败: ${result.status}`);
        }
        cache$1.set(contestScreenName, await result.json());
    }
    return new StandingsWrapper$1(cache$1.get(contestScreenName));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/standings\/json$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    cache$1.set(contestScreenName, JSON.parse(content));
});

class FixedPerformanceProvider {
    result;
    constructor(result) {
        this.result = result;
    }
    availableFor(userScreenName) {
        return this.result.has(userScreenName);
    }
    getPerformance(userScreenName) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`用户${userScreenName}未找到`);
        }
        return this.result.get(userScreenName);
    }
    getPerformances() {
        return this.result;
    }
}

class IncrementalAlgRatingProvider {
    unpositivizedRatingMap;
    competitionsMap;
    constructor(unpositivizedRatingMap, competitionsMap) {
        this.unpositivizedRatingMap = unpositivizedRatingMap;
        this.competitionsMap = competitionsMap;
    }
    availableFor(userScreenName) {
        return this.unpositivizedRatingMap.has(userScreenName);
    }
    async getRating(userScreenName, newPerformance) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`${userScreenName}的rating不可用`);
        }
        const rating = this.unpositivizedRatingMap.get(userScreenName);
        const competitions = this.competitionsMap.get(userScreenName);
        return Math.round(positivizeRating(calcAlgRatingFromLast(rating, newPerformance, competitions)));
    }
}

class ConstRatingProvider {
    ratings;
    constructor(ratings) {
        this.ratings = ratings;
    }
    availableFor(userScreenName) {
        return this.ratings.has(userScreenName);
    }
    async getRating(userScreenName, newPerformance) {
        if (!this.availableFor(userScreenName)) {
            throw new Error(`${userScreenName}的rating不可用`);
        }
        return this.ratings.get(userScreenName);
    }
}

class FromHistoryHeuristicRatingProvider {
    newWeight;
    performancesProvider;
    constructor(newWeight, performancesProvider) {
        this.newWeight = newWeight;
        this.performancesProvider = performancesProvider;
    }
    availableFor(userScreenName) {
        return true;
    }
    async getRating(userScreenName, newPerformance) {
        const performances = await this.performancesProvider(userScreenName);
        performances.push({
            Performance: newPerformance,
            Weight: this.newWeight,
            DaysFromLatestContest: 0,
        });
        return Math.round(positivizeRating(calcHeuristicRatingFromHistory(performances)));
    }
}

class StandingsPageController {
    contestDetails;
    contestDetailsMap = new Map();
    performanceProvider;
    ratingProvider;
    oldRatings = new Map();
    isRatedMaps = new Map();
    standingsTableView;
    async register() {
        const loading = StandingsLoadingView.Get();
        loading.onLoad(() => this.initialize());
    }
    async initialize() {
        const contestScreenName = getContestScreenName();
        const contestDetailsList = await getContestDetails();
        const contestDetails = contestDetailsList.find(details => details.contestScreenName == contestScreenName);
        if (contestDetails === undefined) {
            throw new Error("比赛信息缺失");
        }
        this.contestDetails = contestDetails;
        this.contestDetailsMap = new Map(contestDetailsList.map(details => [details.contestScreenName, details]));
        if (this.contestDetails.beforeContest(new Date()))
            return;
        if (getConfig("hideDuringContest") && this.contestDetails.duringContest(new Date()))
            return;
        const standings = await getStandings(this.contestDetails.contestScreenName);
        if (getConfig("hideUntilFixed") && !standings.data.Fixed)
            return;
        this.standingsTableView = StandingsTableView.Get(async (userScreenName) => {
            if (!this.ratingProvider)
                return { "type": "error", "message": "rating获取器缺失" };
            if (!this.performanceProvider)
                return { "type": "error", "message": "perf获取器缺失" };
            if (!this.isRatedMaps)
                return { "type": "error", "message": "是否rated获取器缺失" };
            if (!this.oldRatings)
                return { "type": "error", "message": "rating记录缺失" };
            if (!this.oldRatings.has(userScreenName))
                return { "type": "error", "message": `${userScreenName}的rating记录不可用` };
            const oldRating = this.oldRatings.get(userScreenName);
            if (!this.performanceProvider.availableFor(userScreenName))
                return { "type": "error", "message": `${userScreenName}的perf不可用` };
            const originalPerformance = this.performanceProvider.getPerformance(userScreenName);
            const positivizedPerformance = Math.round(positivizeRating(originalPerformance));
            if (this.isRatedMaps.get(userScreenName)) {
                if (!this.ratingProvider.provider.availableFor(userScreenName))
                    return { "type": "error", "message": `${userScreenName}的rating不可用` };
                if (this.ratingProvider.lazy) {
                    const newRatingCalculator = () => this.ratingProvider.provider.getRating(userScreenName, originalPerformance);
                    return { type: "deffered", oldRating, performance: positivizedPerformance, newRatingCalculator };
                }
                else {
                    const newRating = await this.ratingProvider.provider.getRating(userScreenName, originalPerformance);
                    return { type: "rated", oldRating, performance: positivizedPerformance, newRating };
                }
            }
            else {
                return { type: "unrated", oldRating, performance: positivizedPerformance };
            }
        });
        this.standingsTableView.onRefreshed(async () => {
            await this.updateData();
            this.standingsTableView.update();
        });
        await this.updateData();
        this.standingsTableView.update();
    }
    async updateData() {
        if (!this.contestDetails)
            throw new Error("比赛信息缺失");
        if (isDebugMode())
            console.log("数据加载中...");
        const standings = await getStandings(this.contestDetails.contestScreenName);
        let basePerformanceProvider = undefined;
        if (standings.data.Fixed && getConfig("useResults")) {
            try {
                const results = await getResults(this.contestDetails.contestScreenName);
                if (results.data.length === 0) {
                    throw new Error("计算结果缺失");
                }
                basePerformanceProvider = new FixedPerformanceProvider(results.toPerformanceMaps());
                this.isRatedMaps = results.toIsRatedMaps();
                this.oldRatings = results.toOldRatingMaps();
                this.ratingProvider = { provider: new ConstRatingProvider(results.toNewRatingMaps()), lazy: false };
            }
            catch (e) {
                console.warn("计算失败", e);
            }
        }
        if (basePerformanceProvider === undefined) {
            const aperfsDict = await getAPerfs(this.contestDetails.contestScreenName);
            const defaultAPerf = this.contestDetails.defaultAPerf;
            const normalizedRanks = normalizeRank(standings.toRanks(true, this.contestDetails.contestType));
            const aperfsList = standings.toRatedUsers(this.contestDetails.contestType).map(user => hasOwnProperty(aperfsDict, user) ? aperfsDict[user] : defaultAPerf);
            basePerformanceProvider = new EloPerformanceProvider(normalizedRanks, aperfsList, this.contestDetails.performanceCap);
            this.isRatedMaps = standings.toIsRatedMaps(this.contestDetails.contestType);
            this.oldRatings = standings.toOldRatingMaps();
            if (getConfig("compareComputations")) {
                const results = await getResults(this.contestDetails.contestScreenName);
                this.performanceProvider = basePerformanceProvider;
                this.oldRatings = results.toPerformanceMaps();
                this.ratingProvider = { provider: { availableFor: (name) => basePerformanceProvider.availableFor(name), getRating: async (name, _v) => basePerformanceProvider.getPerformance(name) }, lazy: false };
                return;
            }
            if (this.contestDetails.contestType == "algorithm") {
                this.ratingProvider = { provider: new IncrementalAlgRatingProvider(standings.toOldRatingMaps(true), standings.toCompetitionMaps()), lazy: false };
            }
            else {
                const startAt = this.contestDetails.startTime;
                const endAt = this.contestDetails.endTime;
                this.ratingProvider = {
                    provider: new FromHistoryHeuristicRatingProvider(getWeight(startAt, endAt), async (userScreenName) => {
                        const histories = await getHistory(userScreenName, "heuristic");
                        histories.data = histories.data.filter(x => new Date(x.EndTime) < endAt);
                        return histories.toRatingMaterials(endAt, x => {
                            const details = this.contestDetailsMap.get(x.split(".")[0]);
                            if (!details) {
                                console.warn(`比赛信息因${x}而无法获取`);
                                return 0;
                            }
                            return details.duration;
                        });
                    }),
                    lazy: true
                };
            }
        }
        this.performanceProvider = new InterpolatePerformanceProvider(standings.toRanks(), basePerformanceProvider);
        if (isDebugMode())
            console.log("数据已更新");
    }
}

class StandingsWrapper {
    data;
    constructor(data) {
        this.data = data;
    }
    toRanks(onlyRated = false, contestType = "algorithm") {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            if (onlyRated && !this.isRated(data, contestType))
                continue;
            const userScreenName = data.Additional["standings.virtualElapsed"] === -2 ? `ghost:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, data.Rank);
        }
        return res;
    }
    toRatedUsers(contestType) {
        const res = [];
        for (const data of this.data.StandingsData) {
            if (this.isRated(data, contestType)) {
                res.push(data.UserScreenName);
            }
        }
        return res;
    }
    toScores() {
        const res = new Map();
        for (const data of this.data.StandingsData) {
            const userScreenName = data.Additional["standings.virtualElapsed"] === -2 ? `ghost:${data.UserScreenName}` : data.UserScreenName;
            res.set(userScreenName, { score: data.TotalResult.Score, penalty: data.TotalResult.Elapsed });
        }
        return res;
    }
    isRated(data, contestType) {
        if (contestType === "algorithm") {
            return data.IsRated && data.Additional["standings.virtualElapsed"] === -2;
        }
        else {
            return data.IsRated && data.Additional["standings.virtualElapsed"] === -2 && data.TotalResult.Count !== 0;
        }
    }
}
function createCacheKey(contestScreenName, showGhost) {
    return `${contestScreenName}:${showGhost}`;
}
const STANDINGS_CACHE_DURATION = 10 * 1000;
const cache = new Cache(STANDINGS_CACHE_DURATION);
async function getVirtualStandings(contestScreenName, showGhost) {
    const cacheKey = createCacheKey(contestScreenName, showGhost);
    if (!cache.has(cacheKey)) {
        const result = await fetch(`https://atcoder.jp/contests/${contestScreenName}/standings/virtual/json${showGhost ? "?showGhost=true" : ""}`);
        if (!result.ok) {
            throw new Error(`无法获取排行榜: ${result.status}`);
        }
        cache.set(cacheKey, await result.json());
    }
    return new StandingsWrapper(cache.get(cacheKey));
}
addHandler((content, path) => {
    const match = path.match(/^\/contests\/([^/]*)\/standings\/virtual\/json(\?showGhost=true)?$/);
    if (!match)
        return;
    const contestScreenName = match[1];
    const showGhost = match[2] != "";
    cache.set(createCacheKey(contestScreenName, showGhost), JSON.parse(content));
});

function isVirtualStandingsPage() {
    return /^\/contests\/[^/]*\/standings\/virtual\/?$/.test(document.location.pathname);
}

function duringVirtualParticipation() {
    if (!isVirtualStandingsPage()) {
        throw new Error("预测在该页面不可用");
    }
    const timerText = document.getElementById("virtual-timer")?.textContent ?? "";
    if (timerText && !timerText.includes("終了") && !timerText.includes("over"))
        return true;
    else
        return false;
}

function forgeCombinedRanks(a, b) {
    const res = new Map();
    const merged = [...a.entries(), ...b.entries()].sort((a, b) => a[1].score !== b[1].score ? b[1].score - a[1].score : a[1].penalty - b[1].penalty);
    let rank = 0;
    let prevScore = NaN;
    let prevPenalty = NaN;
    for (const [userScreenName, { score, penalty }] of merged) {
        if (score !== prevScore || penalty !== prevPenalty) {
            rank++;
            prevScore = score;
            prevPenalty = penalty;
        }
        res.set(userScreenName, rank);
    }
    return res;
}
function remapKey(map, mappingFunction) {
    const newMap = new Map();
    for (const [key, val] of map) {
        newMap.set(mappingFunction(key), val);
    }
    return newMap;
}
class VirtualStandingsPageController {
    contestDetails;
    performanceProvider;
    standingsTableView;
    async register() {
        const loading = StandingsLoadingView.Get();
        loading.onLoad(() => this.initialize());
    }
    async initialize() {
        const contestScreenName = getContestScreenName();
        const contestDetailsList = await getContestDetails();
        const contestDetails = contestDetailsList.find(details => details.contestScreenName == contestScreenName);
        if (contestDetails === undefined) {
            throw new Error("比赛信息缺失");
        }
        this.contestDetails = contestDetails;
        this.standingsTableView = StandingsTableView.Get(async (userScreenName) => {
            if (!this.performanceProvider)
                return { "type": "error", "message": "perf获取器缺失" };
            if (!this.performanceProvider.availableFor(userScreenName))
                return { "type": "error", "message": `${userScreenName}的perf不可用` };
            const originalPerformance = this.performanceProvider.getPerformance(userScreenName);
            const positivizedPerformance = Math.round(positivizeRating(originalPerformance));
            return { type: "perfonly", performance: positivizedPerformance };
        });
        this.standingsTableView.onRefreshed(async () => {
            await this.updateData();
            this.standingsTableView.update();
        });
        await this.updateData();
        this.standingsTableView.update();
    }
    async updateData() {
        if (!this.contestDetails)
            throw new Error("比赛信息缺失");
        const virtualStandings = await getVirtualStandings(this.contestDetails.contestScreenName, true);
        const results = await getResults(this.contestDetails.contestScreenName);
        let ranks;
        let basePerformanceProvider;
        if ((!duringVirtualParticipation() || getConfig("useFinalResultOnVirtual")) && getConfig("useResults")) {
            const standings = await getStandings(this.contestDetails.contestScreenName);
            const referencePerformanceMap = remapKey(results.toPerformanceMaps(), userScreenName => `reference:${userScreenName}`);
            basePerformanceProvider = new FixedPerformanceProvider(referencePerformanceMap);
            ranks = forgeCombinedRanks(remapKey(standings.toScores(), userScreenName => `reference:${userScreenName}`), virtualStandings.toScores());
        }
        else {
            const aperfsObj = await getAPerfs(this.contestDetails.contestScreenName);
            const defaultAPerf = this.contestDetails.defaultAPerf;
            const normalizedRanks = normalizeRank(virtualStandings.toRanks(true, this.contestDetails.contestType));
            const aperfsList = virtualStandings.toRatedUsers(this.contestDetails.contestType).map(userScreenName => hasOwnProperty(aperfsObj, userScreenName) ? aperfsObj[userScreenName] : defaultAPerf);
            basePerformanceProvider = new EloPerformanceProvider(normalizedRanks, aperfsList, this.contestDetails.performanceCap);
            ranks = virtualStandings.toRanks();
        }
        this.performanceProvider = new InterpolatePerformanceProvider(ranks, basePerformanceProvider);
    }
}

function isExtendedStandingsPage() {
    return /^\/contests\/[^/]*\/standings\/extended\/?$/.test(document.location.pathname);
}

function isStandingsPage() {
    return /^\/contests\/[^/]*\/standings\/?$/.test(document.location.pathname);
}

const elements = document.querySelectorAll('.clearfix');
elements.forEach((element) => {
    element.innerHTML += `
        <div id="ap-cn-ez-error" class="alert alert-warning text-center" style="display: none;"></div>
    `;
});

{
    const controller = new ConfigController();
    controller.register();
}
if (isStandingsPage()) {
    const controller = new StandingsPageController();
    controller.register();
}
if (isVirtualStandingsPage()) {
    const controller = new VirtualStandingsPageController();
    controller.register();
}
if (isExtendedStandingsPage()) {
    const controller = new ExtendedStandingsPageController();
    controller.register();
}

window.addEventListener('unhandledrejection', event => {
    document.getElementById("ap-cn-ez-error").innerHTML = `<p>ac-predictor-cn-ez: ${event.reason}</p>`;
    document.getElementById("ap-cn-ez-error").style.display = "";
});  
