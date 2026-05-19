function getHomePageHTML(host) {
    return `<!DOCTYPE html>
<html lang="zh-cn">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${host} start</title>
    <style>
        :root {
            font-size: min(16px,3vmin);
        }

        html,
        body {
            border: 0;
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
        }
    </style>
</head>

<body>
    <div style="
        display: flex;
        width: 100%;
        min-height: 100%;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    ">
        <h1 style="font-size: 2.8rem;">${host}</h1>
        <h2 style="font-size: 2rem;margin-bottom: 3rem;">开始加快你的下载速度</h2>
        <div style="font-size: 1rem;margin-bottom: 0.1rem;color: red;" id="error-shwo"></div>
        <input style="font-size: 1.3rem;margin-bottom: 3rem;" type="text" id="imput-link" placeholder="输入需要加速下载的链接">
        <div style="
            color: rgb(255, 211, 211);
            font-size: 1.3rem;
            background-color: rgb(37, 37, 37);
            border-radius: 0.5rem;
            padding: 0.5rem 1rem;
            display: flex;
        ">
            <pre style="margin: 0;" id="shwo-start">https://${host}/</pre>
        </div>
        <button style="font-size: 1rem;margin-top: 0.5rem;" onclick="navigator.clipboard.writeText(document.getElementById('shwo-start').innerHTML)">复制</button>
    </div>
    <script>
        document.getElementById("imput-link").addEventListener("input",(event)=>{
            console.log(event);
            let url;
            try{
                url = new URL(event.target.value);
            }catch(e){
                document.getElementById("error-shwo").innerHTML = '这不是一个合法的URL';
                return;
            }
            document.getElementById("error-shwo").innerHTML = '';
            document.getElementById("shwo-start").innerHTML = "https://${host}/"+url;
        });
    </script>
</body>
</html>`;
}


export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.pathname == "/") {
            return new Response(getHomePageHTML(url.hostname), {
                headers: {
                    "content-type": "text/html;charset=utf-8"
                }
            });
        }
        const go = url.pathname.substring(1) + url.search;
        let goUrl;
        try {
            goUrl = new URL(go);
        } catch (e) {
            return new Response(`错误：${go} 不是一个正确的url : ${e}`, {
                status: 404,
                headers: {
                    "content-type": "text/test;charset=utf-8"
                }
            });
        }
        try {
            let res = await fetch(goUrl, request);
            if (res.status < 300 || res.status > 399) { // 没有重定向则直接返回
                
                // 处理content-type,不返回html类型，否则会被浏览器当成html解析，导致无法下载
                const newHeaders = new Headers(res.headers);
                let contentType = newHeaders.get("content-type");
                if (contentType?.includes("text/html")) {
                    contentType = contentType.replace("text/html", "text/cf-html");
                    newHeaders.set("content-type", contentType);
                }

                return new Response(res.body, {
                    headers: newHeaders,
                    status: res.status,
                    statusText: res.statusText
                });
            }
            //处理重定向
            const loc = res.headers.get("Location");
            if (!loc) {
                return res;
            }
            const toUrl = new URL(loc, goUrl);
            const newHeaders = new Headers(res.headers);
            newHeaders.set("Location", `${url.origin}/${toUrl}`);
            return new Response(res.body, {
                headers: newHeaders,
                status: res.status,
                statusText: res.statusText
            });
        } catch (e) {
            return new Response(`fetch 错误: ${e}`, {
                status: 503,
                headers: {
                    "content-type": "text/test;charset=utf-8"
                }
            });
        }

    },
};
