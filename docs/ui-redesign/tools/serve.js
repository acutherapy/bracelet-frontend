// usage: node serve.js <buildDir> <port>  -> serves buildDir at /bracelet-frontend/
const http=require('http'),fs=require('fs'),path=require('path');
const [dir,port]=[process.argv[2],+process.argv[3]];
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml','.map':'application/json','.woff2':'font/woff2','.ttf':'font/ttf'};
http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]);
  if(!u.startsWith('/bracelet-frontend')){res.writeHead(302,{Location:'/bracelet-frontend/'});return res.end();}
  let p=path.join(dir,u.replace('/bracelet-frontend',''));
  if(!p.startsWith(path.resolve(dir))){res.writeHead(403);return res.end();}
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  if(!fs.existsSync(p))p=path.join(dir,'index.html');
  res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});
  fs.createReadStream(p).pipe(res);
}).listen(port,()=>console.log('serving',dir,'on',port));
