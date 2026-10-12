import {createServer} from 'node:http';import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import path from 'node:path';import {randomUUID} from 'node:crypto';
import {createChallenge,contribute,cancelChallenge,tickChallenge} from '../src/index.js';
const folder=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const staticFiles=new Map([['/','index.html'],['/index.html','index.html'],['/README.md','README.md'],['/demo.js','demo.js'],['/styles.css','styles.css'],['/src/index.js','src/index.js'],['/src/chat-mash-parser.js','src/chat-mash-parser.js']]);
/** Local single-owner example. Each completed request applies one synchronous state transition. */
export function createLocalServer(){
 let state=null;
 const now=()=>Math.floor(Date.now()/1000);
 return createServer(async(request,response)=>{
  const send=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});response.end(JSON.stringify(value));};
  try{
   const host=request.headers.host??'';
   if(!/^127\.0\.0\.1:\d+$/.test(host))return send(403,{error:'Local Host required'});
   if(request.headers.origin && request.headers.origin!==`http://${host}`)return send(403,{error:'Same-origin requests required'});
   const pathname=new URL(request.url,`http://${host}`).pathname;
   if(request.method==='GET'&&staticFiles.has(pathname)){const file=staticFiles.get(pathname);response.writeHead(200,{'Content-Type':file==='README.md'?'text/plain; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','X-Content-Type-Options':'nosniff'});response.end(readFileSync(path.join(folder,file)));return;}
   if(request.method==='GET'&&pathname==='/state'){if(state)state=tickChallenge(state,now());return send(200,state);}
   if(request.method!=='POST'||!['/start','/contribute','/cancel'].includes(pathname))return send(404,{error:'Not found'});
   if(!String(request.headers['content-type']??'').startsWith('application/json'))return send(415,{error:'JSON required'});
   let raw='',bytes=0;for await(const chunk of request){bytes+=chunk.length;if(bytes>16384)return send(413,{error:'Body too long'});raw+=chunk.toString('utf8');}
   const input=JSON.parse(raw||'{}');const time=now();
   if(pathname==='/start'){state=createChallenge(input,{eventId:randomUUID(),scope:'local-demo',now:time});return send(200,state);}
   if(!state)return send(409,{error:'Start a challenge first'});
   if(pathname==='/cancel'){state=cancelChallenge(state,time);return send(200,state);}
   const result=contribute(state,{...input,now:time});state=result.state;return send(200,result);
  }catch{send(400,{error:'Invalid request'});}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=createLocalServer();server.listen(0,'127.0.0.1',()=>console.log(`Local example: http://127.0.0.1:${server.address().port}`));
 process.once('SIGINT',()=>server.close());process.once('SIGTERM',()=>server.close());
}
