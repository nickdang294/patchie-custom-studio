const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const items=Array.from({length:14},(_,i)=>({id:id(i+1),kind:'collection',name:`Bộ patch ${i+1}`,thumbnail_url:'/assets/patch-pink-cap.webp',image_url:'/assets/patch-pink-cap.webp',group_ids:[id(100)],patch_items:[{patch_id:'a',quantity:2}],description:'Bộ patch cố định',shopee_url:'https://shopee.vn/product/1/2',includes_base:false,active:true}));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const width of [390,1360]){const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/storefront?**',route=>{const u=new URL(route.request().url()),selected=u.searchParams.get('id'),offset=Number(u.searchParams.get('offset')||0);return route.fulfill({json:selected?{item:items.find(x=>x.id===selected),patches:[{id:'a',name:'Patch mẫu',thumbnail_url:'/assets/patch-pink-cap.webp'}],design:null,related:null,relatedLooks:[]}:{items:items.slice(offset,offset+12),hasMore:offset===0,groups:[{id:id(100),name:'K-pop'}]}});});
await page.goto('http://127.0.0.1:3000/patches');await page.getByRole('button',{name:'Tất cả',exact:true}).click();await page.locator('.sf-card').first().waitFor();assert.equal(await page.locator('.sf-card').count(),12);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.getByRole('button',{name:/Xem thêm 12/}).click();await page.waitForFunction(()=>document.querySelectorAll('.sf-card').length===14);
await page.locator('.sf-card').first().click();await page.locator('.sf-buy').waitFor();assert.equal(await page.locator('.sf-buy').getAttribute('href'),'https://shopee.vn/product/1/2');await page.screenshot({path:`../storefront-detail-${width}.png`,fullPage:true});
await page.getByRole('button',{name:'Đóng chi tiết'}).click();assert.equal(await page.locator('dialog').count(),0);await page.screenshot({path:`../storefront-catalog-${width}.png`,fullPage:true});
assert.deepEqual(errors,[]);await page.close();console.log(width,'pagination, modal, link, layout passed');}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
