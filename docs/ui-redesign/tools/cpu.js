const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({channel:'chrome'});const p=await b.newPage();
await p.goto(process.argv[2],{waitUntil:'networkidle'});const c=await p.context().newCDPSession(p);await c.send('Performance.enable');
const g=async()=>Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
const a=await g();await p.waitForTimeout(3000);const z=await g();
console.log('idle 3s: TaskDuration',(z.TaskDuration-a.TaskDuration).toFixed(2),'s  ScriptDuration',(z.ScriptDuration-a.ScriptDuration).toFixed(2),'s');await b.close()})();
