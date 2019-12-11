// ==UserScript==
// @name         解除手机端B站区域限制
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效;
// @author       ipcjs
// @supportURL   https://github.com/zzc10086
// @compatible   chrome
// @license      MIT
// @require      https://static.hdslb.com/js/md5.js
// @include      *://m.bilibili.com/bangumi/play/ep*
// @include      *://m.bilibili.com/bangumi/play/ss*
// @run-at       document-start
// @grant        none
// ==/UserScript==

const log = console.log.bind(console, 'injector:')
const addPlayjs = (function () {

        function addPlayjs() {
            let scriptFile = document.createElement('script');

             scriptFile.setAttribute("type","text/javascript");

             scriptFile.setAttribute("src",'https://cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.js');

             document.getElementsByTagName("head")[0].appendChild(scriptFile);
            scriptFile = document.createElement('script');

             scriptFile.setAttribute("type","text/javascript");

             scriptFile.setAttribute("src",'https://cdn.bootcss.com/flv.js/1.5.0/flv.js');

             document.getElementsByTagName("head")[0].appendChild(scriptFile);

        }
        function addPlaycss() {
            let link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = "https://cdn.bootcss.com/dplayer/1.25.0/DPlayer.min.css";
             document.getElementsByTagName("head")[0].appendChild(link);

        }
        addPlayjs()
        addPlaycss()
    })()

function injector() {
    if (document.getElementById('balh-injector-source')) {
        log(`脚本已经注入过, 不需要执行`)
        return
    }
    // @require      https://static.hdslb.com/js/md5.js
    GM_info.scriptMetaStr.replace(new RegExp('// @require\\s+https?:(//.*)'), (match, /*p1:*/url) => {
        log('@require:', url)
        let $script = document.createElement('script')
        $script.className = 'balh-injector-require'
        $script.setAttribute('type', 'text/javascript')
        $script.setAttribute('src', url)
        document.head.appendChild($script)
        return match
    })
    let $script = document.createElement('script')
    $script.id = 'balh-injector-source'
    $script.appendChild(document.createTextNode(`
        ;(function(GM_info){
            ${scriptSource.toString()}
            ${scriptSource.name}('${GM_info.scriptHandler}.${injector.name}')
        })(${JSON.stringify(GM_info)})
    `))
    document.head.appendChild($script)
    log('注入完成')
}

if (!Object.getOwnPropertyDescriptor(window, 'XMLHttpRequest').writable) {
    log('XHR对象不可修改, 需要把脚本注入到页面中', GM_info.script.name, location.href, document.readyState)
    injector()
    return
}


function scriptSource(invokeBy) {
    let log = console.log.bind(console, 'injector:')
    if (document.getElementById('balh-injector-source') && invokeBy === GM_info.scriptHandler) {
        // 当前, 在Firefox+GM4中, 当返回缓存的页面时, 脚本会重新执行, 并且此时XMLHttpRequest是可修改的(为什么会这样?) + 页面中存在注入的代码
        // 导致scriptSource的invokeBy直接是GM4...
        log(`页面中存在注入的代码, 但invokeBy却等于${GM_info.scriptHandler}, 这种情况不合理, 终止脚本执行`)
        return
    }
    if (document.readyState === 'uninitialized') { // Firefox上, 对于ifame中执行的脚本, 会出现这样的状态且获取到的href为about:blank...
        log('invokeBy:', invokeBy, 'readState:', document.readyState, 'href:', location.href, '需要等待进入loading状态')
        setTimeout(() => scriptSource(invokeBy + '.timeout'), 0) // 这里会暴力执行多次, 直到状态不为uninitialized...
        return
    }

    const _raw = (str) => str.replace(/(\.|\?)/g, '\\$1')
    const util_regex_url = (url) => new RegExp(`^(https?:)?//${_raw(url)}`)
    const util_regex_url_path = (path) => new RegExp(`^(https?:)?//[\\w\\-\\.]+${_raw(path)}`)
    const util_url_param = function (url, key) {
        return (url.match(new RegExp('[?|&]' + key + '=(\\w+)')) || ['', ''])[1];
    }

    const util_safe_get = (code) => {
        return eval(`
        (()=>{
            try{
                return ${code}
            }catch(e){
                console.warn(e.toString())
                return null
            }
        })()
        `)
    }


    function replace_upos(data){
        let replace_url;
        let uposArr=[
            ["ks3","https://upos-hz-mirrorks3u.acgvideo.com"],
            ["hw","https://upos-hz-mirrorhw.acgvideo.com"],
            ["kodo","https://upos-hz-mirrorkodou.acgvideo.com"],
            ["cos","https://upos-hz-mirrorcosu.acgvideo.com"],
            ["wcs","https://upos-hz-mirrorwcsu.acgvideo.com"],
            ["bos","https://upos-hz-mirrorbosu.acgvideo.com"]
        ];
        //https://upos-hz-mirrorakam.akamaized.net AKAMAI_CDN(海外)
        //https://upos-hz-mirrorks3u.acgvideo.com 金山CDN
        //https://upos-hz-mirrorhw.acgvideo.com 华为CDN
        //https://upos-hz-mirrorwcsu.acgvideo.com 网宿CDN
        //https://upos-hz-mirrorcosu.acgvideo.com 腾讯CDN
        //https://upos-hz-mirrorbosu.acgvideo.com 百度CDN
        //https://upos-hz-mirrorkodou.acgvideo.com 七牛CDN
        let upos_server=util_info.upos_server;
        if(upos_server&&upos_server!=""){
            for(let i in uposArr){
                if(uposArr[i][0]==upos_server){
                    replace_url=uposArr[i][1];
                    break;
                }
            }
            if(data.dash){
                for(let i in data.dash.audio){
                    data.dash.audio[i].baseUrl=data.dash.audio[i].baseUrl.replace(/http.*?upgcxcode/,replace_url+"/upgcxcode");
                    data.dash.audio[i].base_url=data.dash.audio[i].base_url.replace(/http.*?upgcxcode/,replace_url+"/upgcxcode");
                }
                for(let i in data.dash.video){
                    data.dash.video[i].baseUrl=data.dash.video[i].baseUrl.replace(/http.*?upgcxcode/,replace_url+"/upgcxcode");
                    data.dash.video[i].base_url=data.dash.video[i].base_url.replace(/http.*?upgcxcode/,replace_url+"/upgcxcode");
                }
            }else if(data.durl){
                for(let i in data.durl){
                    data.durl[i].url= data.durl[i].url.replace(/http.*?upgcxcode/,replace_url+"/upgcxcode");
                }
            }
        }
        return data;
    }

    const util_promise_timeout = function (timeout) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, timeout);
        })
    }


    const util_promise_condition = function (condition, promiseCreator, retryCount = Number.MAX_VALUE, interval = 1) {
        const loop = (time) => {
            if (!condition()) {
                if (time < retryCount) {
                    return util_promise_timeout(interval).then(loop.bind(null, time + 1))
                } else {
                    return Promise.reject(`util_promise_condition timeout, condition: ${condition.toString()}`)
                }
            } else {
                return promiseCreator()
            }
        }
        return loop(0)
    }

    const util_ajax = function (options) {
        const creator = () => new Promise(function (resolve, reject) {
            typeof options !== 'object' && (options = { url: options });

            options.async === undefined && (options.async = true);
            options.xhrFields === undefined && (options.xhrFields = { withCredentials: true });
            options.success = function (data) {
                resolve(data);
            };
            options.error = function (err) {
                reject(err);
            };
            log('ajax:', options.url)
            $.ajax(options);
        })
        return util_promise_condition(() => window.$, creator, 100, 100) // 重试 100 * 100 = 10s
    }

    const balh_feature_area_limit = (function () {

        function isAreaLimitForPlayUrl(json) {
            return (json.errorcid && json.errorcid == '8986943') || (json.durl && json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627);
        }

        function isBangumi(season_type) {
            log(`season_type: ${season_type}`)
            // 1是动画
            // 5是电视剧
            // 2是电影
            return season_type != null // 有season_type, 就是bangumi?
        }

        function isBangumiPage() {
            return isBangumi(util_safe_get('window.__INITIAL_STATE__.epType || window.__INITIAL_STATE__.ssType'))
        }

        var bilibiliApis = (function () {
            function AjaxException(message, code = 0/*用0表示未知错误*/) {
                this.name = 'AjaxException'
                this.message = message
                this.code = code
            }

            function BilibiliApi(props) {
                Object.assign(this, props);
            }

            BilibiliApi.prototype.asyncAjax = function (originUrl) {
                return util_ajax(this.transToProxyUrl(originUrl))
                    .then(r => this.processProxySuccess(r))
                    .compose() // 出错时, 提示服务器连不上
            }
            var playurl_by_proxy = new BilibiliApi({
                _asyncAjax: function (originUrl, bangumi) {
                    return util_ajax(this.transToProxyUrl(originUrl, bangumi))
                        .then(r => this.processProxySuccess(r, false))
                },
                transToProxyUrl: function (url, bangumi) {
                    let params = url.split('?')[1];
                    if (bangumi === undefined) { // 自动判断
                        // av页面中的iframe标签形式的player, 不是番剧视频
                        // url中存在season_type的情况
                        if (window.__INITIAL_STATE__.epInfo.from=="bangumi") {
                        params += '&module=bangumi'
                        }
                    } else if (bangumi === false) { // 移除可能存在的module参数
                        params = params.replace(/&?module=(\w+)/, '')
                    }
                    return util_info.server+"/BPplayurl.php?"+params;
                },
                processProxySuccess: function (data, alertWhenError = true) {
                    // data有可能为null
                    if (data && data.code === -403) {
                        alert("代理服务器依旧被限制")
                    } else if (data === null || data.code) {
                        log(data);
                        if (alertWhenError) {
                            alert("获取播放地址失败")
                        } else {
                            return Promise.reject(new AjaxException(`服务器错误: ${JSON.stringify(data)}`, data ? data.code : 0))
                        }
                    }
                    return data;
                }
            })
            const playurl = new BilibiliApi({
                asyncAjax: function (originUrl) {
                    log('从代理服务器拉取视频地址中...')
                    return playurl_by_proxy._asyncAjax(originUrl) // 优先从代理服务器获取
                        .catch(e => {
                            if (e instanceof AjaxException) {
                                    if (e.code === 1) { // code: 1 表示非番剧视频, 不能使用番剧视频参数
                                    return playurl_by_proxy._asyncAjax(originUrl, false)
                                        .catch(e2 => Promise.reject(e)) // 忽略e2, 返回原始错误e
                                } else if (e.code === 10004) { // code: 10004, 表示视频被隐藏, 一般添加module=bangumi参数可以拉取到视频
                                    return playurl_by_proxy._asyncAjax(originUrl, true)
                                        .catch(e2 => Promise.reject(e))
                                }
                            }
                            return Promise.reject(e)
                        })
                        .catch(e => {
                            return Promise.reject(e)
                        })
                        // 报错时, 延时1秒再发送错误信息
                        .catch(e => util_promise_timeout(1000).then(r => Promise.reject(e)))
                        .catch(e => {
                            let msg
                            if (typeof e === 'object' && e.statusText == 'error') {
                                alert( '代理服务器临时不可用')
                            }
                            alert("获取播放地址失败")
                            return Promise.reject(e)
                        })
                        .then(data => {

                            return replace_upos(data)
                        })
                }
            })
           return {
                _playurl: playurl,
            };
           })();

           function addPlay(playurl) {
            document.getElementsByClassName('player-wrapper')[0].innerHTML = "";
             return new DPlayer({
                 container: document.getElementsByClassName('player-wrapper')[0],
                 autoplay: false,
                 theme: '#FADFA3',
                 loop: false,
                 lang: 'zh-cn',
                 screenshot: true,
                 hotkey: true,
                 preload: 'auto',
                 volume: 0.7,
                 mutex: true,
                 video: {
                     url: playurl.result.durl[0].url,
                     type: 'auto',
                 },
             });

        }
    (function injectXHR() {
            log('XMLHttpRequest的描述符:', Object.getOwnPropertyDescriptor(window, 'XMLHttpRequest'))
            let firstCreateXHR = true
            window.XMLHttpRequest = new Proxy(window.XMLHttpRequest, {
                construct: function (target, args) {

                    let container = {} // 用来替换responseText等变量
                    const dispatchResultTransformer = p => {
                        let event = {} // 伪装的event
                        return p
                            .then(r => {
                                container.readyState = 4
                                container.response = r
                                container.__onreadystatechange(event) // 直接调用会不会存在this指向错误的问题? => 目前没看到, 先这样(;¬_¬)
                            })
                            .catch(e => {
                                // 失败时, 让原始的response可以交付
                                container.__block_response = false
                                if (container.__response != null) {
                                    container.readyState = 4
                                    container.response = container.__response
                                    container.__onreadystatechange(event) // 同上
                                }
                            })
                    }
                    return new Proxy(new target(...args), {
                        set: function (target, prop, value, receiver) {
                            if (prop === 'onreadystatechange') {
                                container.__onreadystatechange = value
                                let cb = value
                                value = function (event) {
                                    if (target.readyState === 4) {
                                        if (target.responseURL.match(util_regex_url('bangumi.bilibili.com/view/web_api/season/user/status'))
                                            || target.responseURL.match(util_regex_url('api.bilibili.com/pgc/view/web/season/user/status'))) {
                                            log('/season/user/status:', target.responseText)
                                            let json = JSON.parse(target.responseText)
                                            let rewriteResult = false
                                            if (json.code === 0 && json.result) {
                                                if (json.result.area_limit !== 0) {
                                                    json.result.area_limit = 0 // 取消区域限制
                                                    rewriteResult = true
                                                }
                                                if (json.result.pay !== 1) {
                                                    json.result.pay = 1
                                                    rewriteResult = true
                                                }
                                                if (rewriteResult) {
                                                    container.responseText = JSON.stringify(json)
                                                }
                                            }
                                        } else if (target.responseURL.match(util_regex_url('bangumi.bilibili.com/web_api/season_area'))) {
                                            log('/season_area', target.responseText)
                                            let json = JSON.parse(target.responseText)
                                            if (json.code === 0 && json.result) {
                                                if (json.result.play === 0) {
                                                    json.result.play = 1
                                                    container.responseText = JSON.stringify(json)
                                                }
                                            }
                                        } else if (target.responseURL.match(util_regex_url('api.bilibili.com/x/web-interface/nav'))) {
                                            const isFromReport = util_url_param(target.responseURL, 'from') === 'report'
                                            let json = JSON.parse(target.responseText)
                                            log('/x/web-interface/nav', (json.data && json.data.isLogin)
                                                ? { uname: json.data.uname, isLogin: json.data.isLogin, level: json.data.level_info.current_level, vipType: json.data.vipType, vipStatus: json.data.vipStatus, isFromReport: isFromReport }
                                                : target.responseText)
                                            if (json.code === 0 && !isFromReport // report时, 还是不伪装了...
                                            ) {
                                                json.data.vipType = 2; // 类型, 年度大会员
                                                json.data.vipStatus = 1; // 状态, 启用
                                                container.responseText = JSON.stringify(json)
                                            }
                                        }else if (target.responseURL.match(util_regex_url('api.bilibili.com/pgc/player/web/playurl'))
                                            && !util_url_param(target.responseURL, 'balh_ajax')) {
                                            log('/pgc/player/web/playurl', 'origin', `block: ${container.__block_response}`, target.response)
                                            if (!container.__redirect) { // 请求没有被重定向, 则需要检测结果是否有区域限制
                                                let json = target.response
                                                if (json.code) {
                                                    container.__block_response = true
                                                    let url = container.__url
                                                    bilibiliApis._playurl.asyncAjax(url)
                                                        .then(data => {
                                                            if (!data.code) {
                                                                data = { code: 0, result: data, message: "0" }
                                                            }
                                                            log('/pgc/player/web/playurl', 'proxy', data)
                                                            return data
                                                        })
                                                        .compose(dispatchResultTransformer)
                                                } else {

                                                }
                                            }
                                            // 同上
                                        }
                                        if (container.__block_response) {
                                            // 屏蔽并保存response
                                            container.__response = target.response
                                            return
                                        }
                                    }
                                    // 这里的this是原始的xhr, 在container.responseText设置了值时需要替换成代理对象
                                    cb.apply(container.responseText ? receiver : this, arguments)
                                }
                            }
                            target[prop] = value
                            return true
                        },
                        get: function (target, prop, receiver) {
                            if (prop in container) return container[prop]
                            let value = target[prop]
                            if (typeof value === 'function') {
                                let func = value
                                // open等方法, 必须在原始的xhr对象上才能调用...
                                value = function () {
                                    if (prop === 'open') {
                                        container.__method = arguments[0]
                                        container.__url = arguments[1]
                                    } else if (prop === 'send') {
                                        let dispatchResultTransformerCreator = () => {
                                            container.__block_response = true
                                            return dispatchResultTransformer
                                        }
                                        if (container.__url.match(util_regex_url('api.bilibili.com/x/player/playurl'))) {
                                            log('/x/player/playurl')
                                            // debugger
                                            bilibiliApis._playurl.asyncAjax(container.__url)
                                                .then(data => {
                                                    if (!data.code) {
                                                        data = {
                                                            code: 0,
                                                            data: data,
                                                            message: "0",
                                                            ttl: 1
                                                        }
                                                    }
                                                    log('/x/player/playurl', 'proxy', data)
                                                    return data
                                                })
                                                .compose(dispatchResultTransformerCreator())
                                        } else if (container.__url.match(util_regex_url('api.bilibili.com/pgc/player/web/playurl'))
                                            && !util_url_param(container.__url, 'balh_ajax')) {
                                            log('/pgc/player/web/playurl')
                                            // debugger
                                            container.__redirect = true // 标记该请求被重定向
                                            let url = container.__url
                                            url=url.replace(/ep_id=.*/,"cid="+window.__INITIAL_STATE__.epInfo.cid+"&avid="+window.__INITIAL_STATE__.epInfo.aid+"&otype=json&&qn=112")
                                            bilibiliApis._playurl.asyncAjax(url)
                                                .then(data => {
                                                    if (!data.code) {
                                                        data = {
                                                            code: 0,
                                                            result: data,
                                                            message: "0",
                                                        }
                                                    }
                                                    log('/pgc/player/web/playurl', 'proxy(redirect)', data)
                                                    var myPlay=addPlay(data)
                                                    myPlay.play();
                                                    return data
                                                })
                                                .compose(dispatchResultTransformerCreator())
                                        }
                                    }
                                    return func.apply(target, arguments)
                                }
                            }
                            return value
                        }
                    })
                }
            })
         })()


    })()



    const balh_feature_area_limit_new = (function () {

        function replaceINITIAL_STATE() {
            let INITIAL_STATE = undefined
            Object.defineProperty(window, '__INITIAL_STATE__', {
                configurable: true,
                enumerable: true,
                get: () => {
                    log('__INITIAL_STATE__', 'get')
                    return INITIAL_STATE
                },
                set: (value) => {
                    // debugger
                        log('__INITIAL_STATE__', value)
                        if(value.epInfo.status!==2){
                            value.epInfo.status=2
                            if(document.getElementsByClassName("player-mask relative")[0]){
                            document.getElementsByClassName("player-mask relative")[0].style.display="none"
                         }

                    }
                    INITIAL_STATE=value
                },
            })
        }
        replaceINITIAL_STATE()
    })()

    


        var util_info={
            upos_server:"",
            server:"https://www.biliplus.com"
        }



}
scriptSource(GM_info.scriptHandler);